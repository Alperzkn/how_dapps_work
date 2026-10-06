import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Group } from 'three';
import {
  Anim,
  Ball,
  Block,
  Box,
  ChainLink,
  FlowLine,
  Label,
  Mover,
  NodeTower,
  Packet,
  Platform,
  ShadowGround,
  Wallet,
  useLoop,
  useScene,
  type Vec3,
} from '../../scene/kit';
import type { SceneProps } from '../../scene/types';
import type { ColorKey } from '../../theme/tokens';
import {
  buildGraph,
  checkBlock,
  CHECK_ORDER,
  CUT_AFTER,
  DEFECTS,
  demoView,
  followers,
  gossip,
  ledgerStatus,
  makeBlock,
  MAX_BRANCH,
  offlineSet,
  peerStanding,
  staleBlocks,
  type CheckResult,
  type Defect,
  type Edge,
  type NodeKind,
} from './logic';
import { MAX_FANOUT, MIN_FANOUT, NODE_COUNT, useNetwork } from './state';

interface NodeDef {
  pos: Vec3;
  light?: boolean;
  /** Which of the two competing blocks this node hears first. */
  side: 'A' | 'B';
}

// 0-5 form a ring, 6 sits in the middle, 7-8 are light nodes hanging off one peer each.
const NODES: NodeDef[] = [
  { pos: [-4.6, 0, -0.8], side: 'A' },
  { pos: [-1.6, 0, -3.6], side: 'A' },
  { pos: [2.2, 0, -3.2], side: 'B' },
  { pos: [4.8, 0, 0], side: 'B' },
  { pos: [2.4, 0, 3.4], side: 'B' },
  { pos: [-1.8, 0, 3.2], side: 'A' },
  { pos: [0.2, 0, 0], side: 'A' },
  { pos: [-5.4, 0, 2.6], side: 'A', light: true },
  { pos: [5.6, 0, -3], side: 'B', light: true },
];
const CENTER = 6;
const CHEAT = 2;
/** The largest machine on the map: taller than the rest, and no more important. */
const BIG = 2;
/** The order in which the slider switches nodes off; the biggest one is left for last. */
const OFF_ORDER = [1, 7, 5, 3, 0, 8, 4, 6];
const EDGES: Edge[] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [6, 0], [6, 2], [6, 4], [0, 7], [3, 8],
];
const KINDS: NodeKind[] = NODES.map((n) => (n.light ? 'light' : 'full'));
const POINTS = NODES.map((n) => ({ x: n.pos[0], z: n.pos[2] }));
const GROUP_A = NODES.filter((n) => n.side === 'A').length;
const GROUP_B = NODES.length - GROUP_A;
const CENTER_PEERS = EDGES.filter(([a, b]) => a === CENTER || b === CENTER).length;

const topOf = (i: number, lift = 0): Vec3 => {
  const n = NODES[i];
  return [n.pos[0], (n.light ? 0.55 : 1.45) + lift, n.pos[2]];
};
const ground = (i: number): Vec3 => [NODES[i].pos[0], 0.05, NODES[i].pos[2]];

const IN_PATH: Vec3[] = [topOf(0), topOf(CENTER)];
const OUT_PATHS: Vec3[][] = [
  [topOf(CENTER), topOf(2)],
  [topOf(CENTER), topOf(4)],
];
const BAD_TARGETS = [CENTER, 3];
const BAD_PATHS: Vec3[][] = BAD_TARGETS.map((i) => [topOf(CHEAT), topOf(i)]);

// The fork diagram in front of the map.
const FS = 0.95;
const K0: Vec3 = [0, 0, 7.4];
const K1: Vec3 = [1.75, 0, 7.4];
const ROW_Z = { A: 6.05, B: 8.75 };
const rowX = (i: number) => 3.7 + i * 1.6;
/** A point that projects above the back row of nodes, centred. */
const CAPTION: Vec3 = [-2.6, 3.8, -2.6];
const mid = (p: Vec3, dx: number, dz = 0): Vec3 => [p[0] + dx, FS / 2, p[2] + dz];

/**
 * Steps through timed phases in a loop, starting again from 0 whenever `resetKey` changes.
 * With reduced motion it stays on `rest`.
 */
