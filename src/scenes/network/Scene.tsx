import { useEffect, useRef, useState, type ReactNode } from 'react';
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
  type Vec3,
} from '../../scene/kit';
import type { SceneProps } from '../../scene/types';
import type { ColorKey } from '../../theme/tokens';

interface NodeDef {
  pos: Vec3;
  light?: boolean;
  /** Gossip phase in which the message reaches this node. */
  hop: number;
  /** Which of the two competing blocks this node hears first. */
  side: 'A' | 'B';
}

// 0-5 form a ring, 6 sits in the middle, 7-8 are light nodes hanging off one peer each.
const NODES: NodeDef[] = [
  { pos: [-4.6, 0, -0.8], hop: 0, side: 'A' },
  { pos: [-1.6, 0, -3.6], hop: 1, side: 'A' },
  { pos: [2.2, 0, -3.2], hop: 2, side: 'B' },
  { pos: [4.8, 0, 0], hop: 3, side: 'B' },
  { pos: [2.4, 0, 3.4], hop: 2, side: 'B' },
  { pos: [-1.8, 0, 3.2], hop: 1, side: 'A' },
  { pos: [0.2, 0, 0], hop: 1, side: 'A' },
  { pos: [-5.4, 0, 2.6], hop: 1, side: 'A', light: true },
  { pos: [5.6, 0, -3], hop: 4, side: 'B', light: true },
];
const CENTER = 6;
const CHEAT = 2;
const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [6, 0], [6, 2], [6, 4], [0, 7], [3, 8],
];
const WALLET: Vec3 = [-7, 0, -0.4];

const topOf = (i: number, lift = 0): Vec3 => {
  const n = NODES[i];
  return [n.pos[0], (n.light ? 0.55 : 1.45) + lift, n.pos[2]];
};
const ground = (i: number): Vec3 => [NODES[i].pos[0], 0.05, NODES[i].pos[2]];

/** Gossip: [from, to, phase]. Some nodes hear the same message twice; that is normal. */
const HOPS: { path: Vec3[]; phase: number }[] = (
  [
    [0, 1, 1], [0, 5, 1], [0, 6, 1], [0, 7, 1],
    [1, 2, 2], [6, 2, 2], [5, 4, 2], [6, 4, 2],
    [2, 3, 3], [4, 3, 3],
    [3, 8, 4],
  ] as [number, number, number][]
).map(([a, b, phase]) => ({ path: [topOf(a), topOf(b)], phase }));
const FROM_WALLET: Vec3[] = [[WALLET[0], 1.1, WALLET[2]], topOf(0)];

const IN_PATH: Vec3[] = [topOf(0), topOf(CENTER)];
const OUT_PATHS: Vec3[][] = [
  [topOf(CENTER), topOf(2)],
  [topOf(CENTER), topOf(4)],
];
const BAD_TARGETS = [CENTER, 3];
const BAD_PATHS: Vec3[][] = BAD_TARGETS.map((i) => [topOf(CHEAT), topOf(i)]);

// The fork diagram in front of the map.
const K0: Vec3 = [0.6, 0, 7.3];
const K1: Vec3 = [3, 0, 7.3];
const A1: Vec3 = [5.4, 0, 5.9];
const A2: Vec3 = [7.8, 0, 5.9];
const B1: Vec3 = [5.4, 0, 8.8];
const FS = 1.1;
/** A point that projects above the back row of nodes, centred. */
const CAPTION: Vec3 = [-2.6, 3.8, -2.6];
const mid = (p: Vec3, dx: number, dz = 0): Vec3 => [p[0] + dx, FS / 2, p[2] + dz];

/** Steps through timed phases in a loop. With reduced motion it stays on `initial`. */
function usePhase(durations: readonly number[], active: boolean, initial: number) {
  const [phase, setPhase] = useState(initial);
  const cur = useRef(initial);
  const start = useRef<number | null>(null);
  useEffect(() => {
    if (!active) start.current = null;
  }, [active]);
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
  return phase;
}

const GOSSIP = [0.9, 0.9, 0.9, 0.9, 0.9, 1.8, 0.4];
const GOSSIP_DONE = 5;
const GOSSIP_RESET = 6;
// arrive, three checks, accepted, forward, settle, reset
const VERIFY = [1.2, 0.7, 0.7, 0.7, 1, 1.2, 0.6, 0.3];
const VERIFY_RESET = 7;
// arrive, check 1 passes, check 2 fails, rejected, settle, reset
const REJECT = [1.2, 0.7, 0.9, 2.2, 0.5, 0.3];
const REJECT_RESET = 5;
// tie, branch A gets a second block, everyone switches to A
const FORK = [2.2, 1.8, 3.2];

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

export default function Scene({ stepId, level, labels }: SceneProps) {
  const isCopies = stepId === 'copies';
  const isGossip = stepId === 'gossip';
  const isVerify = stepId === 'verify';
  const isReject = stepId === 'reject';
  const isForks = stepId === 'forks';

  const g = usePhase(GOSSIP, isGossip, GOSSIP_DONE);
  const v = usePhase(VERIFY, isVerify, 5);
  const r = usePhase(REJECT, isReject, 3);
  const f = usePhase(FORK, isForks, 2);

  const checks: Check[] = isVerify
    ? [0, 1, 2].map((i) => (v > i && v < VERIFY_RESET ? 'ok' : 'idle'))
    : isReject
      ? [r >= 1 && r < REJECT_RESET ? 'ok' : 'idle', r >= 2 && r < REJECT_RESET ? 'bad' : 'idle', 'idle']
      : ['idle', 'idle', 'idle'];
  const accepted = isVerify && v >= 4 && v < VERIFY_RESET;
  const rejected = isReject && r >= 3 && r < REJECT_RESET;
  const expert = level === 'expert';
  const checkLines = expert
    ? ['parentHash, proposer sig', 'tx: sig, nonce, balance', 're-execute → stateRoot']
    : [labels.check1, labels.check2, labels.check3];

  const towerColor = (i: number): ColorKey => {
    const n = NODES[i];
    if (isGossip) return g > n.hop && g < GOSSIP_RESET ? 'tx' : 'neutral';
    if (isVerify) return i === 0 || (i === CENTER && accepted) || ((i === 2 || i === 4) && v === 6) ? 'valid' : 'neutral';
    if (isReject) return i === CHEAT ? 'invalid' : 'neutral';
    return 'neutral';
  };
  const reorged = f >= 2;
  const follows = (i: number): ColorKey => (NODES[i].side === 'A' || reorged ? 'block' : 'chain');

  return (
    <>
      <ShadowGround />
      <Platform size={[15.4, 9.8]} position={[-0.6, 0, 0]} color="ground" height={0.25} />

      {/* Peer links. */}
      {EDGES.map(([a, b]) => (
        <FlowLine key={`${a}-${b}`} points={[ground(a), ground(b)]} color={isReject && (a === CHEAT || b === CHEAT) && rejected ? 'invalid' : 'chain'} dashed arrow={false} width={2} />
      ))}

      {/* The nodes. */}
      {NODES.map((n, i) => (
        <group key={i} position={n.pos}>
          <group scale={n.light ? 0.8 : 1}>
            <NodeTower units={n.light ? 1 : 3} color={towerColor(i)} glow={towerColor(i) !== 'neutral'} light={isReject && i === CHEAT ? 'invalid' : 'valid'} />
          </group>
          <Anim position={[0, n.light ? 1.05 : 1.95, 0]} show={isCopies} speed={4 + i * 0.5}>
            <MiniChain light={n.light} offset={i} />
          </Anim>
          {/* Step 5: which tip this node currently follows. */}
          <Anim position={[0, n.light ? 0.75 : 1.65, 0]} show={isForks} speed={5}>
            <Box size={[0.42, 0.42, 0.42]} color={follows(i)} glow radius={0.07} />
          </Anim>
        </group>
      ))}

      {/* Step 1 captions. */}
      <Label position={CAPTION} show={isCopies}>
        {labels.sameCopy}
      </Label>
      <Label position={[NODES[4].pos[0], -0.6, NODES[4].pos[2] + 1]} show={isCopies} minLevel="intermediate">
        {labels.fullNode}
        {expert && (
          <>
            <br />
            {labels.fullDetail}
          </>
        )}
      </Label>
      <Label position={[NODES[7].pos[0] - 0.2, 2.2, NODES[7].pos[2] + 0.2]} show={isCopies} minLevel="intermediate">
        {labels.lightNode}
        {expert && (
          <>
            <br />
            {labels.lightDetail}
          </>
        )}
      </Label>
      <Label position={[NODES[3].pos[0] + 0.6, -0.6, NODES[3].pos[2] + 1]} show={isCopies} maxLevel="beginner" tone="plain">
        {labels.noBoss}
      </Label>

      {/* Step 2: a transaction spreads hop by hop. */}
      <Anim position={WALLET} show={isGossip} speed={5}>
        <group scale={0.8}>
          <Wallet color="actor" />
        </group>
        <Label position={[0, 1.6, 0]} tone="tx">
          {labels.newTx}
        </Label>
      </Anim>
      <Hop path={FROM_WALLET} show={isGossip && g === 0} playing={isGossip && g < GOSSIP_RESET} duration={GOSSIP[0]}>
        <Packet size={0.4} />
      </Hop>
      {HOPS.map((h, i) => (
        <Hop key={i} path={h.path} show={isGossip && g === h.phase} playing={isGossip && g >= h.phase && g < GOSSIP_RESET} duration={GOSSIP[h.phase]}>
          <Packet size={0.4} />
        </Hop>
      ))}
      <Label position={CAPTION} show={isGossip && g < GOSSIP_DONE} tone="plain">
        {labels.peers}
      </Label>
      <Label position={CAPTION} show={isGossip && g >= GOSSIP_DONE} tone="tx">
        {labels.everyone}
      </Label>
      <Label position={[3.4, -0.6, 4.6]} show={isGossip} minLevel="intermediate" maxLevel="intermediate" tone="plain">
        {labels.hops}
      </Label>
      <Label position={[3.4, -0.6, 4.6]} show={isGossip} minLevel="expert" tone="mono">
        inv → getdata → tx
        <br />
        gossipsub D = 8
      </Label>

      {/* Steps 3-4: the centre node runs its checks. */}
      <Anim position={[NODES[CENTER].pos[0], 2.7, NODES[CENTER].pos[2]]} show={isVerify || isReject} speed={5}>
        <Checklist states={checks} />
        <Label position={[0, 2.5, 0]} tone={accepted ? 'valid' : rejected ? 'invalid' : expert ? 'mono' : 'default'}>
          {checkLines.map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {mark(checks[i])}
              {line}
            </span>
          ))}
          {(accepted || rejected) && (
            <>
              <br />
              {accepted ? labels.accepted : level === 'beginner' ? labels.rejected : `${labels.rejected} · ${labels.notForwarded}`}
            </>
          )}
        </Label>
      </Anim>

      {/* Step 3: a good block arrives, passes, and is passed on. */}
      <Hop path={IN_PATH} show={isVerify && v <= 4} playing={isVerify && v < VERIFY_RESET} duration={VERIFY[0]}>
        <Block size={0.7} color="block" glow />
      </Hop>
      {OUT_PATHS.map((p, i) => (
        <Hop key={i} path={p} show={isVerify && v === 5} playing={isVerify && v >= 5 && v < VERIFY_RESET} duration={VERIFY[5]}>
          <Block size={0.7} color="block" glow />
        </Hop>
      ))}
      <Label position={[NODES[0].pos[0], 2.4, NODES[0].pos[2]]} show={isVerify && v === 0} tone="block">
        {labels.newBlock}
      </Label>

      {/* Step 4: a block that breaks a rule stops at the first honest node. */}
      {BAD_PATHS.map((p, i) => (
        <group key={i}>
          <Hop path={p} show={isReject && r <= 3} playing={isReject && r < REJECT_RESET} duration={REJECT[0]}>
            <Block size={0.7} color="invalid" glow />
          </Hop>
          <Anim position={topOf(BAD_TARGETS[i], 1.25)} show={rejected && i > 0} speed={8}>
            <Ball radius={0.2} color="invalid" glow />
          </Anim>
        </group>
      ))}
      <Label position={[NODES[CHEAT].pos[0] + 1.7, 0.6, NODES[CHEAT].pos[2] - 1.7]} show={isReject} tone="invalid">
        {labels.cheater}
        {expert && rejected && (
          <>
            <br />
            peer score ↓
          </>
        )}
      </Label>
      <Label position={[NODES[4].pos[0], 2.3, NODES[4].pos[2]]} show={isReject} tone="plain">
        {labels.unaware}
      </Label>

      {/* Step 5: two blocks at the same height, then one branch pulls ahead. */}
      <Anim show={isForks}>
        <Platform size={[10.4, 4.7]} position={[4.2, 0, 7.4]} color="ground" height={0.25} />
        <group position={K0}>
          <Block size={FS} color="block" />
          <Label position={[0, -0.5, 1]} minLevel="intermediate" tone="valid">
            {labels.finalized}
          </Label>
        </group>
        <group position={K1}>
          <Block size={FS} color="block" />
        </group>
        <ChainLink from={mid(K0, FS / 2)} to={mid(K1, -FS / 2)} />
        <ChainLink from={mid(K1, FS / 2, -0.2)} to={mid(A1, -FS / 2, 0.1)} />
        <ChainLink from={mid(K1, FS / 2, 0.2)} to={mid(B1, -FS / 2, -0.1)} color={reorged ? 'neutral' : 'chain'} />
        <group position={A1}>
          <Block size={FS} color="block" glow />
          <Label position={[0, FS + 0.6, 0]} tone="block">
            A
          </Label>
        </group>
        <Anim position={A2} show={f >= 1} speed={7}>
          <ChainLink from={[-(A2[0] - A1[0]) + FS / 2, FS / 2, 0]} to={[-FS / 2, FS / 2, 0]} />
          <Block size={FS} color="block" glow />
          <Label position={[0, FS + 0.6, 0]} show={reorged} tone="valid">
            {labels.heavier}
          </Label>
        </Anim>
        <group position={B1}>
          <Block size={FS} color={reorged ? 'neutral' : 'chain'} glow={!reorged} />
          <Label position={[0, FS + 0.6, 0]} show={!reorged}>
            B
          </Label>
          <Label position={[0, FS + 0.6, 0]} show={reorged} tone="invalid">
            {labels.stale}
          </Label>
        </group>
        <Label position={CAPTION} show={f === 0}>
          {labels.tie}
        </Label>
        <Label position={[NODES[3].pos[0], 2.6, NODES[3].pos[2]]} show={reorged} minLevel="intermediate">
          {labels.reorg}
        </Label>
        <Label position={[A2[0] + 1.9, 0.3, A2[2] - 1.9]} minLevel="expert" tone="mono">
          BTC: max Σ work
          <br />
          ETH: LMD-GHOST
        </Label>
      </Anim>
    </>
  );
}