function usePhase(durations: readonly number[], active: boolean, rest: number, resetKey = '') {
  const { reducedMotion } = useScene();
  const [phase, setPhase] = useState(rest);
  const cur = useRef(rest);
  const start = useRef<number | null>(null);
  const first = useRef(true);
  useEffect(() => {
    start.current = null;
    if (first.current) {
      first.current = false;
      return;
    }
    cur.current = 0;
    setPhase(0);
  }, [active, resetKey]);
  useLoop((t) => {
    start.current ??= t;
    const total = durations.reduce((a, b) => a + b, 0);
    let local = (t - start.current) % total;
    let i = 0;
    while (i < durations.length - 1 && local >= durations[i]) {
      local -= durations[i];
      i++;
    }
    if (i !== cur.current) {
      cur.current = i;
      setPhase(i);
    }
  }, active);
  return reducedMotion ? rest : Math.min(phase, durations.length - 1);
}

const HOP_TIME = 0.9;
// arrive, three checks, verdict, forward, settle, reset
const VERIFY = [1.2, 0.7, 0.7, 0.7, 1, 1.2, 0.6, 0.3];
const VERIFY_RESET = 7;

/** One trip along a path, visible only while `show`; resets while hidden. */
function Hop({ path, show, playing, duration, children }: { path: Vec3[]; show: boolean; playing: boolean; duration: number; children: ReactNode }) {
  return (
    <Anim show={show} speed={9}>
      <Mover path={path} duration={duration} loop={false} arc={0.7} playing={playing}>
        {children}
      </Mover>
    </Anim>
  );
}

/** A node's copy of the ledger, floating above it. Light nodes keep thin headers only. */
function MiniChain({ light = false, offset = 0 }: { light?: boolean; offset?: number }) {
  const ref = useRef<Group>(null);
  useLoop((t) => {
    if (ref.current) ref.current.position.y = Math.sin(t * 1.6 + offset) * 0.07;
  });
  return (
    <group ref={ref}>
      {[-0.36, 0, 0.36].map((x) => (
        <Box key={x} size={[0.28, light ? 0.08 : 0.28, 0.28]} position={[x, 0, 0]} color="block" glow radius={0.04} />
      ))}
      <Box size={[0.8, 0.04, 0.04]} color="chain" radius={0.01} />
    </group>
  );
}

/** A machine that has been switched off: a faint outline with no lights. */
function DarkTower({ units }: { units: number }) {
  return (
    <group>
      {Array.from({ length: units }, (_, i) => (
        <Box key={i} size={[1, 0.36, 1]} position={[0, 0.22 + i * 0.44, 0]} color="neutral" opacity={0.28} radius={0.06} />
      ))}
    </group>
  );
}

type Check = 'idle' | 'ok' | 'bad';

/** The rule book a node runs on every block: one light per rule. */
function Checklist({ states }: { states: Check[] }) {
  return (
    <group rotation={[0, Math.PI / 4, 0]}>
      <Box size={[1.5, 1.5, 0.1]} position={[0, 0.75, 0]} color="platform" radius={0.06} />
      {states.map((s, i) => (
        <group key={i} position={[0, 1.15 - i * 0.4, 0.07]}>
          <Ball radius={0.12} position={[-0.48, 0, 0]} color={s === 'ok' ? 'valid' : s === 'bad' ? 'invalid' : 'neutral'} glow={s !== 'idle'} />
          <Box size={[0.75, 0.08, 0.03]} position={[0.2, 0, 0]} color="neutral" radius={0.02} />
        </group>
      ))}
    </group>
  );
}

const mark = (s: Check) => (s === 'ok' ? '✓ ' : s === 'bad' ? '✗ ' : '· ');
/** Which checks have been run so far, `phase` being the step of the timeline. */
const shownChecks = (result: CheckResult, phase: number): Check[] =>
  result.checks.map((c, i) => (phase > i && phase < VERIFY_RESET && c !== 'skipped' ? c : 'idle'));
const badDefect = (d: Defect): Defect => (d === 'none' ? 'balance' : d);
const signed = (n: number) => (n < 0 ? `−${Math.abs(n)}` : `${n}`);

export default function Scene({ stepId, level, labels }: SceneProps) {
  const isCopies = stepId === 'copies';
  const isGossip = stepId === 'gossip';
  const isVerify = stepId === 'verify';
  const isReject = stepId === 'reject';
  const isForks = stepId === 'forks';
  const expert = level === 'expert';
  const beginner = level === 'beginner';
  const { compact } = useScene();

  const offline = useNetwork((s) => s.offline);
  const bigDown = useNetwork((s) => s.bigDown);
  const origin = useNetwork((s) => s.origin);
  const fanout = useNetwork((s) => s.fanout);
  const wave = useNetwork((s) => s.wave);
  const defect = useNetwork((s) => s.defect);
  const badSent = useNetwork((s) => s.badSent);
  const fork = useNetwork((s) => s.fork);

  // Step 1: which machines are off.
  const off = useMemo(() => offlineSet(NODE_COUNT, OFF_ORDER, offline - (bigDown ? 1 : 0), bigDown ? BIG : null), [offline, bigDown]);
  const ledger = ledgerStatus(KINDS, off);
  const isOff = (i: number) => isCopies && off[i];

  // Step 2: the peer graph for this fan-out and the flood from the chosen node.
  const graph = useMemo(() => buildGraph(POINTS, fanout), [fanout]);
  const flood = useMemo(() => gossip(NODE_COUNT, graph, origin), [graph, origin]);
  const hops = flood.hops;
  const gossipTimes = useMemo(() => [HOP_TIME, ...Array.from({ length: hops }, () => HOP_TIME), 2.4, 0.4], [hops]);
  const g = usePhase(gossipTimes, isGossip, hops + 1, `${origin}-${fanout}-${wave}`);
  const gossipDone = g === hops + 1;
  const gossipReset = g > hops + 1;
  const walletAt: Vec3 = [NODES[origin].pos[0] - 1.5, 0, NODES[origin].pos[2] + 0.9];
  const fromWallet = useMemo<Vec3[]>(() => [[NODES[origin].pos[0] - 1.5, 1, NODES[origin].pos[2] + 0.9], topOf(origin)], [origin]);
  const hopPaths = useMemo(
    () =>
      graph.flatMap(([a, b]) => {
        const da = flood.dist[a];
        const db = flood.dist[b];
        if (da === db || da < 0 || db < 0) return [];
        const [from, to] = da < db ? [a, b] : [b, a];
        return [{ key: `${origin}-${fanout}-${from}-${to}`, path: [topOf(from), topOf(to)] as Vec3[], phase: flood.dist[to] }];
      }),
    [graph, flood, origin, fanout],
  );
  const hasMessage = (i: number) => g > flood.dist[i] && !gossipReset;

  // Steps 3-4: one block, checked for real.
  const view = useMemo(demoView, []);
  const verifyResult = useMemo(() => checkBlock(makeBlock(defect), view), [defect, view]);
  const rejectResult = useMemo(() => checkBlock(makeBlock(badDefect(defect)), view), [defect, view]);
  const standing = peerStanding(badSent);
  const cut = standing.standing === 'cut';
  const v = usePhase(VERIFY, isVerify, verifyResult.valid ? 5 : 4, defect);
  const r = usePhase(VERIFY, isReject, 4, `${badDefect(defect)}-${badSent}`);
  const result = isReject ? rejectResult : verifyResult;
  const phase = isReject ? r : v;
  const checks: Check[] = isVerify || (isReject && !cut) ? shownChecks(result, phase) : ['idle', 'idle', 'idle'];
  const live = phase < VERIFY_RESET;
  const accepted = isVerify && verifyResult.valid && v >= 4 && live;
  const rejected = live && ((isVerify && !verifyResult.valid && v > verifyResult.failed) || (isReject && !cut && r > rejectResult.failed));
  const checkText: Record<(typeof CHECK_ORDER)[number], string> = expert
    ? { parent: 'parentHash = H(parent)', signature: 'verify(sig, pubKey)', balance: 'balance ≥ amount' }
    : { parent: labels.check3, signature: labels.check1, balance: labels.check2 };

  // Step 5.
  const stale = staleBlocks(fork);
  const onBranch = followers(fork, GROUP_A, GROUP_B);
  const tie = fork.a === fork.b;
  const winner = tie ? null : fork.a > fork.b ? 'A' : 'B';
  const reorgNode = fork.switched[0] && fork.switched[1] ? CENTER : fork.switched[0] ? 0 : 3;

  const towerColor = (i: number): ColorKey => {
    if (isGossip) return hasMessage(i) ? 'tx' : 'neutral';
    if (isVerify) {
      if (i === 0) return verifyResult.valid ? 'valid' : 'invalid';
      if (i === CENTER && accepted) return 'valid';
      if ((i === 2 || i === 4) && verifyResult.valid && v === 6) return 'valid';
    }
    if (isReject && i === CHEAT) return 'invalid';
    return 'neutral';
  };
  // Branch B borrows the teal token colour so it cannot be mistaken for a grey, stale block.
  const tipColor = (i: number): ColorKey => (fork.follow[NODES[i].side === 'A' ? 0 : 1] === 'A' ? 'block' : 'tokenB');

  const edges = isGossip ? graph : EDGES;
  const edgeShown = ([a, b]: Edge) => {
    if (isCopies) return !off[a] && !off[b];
    if (isReject && cut) return a !== CHEAT && b !== CHEAT;
    return true;
  };
  const edgeColor = ([a, b]: Edge): ColorKey => (isReject && (a === CHEAT || b === CHEAT) && (rejected || badSent > 1) ? 'invalid' : 'chain');

  // On a phone the controls cover the lower part of the canvas, so the scene shrinks and moves up.
  const fit = compact ? (isForks ? 0.76 : 0.7) : 1;
  const lift = compact ? (isForks ? 2.3 : isVerify || isReject ? 3 : 2.6) : 0;
  const slide = 0;

  return (
    <Anim position={[slide, lift, 0]} scale={fit} speed={5}>
      <ShadowGround />
      <Platform size={[15.4, 9.8]} position={[-0.6, 0, 0]} color="ground" height={0.25} />

      {/* Peer links. */}
      {edges.filter(edgeShown).map((e) => (
        <FlowLine key={`${isGossip ? fanout : 'base'}-${e[0]}-${e[1]}`} points={[ground(e[0]), ground(e[1])]} color={edgeColor(e)} dashed arrow={false} width={2} />
      ))}

      {/* The nodes. */}
      {NODES.map((n, i) => {
        const units = n.light ? 1 : isCopies && i === BIG ? 5 : 3;
        const dark = isOff(i) || (isReject && cut && i === CHEAT);
        const top = n.light ? 1.05 : 0.63 + units * 0.44;
        return (
          <group key={i} position={n.pos}>
            <group scale={n.light ? 0.8 : 1}>
              {dark ? (
                <DarkTower units={units} />
              ) : (
                <NodeTower units={units} color={towerColor(i)} glow={towerColor(i) !== 'neutral'} light={isReject && i === CHEAT ? 'invalid' : 'valid'} />
              )}
            </group>
            <Anim position={[0, top, 0]} show={isCopies && !off[i]} speed={4 + i * 0.5}>
              <MiniChain light={n.light} offset={i} />
            </Anim>
            {/* Step 2: every node carries its number so the origin can be picked by name. */}
            <Label position={[0, n.light ? 1.2 : 2.1, 0]} show={isGossip} tone={hasMessage(i) ? 'tx' : 'plain'}>
              {i + 1}
            </Label>
            {/* Step 5: which tip this node currently follows. */}
            <Anim position={[0, n.light ? 0.75 : 1.65, 0]} show={isForks} speed={5}>
              <Box size={[0.42, 0.42, 0.42]} color={tipColor(i)} glow radius={0.07} />
            </Anim>
          </group>
        );
      })}

      {/* Step 1 captions. */}
      <Label position={CAPTION} show={isCopies} tone={ledger.online < NODE_COUNT ? 'valid' : 'default'}>
        {ledger.online === NODE_COUNT ? (
          labels.sameCopy
        ) : (
          <>
            {NODE_COUNT - ledger.online}/{NODE_COUNT} {labels.offlineShort}
            <br />
            {ledger.available ? labels.stillWhole : labels.lost}
          </>
        )}
      </Label>
      <Label position={[NODES[5].pos[0] - 1.4, 0.8, NODES[5].pos[2] + 1.4]} show={isCopies && !off[5]} minLevel="intermediate">
        {labels.fullNode}
        {expert && (
          <>
            <br />
            {labels.fullDetail}
          </>
        )}
      </Label>
      <Label position={[NODES[7].pos[0] - 0.2, 2.2, NODES[7].pos[2] + 0.2]} show={isCopies && !off[7]} minLevel="intermediate">
        {labels.lightNode}
        {expert && (
          <>
            <br />
            {labels.lightDetail}
          </>
        )}
      </Label>
      <Label position={[NODES[3].pos[0] + 0.6, -0.6, NODES[3].pos[2] + 1]} show={isCopies && !off[3]} maxLevel="beginner" tone="plain">
        {labels.noBoss}
      </Label>
      <Label position={[NODES[BIG].pos[0] + 1.5, 1.6, NODES[BIG].pos[2] - 1.5]} show={isCopies} tone={off[BIG] ? 'invalid' : 'plain'}>
        {off[BIG] ? labels.biggestDown : labels.biggest}
      </Label>

      {/* Step 2: a transaction spreads hop by hop from the chosen node. */}
      <Anim position={walletAt} show={isGossip} speed={5}>
        <group scale={0.8}>
          <Wallet color="actor" />
        </group>
        <Label position={[0, 1.6, 0]} tone="tx" show={!compact}>
          {labels.newTx}
        </Label>
      </Anim>
      <Hop key={`w-${origin}`} path={fromWallet} show={isGossip && g === 0} playing={isGossip && !gossipReset} duration={HOP_TIME}>
        <Packet size={0.4} />
      </Hop>
      {isGossip &&
        hopPaths.map((h) => (
          <Hop key={h.key} path={h.path} show={g === h.phase} playing={g >= h.phase && !gossipReset} duration={HOP_TIME}>
            <Packet size={0.4} />
          </Hop>
        ))}
      <Label position={CAPTION} show={isGossip && (g === 0 || gossipReset)} tone="plain">
        {labels.peers}
      </Label>
      <Label position={CAPTION} show={isGossip && g >= 1 && g <= hops} tone="tx">
        {labels.hop} {g}: {flood.reached[Math.max(0, g - 1)]}/{NODE_COUNT} → {flood.reached[Math.min(g, hops)]}/{NODE_COUNT}
      </Label>
      <Label position={CAPTION} show={isGossip && gossipDone} tone="tx">
        {labels.everyone} · {hops} {labels.hopsUnit}
      </Label>
      <Label position={[7.2, 0.4, 1.8]} show={isGossip && !compact} maxLevel="intermediate" tone="plain">
        {graph.length} {labels.links} · {hops} {labels.hopsUnit}
      </Label>
      <Label position={[7.2, 0.4, 1.8]} show={isGossip && !compact} minLevel="expert" tone="mono">
        {graph.length} {labels.links} · {hops} {labels.hopsUnit}
        <br />
        inv → getdata → tx
        <br />
        gossipsub D = 8
      </Label>

      {/* Steps 3-4: the centre node runs its checks. */}
      <Anim position={[NODES[CENTER].pos[0], 2.7, NODES[CENTER].pos[2]]} show={isVerify || (isReject && !cut)} speed={5}>
        <Checklist states={checks} />
        <Label position={[0, 2.5, 0]} tone={accepted ? 'valid' : rejected ? 'invalid' : expert ? 'mono' : 'default'}>
          {CHECK_ORDER.map((name, i) => (
            <span key={name}>
              {i > 0 && <br />}
              {mark(checks[i])}
              {checkText[name]}
            </span>
          ))}
          {(accepted || rejected) && (
            <>
              <br />
              {accepted ? labels.accepted : beginner ? labels.rejected : `${labels.rejected} · ${labels.notForwarded}`}
            </>
          )}
        </Label>
      </Anim>

      {/* Step 3: the block arrives; it is passed on only if every check passes. */}
      <Hop key={`in-${defect}`} path={IN_PATH} show={isVerify && (verifyResult.valid ? v <= 4 : !rejected && v < VERIFY_RESET)} playing={isVerify && v < VERIFY_RESET} duration={VERIFY[0]}>
        <Block size={0.7} color={verifyResult.valid ? 'block' : 'invalid'} glow />
      </Hop>
      {OUT_PATHS.map((p, i) => (
        <Hop key={i} path={p} show={isVerify && verifyResult.valid && v === 5} playing={isVerify && v >= 5 && v < VERIFY_RESET} duration={VERIFY[5]}>
          <Block size={0.7} color="block" glow />
        </Hop>
      ))}
      <Label position={[NODES[0].pos[0], 2.4, NODES[0].pos[2]]} show={isVerify && v === 0} tone={verifyResult.valid ? 'block' : 'invalid'}>
        {labels.newBlock}
      </Label>
      <Label position={[NODES[4].pos[0], 2.3, NODES[4].pos[2]]} show={isVerify && rejected} tone="plain">
        {labels.unaware}
      </Label>
      <Label position={[NODES[4].pos[0], 2.3, NODES[4].pos[2]]} show={isVerify && verifyResult.valid && v >= 5 && v < VERIFY_RESET} tone="valid">
        {labels.gotIt}
      </Label>

      {/* Step 4: a block that breaks a rule stops at the first honest node. */}
      {BAD_PATHS.map((p, i) => (
        <group key={i}>
          <Hop key={`${badSent}-${badDefect(defect)}`} path={p} show={isReject && !cut && !rejected && r < VERIFY_RESET} playing={isReject && !cut && r < VERIFY_RESET} duration={VERIFY[0]}>
            <Block size={0.7} color="invalid" glow />
          </Hop>
          <Anim position={topOf(BAD_TARGETS[i], 1.25)} show={isReject && rejected && i > 0} speed={8}>
            <Ball radius={0.2} color="invalid" glow />
          </Anim>
        </group>
      ))}
      <Anim position={topOf(CENTER, 1.25)} show={isVerify && rejected} speed={8}>
        <Ball radius={0.2} color="invalid" glow />
      </Anim>
      <Label position={[NODES[CHEAT].pos[0] + 1.7, 0.6, NODES[CHEAT].pos[2] - 1.7]} show={isReject} tone="invalid">
        {labels.cheater}
        <br />
        {cut ? labels.standingCut : `${labels.badCount} ${badSent}`}
        {!beginner && (
          <>
            <br />
            {labels.score} {signed(standing.score)}
          </>
        )}
      </Label>
      <Label position={[NODES[4].pos[0], 2.3, NODES[4].pos[2]]} show={isReject} tone="plain">
        {labels.unaware}
      </Label>
      <Label position={[NODES[CENTER].pos[0], 2.6, NODES[CENTER].pos[2]]} show={isReject && cut} tone="valid">
        {labels.ignored}
      </Label>

      {/* Step 5: two branches; the learner decides where each new block lands. */}
      <Anim show={isForks}>
        <Platform size={[10.4, 4.7]} position={[4.2, 0, 7.4]} color="ground" height={0.25} />
        <group position={K0}>
          <Block size={FS} color="block" />
          <Label position={[0, -0.5, 1]} show={!compact} minLevel="intermediate" tone="valid">
            {labels.finalized}
          </Label>
        </group>
        <group position={K1}>
          <Block size={FS} color="block" />
        </group>
        <ChainLink from={mid(K0, FS / 2)} to={mid(K1, -FS / 2)} />
        <ChainLink from={mid(K1, FS / 2, -0.2)} to={[rowX(0) - FS / 2, FS / 2, ROW_Z.A + 0.1]} color={stale.a ? 'neutral' : 'chain'} />
        <ChainLink from={mid(K1, FS / 2, 0.2)} to={[rowX(0) - FS / 2, FS / 2, ROW_Z.B - 0.1]} color={stale.b ? 'neutral' : 'chain'} />
        {(['A', 'B'] as const).map((side) => {
          const count = side === 'A' ? fork.a : fork.b;
          const dead = (side === 'A' ? stale.a : stale.b) > 0;
          const color: ColorKey = dead ? 'neutral' : side === 'A' ? 'block' : 'tokenB';
          const z = ROW_Z[side];
          return (
            <group key={side}>
              {Array.from({ length: MAX_BRANCH }, (_, i) => (
                <Anim key={i} position={[rowX(i), 0, z]} show={i < count} speed={7}>
                  {i > 0 && <ChainLink from={[-1.6 + FS / 2, FS / 2, 0]} to={[-FS / 2, FS / 2, 0]} color={dead ? 'neutral' : 'chain'} />}
                  <Block size={FS} color={color} glow={!dead} />
                </Anim>
              ))}
              <Anim position={[rowX(count - 1), FS + 0.6, z]} speed={7}>
                <Label tone={dead ? 'invalid' : winner === side ? 'valid' : side === 'A' ? 'block' : 'tokenB'}>
                  {side}
                  {!beginner && !compact && ` · ${labels.work} ${count}`}
                  {dead && ` · ${labels.stale}`}
                  {beginner && winner === side && ' ✓'}
                </Label>
              </Anim>
            </group>
          );
        })}
        <Label position={compact ? [-1, 3, -1] : [-3.4, 0.6, 6.2]} tone={tie ? 'default' : 'valid'}>
          {tie ? (fork.a === 1 ? labels.tie : labels.tieHold) : winner === 'A' ? labels.allOnA : labels.allOnB}
          {!beginner && (
            <>
              <br />A {onBranch.a} · B {onBranch.b} {labels.nodesUnit}
            </>
          )}
        </Label>
        <Label position={[NODES[reorgNode].pos[0], 2.6, NODES[reorgNode].pos[2]]} show={fork.reorgDepth > 0 && !compact} minLevel="intermediate">
          {labels.reorg} {fork.reorgDepth}
        </Label>
        <Label position={[7.4, 0.4, 2.4]} show={!compact} minLevel="expert" tone="mono">
          BTC: max Σ work
          <br />
          ETH: LMD-GHOST
        </Label>
      </Anim>
    </Anim>
  );
}

function Stat({ name, tone, children }: { name: string; tone?: 'good' | 'bad'; children: ReactNode }) {
  return (
    <div className="ctl-stat">
      <span>{name}</span>
      <strong data-tone={tone}>{children}</strong>
    </div>
  );
}

const PANEL = { gap: '4px 12px', maxWidth: 600 } as const;
const STATS = { flexBasis: '100%', gap: '2px 14px' } as const;
const short = (hex: string) => `${hex.replace(/^0x/, '').slice(0, 6)}…`;

function CopiesControls({ labels }: SceneProps) {
  const offline = useNetwork((s) => s.offline);
  const bigDown = useNetwork((s) => s.bigDown);
  const setOffline = useNetwork((s) => s.setOffline);
  const setBigDown = useNetwork((s) => s.setBigDown);
  const off = offlineSet(NODE_COUNT, OFF_ORDER, offline - (bigDown ? 1 : 0), bigDown ? BIG : null);
  const ledger = ledgerStatus(KINDS, off);
  return (
    <div className="ctl" style={PANEL}>
      <div className="ctl-title">{labels.tryCopies}</div>
      <label className="ctl-field" style={{ minWidth: 120 }}>
        <span>
          {labels.offlineCount}: {NODE_COUNT - ledger.online} / {NODE_COUNT}
        </span>
        <input type="range" min={0} max={NODE_COUNT - 1} step={1} value={offline} onChange={(e) => setOffline(Number(e.target.value))} />
      </label>
      <label className="ctl-check">
        <input type="checkbox" checked={bigDown} onChange={(e) => setBigDown(e.target.checked)} />
        {labels.shutBig}
      </label>
      <div className="ctl-stats" style={STATS}>
        <Stat name={labels.fullLeft}>{ledger.fullOnline}</Stat>
        <Stat name={labels.lightLeft}>{ledger.lightOnline}</Stat>
        <Stat name={labels.ledgerState} tone={ledger.available ? 'good' : 'bad'}>
          {ledger.available ? `${labels.available} ✓` : labels.unavailable}
        </Stat>
      </div>
    </div>
  );
}

function GossipControls({ labels }: SceneProps) {
  const origin = useNetwork((s) => s.origin);
  const fanout = useNetwork((s) => s.fanout);
  const setOrigin = useNetwork((s) => s.setOrigin);
  const setFanout = useNetwork((s) => s.setFanout);
  const send = useNetwork((s) => s.send);
  const graph = useMemo(() => buildGraph(POINTS, fanout), [fanout]);
  const flood = gossip(NODE_COUNT, graph, origin);
  return (
    <div className="ctl" style={PANEL}>
      <div className="ctl-title">{labels.tryGossip}</div>
      <label className="ctl-field" style={{ minWidth: 104, flex: '0 1 124px' }}>
        <span>{labels.originNode}</span>
        <select value={origin} onChange={(e) => setOrigin(Number(e.target.value))} style={{ minHeight: 32, minWidth: 0 }}>
          {NODES.map((n, i) => (
            <option key={i} value={i}>
              {labels.nodeName} {i + 1}
              {n.light ? ` (${labels.lightTag})` : ''}
            </option>
          ))}
        </select>
      </label>
      <label className="ctl-field" style={{ minWidth: 150 }}>
        <span>
          {labels.fanout}: {fanout} · {graph.length} {labels.links}
        </span>
        <input type="range" min={MIN_FANOUT} max={MAX_FANOUT} step={1} value={fanout} onChange={(e) => setFanout(Number(e.target.value))} />
      </label>
      <button type="button" className="btn btn-primary" onClick={send}>
        {labels.sendTx}
      </button>
      <div className="ctl-stats">
        <Stat name={labels.hopsNeeded}>{flood.hops}</Stat>
        <Stat name={labels.afterEachHop}>{flood.reached.join(' → ')}</Stat>
      </div>
    </div>
  );
}

function VerifyControls({ labels }: SceneProps) {
  const defect = useNetwork((s) => s.defect);
  const setDefect = useNetwork((s) => s.setDefect);
  const block = makeBlock(defect);
  const view = demoView();
  const result = checkBlock(block, view);
  const failedName = result.failed < 0 ? null : CHECK_ORDER[result.failed];
  const checkNames = { parent: labels.check3, signature: labels.check1, balance: labels.check2 };
  const names: Record<Defect, string> = { none: labels.defectNone, signature: labels.defectSignature, balance: labels.defectBalance, parent: labels.defectParent };
  const detail =
    failedName === 'parent'
      ? `${short(block.parentHash)} ≠ ${short(view.tipHash)}`
      : failedName === 'signature'
        ? labels.sigMismatch
        : failedName === 'balance'
          ? `${block.tx.amount} > ${view.balance}`
          : `${short(block.parentHash)} = ${short(view.tipHash)} · ${block.tx.amount} ≤ ${view.balance}`;
  return (
    <div className="ctl" style={PANEL}>
      <div className="ctl-title">{labels.tryVerify}</div>
      <div className="seg" role="group" aria-label={labels.tryVerify} style={{ flexWrap: 'wrap' }}>
        {DEFECTS.map((d) => (
          <button key={d} type="button" aria-pressed={defect === d} data-defect={d} onClick={() => setDefect(d)}>
            {names[d]}
          </button>
        ))}
      </div>
      <div className="ctl-stats" style={STATS}>
        <Stat name={labels.decision} tone={result.valid ? 'good' : 'bad'}>
          {failedName ? `✗ ${checkNames[failedName]}: ${labels.drops}` : `✓ ${labels.forwards} ${CENTER_PEERS - 1}`}
        </Stat>
        <Stat name={labels.evidence}>{detail}</Stat>
      </div>
    </div>
  );
}

function RejectControls({ labels }: SceneProps) {
  const badSent = useNetwork((s) => s.badSent);
  const sendBad = useNetwork((s) => s.sendBad);
  const resetBad = useNetwork((s) => s.resetBad);
  const s = peerStanding(badSent);
  const text = s.standing === 'cut' ? labels.standingCut : s.standing === 'pruned' ? labels.standingPruned : labels.standingOk;
  return (
    <div className="ctl" style={PANEL}>
      <div className="ctl-title">{labels.tryReject}</div>
      <button type="button" className="btn btn-primary" onClick={sendBad} disabled={badSent >= CUT_AFTER}>
        {labels.sendBad}
      </button>
      <button type="button" className="btn" onClick={resetBad} disabled={badSent <= 1}>
        {labels.reset}
      </button>
      <div className="ctl-stats" style={STATS}>
        <Stat name={labels.badSentStat}>{badSent}</Stat>
        <Stat name={labels.score} tone="bad">
          {signed(s.score)}
        </Stat>
        <Stat name={labels.neighbours} tone={s.standing === 'cut' ? 'bad' : undefined}>
          {text}
        </Stat>
      </div>
    </div>
  );
}

function ForkControls({ labels, level }: SceneProps) {
  const fork = useNetwork((s) => s.fork);
  const land = useNetwork((s) => s.land);
  const resetFork = useNetwork((s) => s.resetFork);
  const on = followers(fork, GROUP_A, GROUP_B);
  const stale = staleBlocks(fork);
  const untouched = fork.a === 1 && fork.b === 1;
  return (
    <div className="ctl" style={PANEL}>
      <div className="ctl-title">{labels.tryForks}</div>
      <button type="button" className="btn btn-primary" data-land="A" onClick={() => land('A')} disabled={fork.a >= MAX_BRANCH}>
        {labels.landA}
      </button>
      <button type="button" className="btn btn-primary" data-land="B" onClick={() => land('B')} disabled={fork.b >= MAX_BRANCH}>
        {labels.landB}
      </button>
      <button type="button" className="btn" onClick={resetFork} disabled={untouched}>
        {labels.reset}
      </button>
      <div className="ctl-stats" style={STATS}>
        <Stat name={labels.nodesOn}>
          A {on.a} · B {on.b}
        </Stat>
        {level !== 'beginner' && (
          <Stat name={labels.workStat}>
            A {fork.a} · B {fork.b}
          </Stat>
        )}
        <Stat name={labels.reorgDepth} tone={fork.reorgDepth > 1 ? 'bad' : undefined}>
          {fork.reorgDepth}
        </Stat>
        <Stat name={labels.staleStat} tone={stale.total ? 'bad' : undefined}>
          {stale.total}
        </Stat>
      </div>
    </div>
  );
}

export function Controls(props: SceneProps) {
  switch (props.stepId) {
    case 'copies':
      return <CopiesControls {...props} />;
    case 'gossip':
      return <GossipControls {...props} />;
    case 'verify':
      return <VerifyControls {...props} />;
    case 'reject':
      return <RejectControls {...props} />;
    case 'forks':
      return <ForkControls {...props} />;
    default:
      return null;
  }
}
