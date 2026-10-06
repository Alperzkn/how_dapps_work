import { useThree } from '@react-three/fiber';
import { Fragment, useRef, useState, type ReactNode } from 'react';
import type { Group } from 'three';
import {
  Anim,
  Ball,
  Block,
  Box,
  ContractMachine,
  Cyl,
  FlowLine,
  Label,
  Mover,
  NodeTower,
  Packet,
  Person,
  Screen,
  ShadowGround,
  Token,
  ValidatorPillar,
  useLoop,
  useScene,
  type Vec3,
} from '../../scene/kit';
import type { SceneProps } from '../../scene/types';
import type { ColorKey } from '../../theme/tokens';
import { shortHash } from '../../sim/sha256';
import type { Lang, Level } from '../../types';
import {
  BUDGET,
  CHAINS,
  CRITERIA,
  IBC_TIMEOUT,
  POWERS,
  SNOW_BETA,
  SNOW_NODES,
  SOL_CORES,
  SOL_TXS,
  bftStatus,
  makeTxs,
  rankChains,
  schedule,
  snowTally,
  solStats,
  weakest,
  type ChainId,
  type IbcPhase,
} from './logic';
import { useL1, type Preset } from './state';

type Labels = Record<string, string>;

const U = Math.SQRT1_2;
/** Ground point given in screen terms: `sx` to the right, `d` toward the viewer. */
const at = (sx: number, d: number, y = 0): Vec3 => [(sx + d) * U, y, (d - sx) * U];
/** Ground point that lands at screen offset (right, up) from the view centre. */
const onScreen = (sx: number, sy: number): Vec3 => at(sx, -sy / 0.577);

const lines = (text: string) =>
  text.split('\n').map((l, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {l}
    </Fragment>
  ));

const byLevel = (labels: Labels, key: string, level: Level) => labels[`${key}${level === 'beginner' ? 'B' : level === 'intermediate' ? 'I' : 'E'}`];

/** Steps through timed phases in a loop. Under reduced motion it rests on one informative phase. */
function useCycle(durations: number[], active: boolean, rest = durations.length - 1) {
  const { reducedMotion } = useScene();
  const [phase, setPhase] = useState(0);
  const clock = useRef(0);
  const cur = useRef(0);
  useLoop((_, dt) => {
    clock.current += dt;
    if (clock.current < durations[cur.current]) return;
    clock.current = 0;
    cur.current = (cur.current + 1) % durations.length;
    setPhase(cur.current);
  }, active);
  return reducedMotion ? rest : phase;
}

/** A flat bar on the ground between two points: triangle edges, bridges, lanes. */
function Bar({ from, to, color = 'chain', width = 0.2, height = 0.1 }: { from: Vec3; to: Vec3; color?: ColorKey; width?: number; height?: number }) {
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  return (
    <Box
      size={[Math.hypot(dx, dz), height, width]}
      position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2 + height / 2, (from[2] + to[2]) / 2]}
      rotation={[0, -Math.atan2(dz, dx), 0]}
      color={color}
      radius={0.04}
    />
  );
}

/** A round or many-sided island. Its top surface is y = 0. */
function Island({ radius, sides = 40, color = 'ground' }: { radius: number; sides?: number; color?: ColorKey }) {
  return <Cyl radius={radius} height={0.3} position={[0, -0.15, 0]} color={color} segments={sides} />;
}

interface WorldProps {
  /** Animations run. */
  on: boolean;
  /** This world is the subject of the step, so its detailed labels show. */
  focus: boolean;
  level: Level;
  labels: Labels;
  /** Phone-sized canvas: fewer and shorter labels. */
  compact: boolean;
}

/* ---------- Step 1: the trilemma ---------- */

const SEC = at(0, -3.3);
const DEC = at(-4.3, 2.5);
const SCA = at(4.3, 2.5);
const NODE_SPOTS: [number, number][] = [
  [0, 0],
  [-0.85, 0.5],
  [0.8, 0.55],
  [-0.55, -0.8],
  [0.6, -0.75],
];
const TRI_LANES = [-0.75, -0.25, 0.25, 0.75];

function Trilemma({ on, level, labels, compact }: WorldProps) {
  const tri = useL1((s) => s.tri);
  const [sec, dec, sca] = tri;
  const weak = ['sec', 'dec', 'sca'][weakest(tri)] ?? null;
  const lanes = Math.max(1, Math.round(sca / 25));
  const nodes = Math.max(1, Math.round(dec / 20));
  const big = dec < 35 ? 3 : dec < 60 ? 2 : 1;
  const marker: Vec3 = [
    (SEC[0] * sec + DEC[0] * dec + SCA[0] * sca) / BUDGET,
    0.5,
    (SEC[2] * sec + DEC[2] * dec + SCA[2] * sca) / BUDGET,
  ];
  const corner = (key: string, value: number) => (
    <>
      {labels[key]} · {value}
      {level !== 'beginner' && !compact && (
        <>
          <br />
          <span style={{ fontWeight: 400 }}>{byLevel(labels, key, level)}</span>
        </>
      )}
    </>
  );
  return (
    <>
      <Bar from={SEC} to={DEC} />
      <Bar from={SEC} to={SCA} />
      <Bar from={DEC} to={SCA} />

      {/* Security: a tower that is expensive to knock over. */}
      <group position={SEC}>
        <Cyl radius={1.05} height={0.16} position={[0, 0.08, 0]} color="platform" />
        <Anim scale={[1, 0.3 + (sec / 100) * 0.85, 1]} speed={5}>
          <Cyl radius={0.72} height={2} position={[0, 1.1, 0]} color="block" glow={weak !== 'sec'} />
          <Cyl radius={0.9} height={0.22} position={[0, 2.2, 0]} color="platform" />
        </Anim>
        <Label position={[0, 3.6, 0]} tone="block">
          {corner('security', sec)}
        </Label>
        <Label position={[0, 1.2, 1.6]} show={weak === 'sec'} tone="invalid">
          {labels.weakSec}
        </Label>
      </group>

      {/* Decentralization: many independent nodes. */}
      <group position={DEC}>
        <Cyl radius={1.5} height={0.16} position={[0, 0.08, 0]} color="platform" />
        {NODE_SPOTS.map(([x, z], i) => (
          <Anim key={i} position={[x, 0.16, z]} scale={0.5 + (1 - dec / 100) * 0.4} show={i < nodes} speed={5}>
            <NodeTower units={big} color="actor" />
          </Anim>
        ))}
        <Label position={[0.5, -1.25, 0.1]} tone="actor">
          {corner('decentral', dec)}
        </Label>
        <Label position={[0, 2.4, 0]} show={weak === 'dec'} tone="invalid">
          {labels.weakDec}
        </Label>
      </group>

      {/* Scalability: lanes of transactions getting through. */}
      <group position={SCA}>
        <Cyl radius={1.5} height={0.16} position={[0, 0.08, 0]} color="platform" />
        {TRI_LANES.map((z, i) => (
          <Anim key={i} show={i < lanes} speed={5}>
            <Box size={[2.2, 0.08, 0.34]} position={[0, 0.2, z]} color="neutral" radius={0.03} />
            <Mover path={[[-1, 0.24, z], [1, 0.24, z]]} duration={1.7 - sca / 90 + i * 0.1} delay={i * 0.3} playing={on}>
              <Packet size={0.24} />
            </Mover>
          </Anim>
        ))}
        <Label position={[-0.35, -1.25, 0.95]} tone="tx">
          {corner('scalable', sca)}
        </Label>
        <Label position={[0, 1.7, 0]} show={weak === 'sca'} tone="invalid">
          {labels.weakSca}
        </Label>
      </group>

      {/* The design point: move toward two corners and the third gives way. */}
      <Anim position={marker} speed={5}>
        <Ball radius={0.36} color="valid" glow />
        <Cyl radius={0.05} height={0.5} position={[0, -0.25, 0]} color="chain" segments={8} />
        <Label position={[0, 0.85, 0]} show={!compact || weak === null} tone="valid">
          {weak === null ? labels.balanced : labels.design}
        </Label>
      </Anim>
    </>
  );
}

/* ---------- Step 2: Solana ---------- */

function Clock({ ticks }: { ticks: number }) {
  return (
    <group>
      <Box size={[0.6, 1.3, 0.5]} position={[0, 0.65, 0]} color="neutral" radius={0.08} />
      <Cyl radius={0.78} height={0.2} position={[0, 1.95, 0]} rotation={[Math.PI / 2, 0, 0]} color="actor" />
      <Cyl radius={0.62} height={0.22} position={[0, 1.95, 0.01]} rotation={[Math.PI / 2, 0, 0]} color="platform" />
      <Anim position={[0, 1.95, 0.14]} rotation={[0, 0, (-ticks * Math.PI) / 6]} speed={12}>
        <Box size={[0.09, 0.5, 0.05]} position={[0, 0.22, 0]} color="ink" radius={0.02} />
      </Anim>
      <Ball radius={0.07} position={[0, 1.95, 0.14]} color="ink" />
    </group>
  );
}

const BEADS = 8;
const BEAD_GAP = 0.86;

/** The Proof of History sequence: each bead is the hash of the one before it. The last few are shown. */
function HashBeads({ focus, level, labels }: { focus: boolean; level: Level; labels: Labels }) {
  const poh = useL1((s) => s.poh);
  const first = Math.max(0, poh.length - BEADS);
  const shown = poh.slice(first);
  const last = shown[shown.length - 1];
  const event = [...shown].reverse().find((e) => e.event && e !== last);
  const x = (n: number) => (n - 1 - first) * BEAD_GAP;
  return (
    <group>
      <Box size={[(BEADS - 1) * BEAD_GAP, 0.06, 0.08]} position={[((BEADS - 1) * BEAD_GAP) / 2, 0.2, 0]} color="chain" radius={0.02} />
      {shown.map((e) => (
        <Anim key={e.n} position={[x(e.n), 0.2, 0]} scale={e === last ? 1.5 : e.event ? 1.3 : 1} speed={10}>
          <Box size={[0.26, 0.26, 0.26]} color={e.event ? 'tx' : 'actor'} glow={e === last || Boolean(e.event)} radius={0.06} />
        </Anim>
      ))}
      {last && (
        <Label position={[x(last.n), 1.1, 0]} show={focus} tone={last.event ? 'tx' : level === 'beginner' ? 'actor' : 'mono'}>
          {last.event ? `${last.event} → ${labels.position} ${last.n}` : level === 'beginner' ? `${labels.tickNo} ${last.n}` : `h${last.n} = ${shortHash(last.hash, 6, 0)}`}
        </Label>
      )}
      {event && last && event.n <= last.n - 3 && (
        <Label position={[x(event.n), 1.1, 0]} show={focus} tone="tx">
          {event.event} → {labels.position} {event.n}
        </Label>
      )}
    </group>
  );
}

const LANE_Z = [-0.5, 0.2, 0.9, 1.6];
const LANE_FROM = -3.7;
const LANE_TO = 2.5;
const ACCT_X = 3.3;
const COL = 0.31;
const colX = (round: number) => LANE_FROM + 0.25 + round * COL;

/** A bar that sweeps over the rounds: more rounds, longer until the batch is done. */
function RoundCursor({ rounds, active }: { rounds: number; active: boolean }) {
  const ref = useRef<Group>(null);
  useLoop((t) => {
    if (ref.current) ref.current.position.x = colX(Math.min((t * 5) % (rounds + 3), rounds) - 0.5);
  }, active);
  return (
    <group ref={ref} position={[colX(rounds - 0.5), 0, 0]}>
      <Box size={[0.07, 0.5, LANE_Z[3] - LANE_Z[0] + 0.6]} position={[0, 0.25, (LANE_Z[0] + LANE_Z[3]) / 2]} color="valid" glow radius={0.02} opacity={0.75} />
    </group>
  );
}

function Solana({ on, focus, level, labels, compact }: WorldProps) {
  const share = useL1((s) => s.share);
  const ticks = useL1((s) => s.poh.length);
  const rounds = schedule(makeTxs(SOL_TXS, share), SOL_CORES);
  const stats = solStats(SOL_TXS, share, SOL_CORES);
  const spots = new Map<number, { round: number; core: number; hot: boolean }>();
  rounds.forEach((r, round) => r.forEach((tx, core) => spots.set(tx.id, { round, core, hot: tx.account === 0 })));
  return (
    <>
      <Box size={[11.4, 0.3, 6]} position={[0, -0.15, 0]} color="ground" radius={0.14} />

      <group position={[-4.7, 0, -2.2]}>
        <Clock ticks={ticks} />
        <Label position={[0, 3.25, 0]} show={focus} tone="actor">
          {labels.poh}
          {level !== 'beginner' && (
            <>
              <br />
              <span style={{ fontWeight: 400 }}>{labels.slot}</span>
            </>
          )}
          {level === 'expert' && !compact && (
            <>
              <br />
              <span style={{ fontWeight: 400 }}>hₙ = SHA-256(hₙ₋₁)</span>
            </>
          )}
        </Label>
      </group>
      <group position={[-3.4, 0, -2.4]}>
        <HashBeads focus={focus} level={level} labels={labels} />
      </group>

      <group position={[-4.75, 0, 0.55]} scale={0.8}>
        <ValidatorPillar stake={3} glow />
      </group>
      <Label position={[-4.75, -0.8, 1.4]} show={focus && !compact} tone="actor">
        {labels.leader}
      </Label>

      {/* One lane per CPU core; one column per round of execution. */}
      {LANE_Z.map((z, i) => (
        <group key={i}>
          <Box size={[LANE_TO - LANE_FROM + 0.4, 0.07, 0.42]} position={[(LANE_FROM + LANE_TO) / 2, 0.035, z]} color="platform" radius={0.03} />
          <Box size={[0.8, 0.6, 0.5]} position={[ACCT_X, 0.3, z]} color={i === 0 ? 'tokenA' : 'tokenB'} radius={0.08} />
        </group>
      ))}
      {Array.from({ length: SOL_TXS }, (_, id) => {
        const s = spots.get(id) ?? { round: 0, core: 0, hot: false };
        return (
          <Anim key={id} position={[colX(s.round), 0.07, LANE_Z[s.core]]} speed={7}>
            <Packet size={0.22} color={s.hot ? 'tokenA' : 'tx'} glow={s.hot} />
          </Anim>
        );
      })}
      <RoundCursor rounds={stats.rounds} active={on} />
      <Label position={[colX(stats.rounds - 0.5), 1.0, LANE_Z[0]]} show={focus} tone="valid">
        {labels.doneAfter} {stats.rounds} {labels.roundsWord}
      </Label>
      <Label position={[ACCT_X + 1.5, 1.2, LANE_Z[0] - 0.6]} show={focus && stats.hot > 0} tone="tokenA">
        {lines(level === 'expert' ? labels.serialE : labels.serial)}
      </Label>
      <Label position={[ACCT_X + 1.6, 0, LANE_Z[3] + 0.3]} show={focus && stats.hot < SOL_TXS} tone="tokenB">
        {lines(level === 'expert' ? labels.parallelE : labels.parallel)}
      </Label>
    </>
  );
}

/* ---------- Step 3: Avalanche ---------- */

const RING = 2.4;
const ringPos = (i: number, y = 0): Vec3 => {
  const a = (i / SNOW_NODES) * Math.PI * 2 + 0.3;
  return [Math.cos(a) * RING, y, Math.sin(a) * RING];
};
const SUBNETS: { pos: Vec3; color: ColorKey }[] = [
  { pos: at(-5.1, 0.4), color: 'contract' },
  { pos: at(5.1, 0.4), color: 'tokenA' },
  { pos: at(0.4, 4.9), color: 'tokenB' },
];

function Avalanche({ focus, level, labels, compact }: WorldProps) {
  const nodes = useL1((s) => s.nodes);
  const sample = useL1((s) => s.sample);
  const round = useL1((s) => s.round);
  const k = useL1((s) => s.k);
  const alpha = useL1((s) => s.alpha);
  const stalled = useL1((s) => s.stalled);
  const t = snowTally(nodes);
  return (
    <>
      <Island radius={3.2} />
      {nodes.map((n, i) => (
        <group key={i} position={ringPos(i)} scale={0.4}>
          <NodeTower units={n.decided ? 2 : 1} color={n.pref === 0 ? 'block' : 'tx'} glow={n.decided} light={n.decided ? 'valid' : 'neutral'} />
        </group>
      ))}
      <Block size={1} color={t.agreed ? (t.blue > 0 ? 'block' : 'tx') : t.split ? 'invalid' : 'neutral'} glow={t.agreed} />
      <Label position={[0, 1.75, 0]} show={focus && (t.agreed || t.split || stalled)} tone={t.agreed ? 'valid' : 'invalid'}>
        {t.agreed ? labels.accepted : t.split ? labels.splitWarn : labels.stalled}
      </Label>

      {/* Whom node 0 asked in the last round. */}
      <Anim show={sample.length > 0 && !t.allDecided} speed={9}>
        {sample.map((peer) => (
          <FlowLine key={peer} points={[ringPos(0, 0.6), ringPos(peer, 0.6)]} color="actor" dashed width={2} arrow={false} />
        ))}
      </Anim>
      <Ball radius={0.16} position={ringPos(0, 1.15)} color="actor" glow />
      <Label position={[0, 3.3, 0]} show={focus && round === 0} tone="actor">
        {lines(byLevel(labels, 'sample', level))}
      </Label>
      <Label position={[0, 3.3, 0]} show={focus && round > 0} tone="actor">
        {labels.roundWord} {round} · {t.blue} {labels.blue} · {t.orange} {labels.orange}
      </Label>
      <Label position={at(0, -3.2, 2.6)} show={focus && !compact} tone="block">
        {labels.primary}
      </Label>

      {/* Subnets / L1s: their own chains, validators and rules. */}
      {SUBNETS.map(({ pos, color }, i) => (
        <group key={i}>
          <Bar from={[pos[0] * 0.56, -0.14, pos[2] * 0.56]} to={[pos[0] * 0.8, -0.14, pos[2] * 0.8]} width={0.5} />
          <group position={pos}>
            <Island radius={1.3} />
            <Block size={0.62} color={color} />
            <group position={[-0.75, 0, 0.3]} scale={0.36}>
              <ValidatorPillar stake={2} />
            </group>
            <group position={[0.75, 0, -0.3]} scale={0.36}>
              <ValidatorPillar stake={2} />
            </group>
            <Label position={[0, i === 2 ? -1.0 : 1.5, i === 2 ? 0.8 : 0]} show={focus} tone="plain">
              {lines(i === 2 && level !== 'beginner' ? labels.subnetOwn : labels.subnet)}
            </Label>
          </group>
        </group>
      ))}
      <Label position={at(0, -3.2, 3.5)} show={focus} minLevel="expert" tone="mono">
        k = {k} · α = {alpha} · β = {SNOW_BETA}
      </Label>
    </>
  );
}

/* ---------- Step 4: Cosmos-style app chains ---------- */

const ZONE_A = at(-4.3, -1.2);
const ZONE_B = at(4.3, -1.2);
const ZONE_C = at(0, 3.1);
const VOTE_SPOTS: Vec3[] = [
  [-1.15, 0, -0.75],
  [-0.4, 0, -1.25],
  [0.45, 0, -1.25],
  [1.2, 0, -0.75],
];
const VOTE_SPOTS_A: Vec3[] = [
  [-1.45, 0, -0.35],
  [-0.85, 0, -1.05],
  [0, 0, -1.4],
  [0.85, 0, -1.05],
  [1.45, 0, -0.35],
];
const STAKES = POWERS.map((p) => p / 5);
const toward = (a: Vec3, b: Vec3, t: number, y = 0): Vec3 => [a[0] + (b[0] - a[0]) * t, y, a[2] + (b[2] - a[2]) * t];

function Zone({ position, children }: { position: Vec3; children?: ReactNode }) {
  return (
    <group position={position}>
      <Island radius={2.15} sides={6} />
      {children}
    </group>
  );
}

const IBC_TONE: Record<IbcPhase, 'tx' | 'valid' | 'invalid' | 'actor'> = {
  idle: 'tx',
  escrowed: 'tx',
  relayed: 'tx',
  verified: 'actor',
  minted: 'valid',
  acked: 'valid',
  expired: 'invalid',
  refunded: 'valid',
};

function Cosmos({ on, focus, level, labels, compact }: WorldProps) {
  const online = useL1((s) => s.online);
  const relayerOnline = useL1((s) => s.relayerOnline);
  const ibc = useL1((s) => s.ibc);
  const status = bftStatus(POWERS, online);
  const cycle = useCycle([1.4, 1.4, 1.4, 2.4], on && status.canCommit);
  // Without two thirds the round never gets past prevote.
  const phase = status.canCommit ? cycle : 1;
  const committed = status.canCommit && phase === 3;
  const stepName = [labels.propose, labels.prevote, labels.precommit, labels.commit][phase];
  const ab: [Vec3, Vec3] = [toward(ZONE_A, ZONE_B, 0.23), toward(ZONE_A, ZONE_B, 0.77)];
  const bc: [Vec3, Vec3] = [toward(ZONE_B, ZONE_C, 0.3), toward(ZONE_B, ZONE_C, 0.7)];
  const ca: [Vec3, Vec3] = [toward(ZONE_C, ZONE_A, 0.3), toward(ZONE_C, ZONE_A, 0.7)];
  const lift = (p: Vec3, y = 0.1): Vec3 => [p[0], y, p[2]];
  const atB = ibc.phase === 'relayed' || ibc.phase === 'verified' || ibc.phase === 'minted' || ibc.phase === 'acked';
  const inFlight = ibc.phase !== 'idle' && ibc.phase !== 'acked' && ibc.phase !== 'refunded';
  const proven = ibc.phase === 'verified' || ibc.phase === 'minted' || ibc.phase === 'acked';
  const pct = Math.round(status.onlinePct);
  return (
    <>
      <Zone position={ZONE_A}>
        {VOTE_SPOTS_A.map((p, i) => {
          const lit = online[i] && (phase >= 1 || i === 0);
          return (
            <group key={i} position={p} scale={0.4}>
              <ValidatorPillar stake={online[i] ? STAKES[i] : 0} color={!online[i] ? 'neutral' : lit ? 'valid' : 'actor'} glow={lit && phase >= 2 && status.canCommit} />
            </group>
          );
        })}
        {/* The proposed block: grey until more than two thirds have precommitted. */}
        <Anim position={[0, committed ? 0 : 0.9, 0]} scale={committed ? 1 : 0.7} speed={5}>
          <Block size={0.6} color={committed ? 'valid' : 'neutral'} glow={committed} />
        </Anim>
        <Label position={[0, 2.75, -0.8]} show={focus} tone={!status.canCommit ? 'invalid' : committed ? 'valid' : 'actor'}>
          {status.canCommit ? (
            <>
              {stepName}
              {level !== 'beginner' && ` · ${pct}% > ⅔`}
            </>
          ) : (
            <>
              {labels.halted}
              <br />
              <span style={{ fontWeight: 400 }}>
                {pct}% ≤ ⅔ · {labels.noFork}
              </span>
            </>
          )}
        </Label>
        {/* Escrow: coins locked on A while their voucher exists on B. */}
        <group position={[0.95, 0, 0.95]}>
          <Box size={[0.8, 0.12, 0.8]} position={[0, 0.06, 0]} color="neutral" radius={0.04} />
          <Anim show={ibc.escrowA > 0} position={[0, 0.12, 0]} scale={0.6} speed={8}>
            <Token color="tokenA" />
          </Anim>
          <Label position={[0, -0.75, 0.75]} show={focus && ibc.escrowA > 0} tone="tokenA">
            {labels.escrow} {ibc.escrowA}
          </Label>
        </group>
        <Label position={[-0.9, -1.1, 1.5]} show={focus} tone="block">
          {labels.chainA}
        </Label>
      </Zone>
      <Zone position={ZONE_B}>
        {VOTE_SPOTS.map((p, i) => (
          <group key={i} position={p} scale={0.42}>
            <ValidatorPillar stake={2} color="valid" />
          </group>
        ))}
        <Anim show={ibc.vouchersB > 0} position={[0.2, 0, 0.7]} scale={0.8} speed={8}>
          <Token color="tokenA" />
        </Anim>
        <Label position={[0.9, -0.6, 1.4]} show={focus && ibc.vouchersB > 0} tone="valid">
          {labels.voucher} {ibc.vouchersB}
        </Label>
        <group position={[-1.15, 0, 0.75]} scale={0.34}>
          <Screen face={proven ? 'valid' : 'block'} glow />
        </group>
        <Label position={[0.2, 2.3, -1.0]} show={focus && (proven || !compact)} minLevel={proven ? 'beginner' : 'intermediate'} tone={proven ? 'valid' : 'default'}>
          {proven ? labels.proofOk : labels.lightClient}
        </Label>
        <Label position={[1.3, -1.6, 1.1]} show={focus} tone="block">
          {labels.chainB}
        </Label>
      </Zone>
      <Zone position={ZONE_C}>
        {VOTE_SPOTS.map((p, i) => (
          <group key={i} position={p} scale={0.42}>
            <ValidatorPillar stake={2} color="valid" />
          </group>
        ))}
        <group position={[0, 0, 0.5]}>
          <ContractMachine size={0.5} active={on} />
        </group>
        <Label position={[0, -1.1, 1.9]} show={focus} tone="block">
          {labels.chainC}
        </Label>
      </Zone>

      {/* IBC: a channel between each pair of chains, packets carried by relayers. */}
      {[ab, bc, ca].map(([from, to], i) => (
        <group key={i}>
          <Bar from={[from[0], -0.1, from[2]]} to={[to[0], -0.1, to[2]]} width={0.55} color="neutral" />
          {i > 0 && (
            <Mover path={[lift(from), lift(to)]} duration={2 + i * 0.3} delay={i * 0.7} playing={on}>
              <Packet size={0.3} />
            </Mover>
          )}
        </group>
      ))}
      {/* The learner's transfer on the A–B channel. */}
      <Anim show={inFlight} position={lift(atB ? ab[1] : ab[0], 0.1)} speed={4}>
        <Packet size={0.34} color={ibc.phase === 'expired' ? 'invalid' : 'tx'} />
      </Anim>
      <Anim position={toward(ZONE_A, ZONE_B, atB ? 0.72 : 0.28)} speed={4}>
        <group position={[0.45, -0.1, 0.45]} scale={0.6}>
          <Person color={relayerOnline ? 'actor' : 'neutral'} />
        </group>
      </Anim>
      <Label position={toward(ZONE_A, ZONE_B, 0.5, -1.3)} show={focus} minLevel={relayerOnline ? 'intermediate' : 'beginner'} tone={relayerOnline ? 'actor' : 'invalid'}>
        {relayerOnline ? labels.relayer : labels.relayerOff}
      </Label>
      <Label position={toward(ZONE_A, ZONE_B, 0.5, 1.2)} show={focus} tone={IBC_TONE[ibc.phase]}>
        {ibc.phase === 'idle' ? 'IBC' : labels[`ibc_${ibc.phase}`]}
        {ibc.phase === 'idle' && level === 'expert' && (
          <>
            <br />
            <span style={{ fontWeight: 400 }}>packet + Merkle proof</span>
          </>
        )}
        {(ibc.phase === 'escrowed' || ibc.phase === 'expired') && (
          <>
            <br />
            <span style={{ fontWeight: 400 }}>
              {labels.timeout} {Math.min(ibc.clock, IBC_TIMEOUT)}/{IBC_TIMEOUT}
            </span>
          </>
        )}
      </Label>
      <Label position={at(0, -3.4, 2.2)} show={focus && !compact} minLevel="expert" tone="mono">
        commit ⇔ precommits &gt; ⅔ · safe if f &lt; ⅓
      </Label>
    </>
  );
}

/* ---------- Step 5: the three designs next to each other ---------- */

const COMPARE_SCALE = 0.58;
const SOL_AT = onScreen(-4.4, 3.8);
const AVA_AT = onScreen(4.4, 0.1);
const COS_AT = onScreen(-4.4, -4.3);
const FACT_AT: Record<ChainId, Vec3> = { sol: onScreen(4.6, 4.0), ava: onScreen(-4.6, 0.3), cos: onScreen(4.6, -3.9) };
const BAR_AT: Record<ChainId, Vec3> = { sol: onScreen(1.3, 3.2), ava: onScreen(-1.3, -0.5), cos: onScreen(1.3, -4.7) };
/** Model size and how far up the screen it moves on a phone, per step. */
const COMPACT: Record<string, { scale: number; lift: number }> = {
  trilemma: { scale: 0.6, lift: 4.6 },
  solana: { scale: 0.68, lift: 3.6 },
  avalanche: { scale: 0.7, lift: 5 },
  cosmos: { scale: 0.75, lift: 5 },
  tradeoffs: { scale: 0.62, lift: 4.6 },
};
const CHAIN_NAME: Record<ChainId, string> = { sol: 'Solana', ava: 'Avalanche', cos: 'Cosmos' };
const CHAIN_TONE: Record<ChainId, 'tx' | 'actor' | 'block'> = { sol: 'tx', ava: 'actor', cos: 'block' };

export default function Scene({ stepId, level, labels }: SceneProps) {
  const cmp = stepId === 'tradeoffs';
  const criterion = useL1((s) => s.criterion);
  const ranked = criterion ? rankChains(criterion) : [];
  const compact = useThree((s) => s.size.width) < 560;
  const fit = compact ? COMPACT[stepId] : undefined;
  const world = (id: string): WorldProps => ({ on: stepId === id || cmp, focus: stepId === id, level, labels, compact });
  return (
    <>
      <ShadowGround />
      {/* On a phone the panel covers the lower part of the canvas: shrink the model and move it up the screen. */}
      <Anim position={fit ? at(0, -fit.lift) : [0, 0, 0]} scale={fit ? fit.scale : 1} speed={5}>
      <Anim show={stepId === 'trilemma'}>
        <Trilemma {...world('trilemma')} on={stepId === 'trilemma'} />
      </Anim>

      <Anim show={stepId === 'solana' || cmp} position={cmp ? SOL_AT : [0, 0, 0]} scale={cmp ? COMPARE_SCALE : 1} speed={4}>
        <Solana {...world('solana')} />
        <Label position={at(-3.6, 2.5)} show={stepId === 'solana'} tone="tx">
          Solana
        </Label>
      </Anim>
      <Anim show={stepId === 'avalanche' || cmp} position={cmp ? AVA_AT : [0, 0, 0]} scale={cmp ? COMPARE_SCALE : 1} speed={4}>
        <Avalanche {...world('avalanche')} />
      </Anim>
      <Anim show={stepId === 'cosmos' || cmp} position={cmp ? COS_AT : [0, 0, 0]} scale={cmp ? COMPARE_SCALE : 1} speed={4}>
        <Cosmos {...world('cosmos')} />
      </Anim>

      {CHAINS.map((id) => {
        const r = ranked.find((x) => x.chain === id);
        return (
          <Fragment key={id}>
            <Label position={FACT_AT[id]} show={cmp} tone={r ? (r.rank === 1 ? 'valid' : 'default') : CHAIN_TONE[id]}>
              {r ? `${r.rank}. ${CHAIN_NAME[id]}` : CHAIN_NAME[id]}
              <br />
              <span style={{ fontWeight: 400 }}>{r && criterion ? labels[`v_${criterion}_${id}`] : lines(byLevel(labels, id, compact ? 'beginner' : level))}</span>
            </Label>
            {/* A bar per chain for the chosen criterion: longer means more seconds, validators or hardware. */}
            <Anim show={cmp && Boolean(r)} position={BAR_AT[id]} scale={[1, r ? r.bar : 0.15, 1]} speed={6}>
              <Box size={[0.5, 2.6, 0.5]} position={[0, 1.3, 0]} color={r?.rank === 1 ? 'valid' : 'chain'} glow={r?.rank === 1} radius={0.06} />
            </Anim>
            <Anim show={cmp && Boolean(r)} position={BAR_AT[id]} speed={6}>
              <Cyl radius={0.55} height={0.08} position={[0, 0.04, 0]} color="platform" />
            </Anim>
          </Fragment>
        );
      })}
      <Label position={onScreen(4.6, -6.1)} show={cmp && !compact} minLevel="intermediate" tone="plain">
        {labels.approx}
      </Label>
      </Anim>
    </>
  );
}

/* ---------- Controls ---------- */

const locale = (lang: Lang) => (lang === 'tr' ? 'tr-TR' : 'en-US');
const fmt = (n: number, digits: number, lang: Lang) =>
  (Number.isFinite(n) ? n : 0).toLocaleString(locale(lang), { minimumFractionDigits: digits, maximumFractionDigits: digits });

function Stat({ name, tone, inline, children }: { name: string; tone?: 'good' | 'bad'; inline?: boolean; children: ReactNode }) {
  return (
    <span className="ctl-stat" style={inline ? { display: 'flex', gap: 6, alignItems: 'baseline' } : undefined}>
      <span>{name}</span>
      <strong data-tone={tone}>{children}</strong>
    </span>
  );
}

function Seg<T extends string>({ value, options, onPick, label }: { value: T | null; options: [T, string][]; onPick: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label} style={{ flexWrap: 'wrap' }}>
      {options.map(([id, text]) => (
        <button key={id} type="button" data-opt={id} aria-pressed={value === id} onClick={() => onPick(id)} style={{ minHeight: 32, padding: '0 7px', fontSize: '0.8rem' }}>
          {text}
        </button>
      ))}
    </div>
  );
}

function Range({ id, label, value, min, max, step = 1, onChange }: { id: string; label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <label className="ctl-field" style={{ minWidth: 96 }}>
      <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

const PANEL = { gap: '4px 12px', maxWidth: 600 };
const STATS = { gap: '2px 12px' };
const BTN = { minHeight: 32, padding: '0 9px', fontSize: '0.82rem' };

function TrilemmaControls({ labels }: SceneProps) {
  const tri = useL1((s) => s.tri);
  const preset = useL1((s) => s.preset);
  const setTri = useL1((s) => s.setTri);
  const setPreset = useL1((s) => s.setPreset);
  const w = weakest(tri);
  const presets: [Preset, string][] = [
    ['bitcoin', labels.presetBtc],
    ['solana', labels.presetSol],
    ['cosmos', labels.presetCos],
  ];
  return (
    <div className="ctl" style={PANEL}>
      <Seg value={preset} options={presets} onPick={setPreset} label={labels.presets} />
      <div className="ctl-stats" style={STATS}>
        <Stat name={labels.givenUp} tone={w < 0 ? undefined : 'bad'} inline>
          {w < 0 ? labels.nothing : [labels.security, labels.decentral, labels.scalable][w]}
        </Stat>
      </div>
      <div style={{ display: 'flex', gap: 10, flexBasis: '100%' }}>
        <Range id="tri-sec" label={`${labels.secShort}: ${tri[0]}`} value={tri[0]} min={0} max={100} onChange={(v) => setTri(0, v)} />
        <Range id="tri-dec" label={`${labels.decShort}: ${tri[1]}`} value={tri[1]} min={0} max={100} onChange={(v) => setTri(1, v)} />
        <Range id="tri-sca" label={`${labels.scaShort}: ${tri[2]}`} value={tri[2]} min={0} max={100} onChange={(v) => setTri(2, v)} />
      </div>
    </div>
  );
}

function SolanaControls({ labels, lang }: SceneProps) {
  const tab = useL1((s) => s.solTab);
  const setTab = useL1((s) => s.setSolTab);
  const share = useL1((s) => s.share);
  const setShare = useL1((s) => s.setShare);
  const poh = useL1((s) => s.poh);
  const tick = useL1((s) => s.tick);
  const insertEvent = useL1((s) => s.insertEvent);
  const resetPoh = useL1((s) => s.resetPoh);
  const st = solStats(SOL_TXS, share, SOL_CORES);
  const last = poh[poh.length - 1];
  const events = poh.filter((e) => e.event);
  const lastEvent = events[events.length - 1];
  return (
    <div className="ctl" style={PANEL}>
      <Seg
        value={tab}
        options={[
          ['lanes', labels.tabLanes],
          ['clock', labels.tabClock],
        ]}
        onPick={setTab}
        label={labels.tabs}
      />
      {tab === 'lanes' ? (
        <>
          <Range id="sol-share" label={`${labels.sameAccount}: ${share}%`} value={share} min={0} max={100} step={5} onChange={setShare} />
          <div className="ctl-stats" style={{ ...STATS, flexBasis: '100%' }}>
            <Stat name={labels.atOnce}>
              {st.parallelNow} / {SOL_CORES}
            </Stat>
            <Stat name={labels.queued} tone={st.lockQueue > 0 ? 'bad' : 'good'}>
              {st.lockQueue}
            </Stat>
            <Stat name={labels.roundsFor.replace('{n}', String(SOL_TXS))}>{st.rounds}</Stat>
            <Stat name={labels.throughput} tone={st.throughput >= SOL_CORES ? 'good' : undefined}>
              {fmt(st.throughput, st.throughput % 1 ? 1 : 0, lang)} {labels.perRound}
            </Stat>
          </div>
        </>
      ) : (
        <>
          <button id="poh-tick" type="button" className="btn btn-primary" style={BTN} onClick={tick}>
            {labels.tick}
          </button>
          <button id="poh-event" type="button" className="btn" style={BTN} onClick={insertEvent}>
            {labels.insertTx}
          </button>
          <button id="poh-reset" type="button" className="btn" style={BTN} onClick={resetPoh}>
            {labels.reset}
          </button>
          <div className="ctl-stats" style={{ ...STATS, flexBasis: '100%' }}>
            <Stat name={labels.ticks}>{poh.length}</Stat>
            <Stat name={labels.latestHash}>{last ? shortHash(last.hash, 8, 4) : '–'}</Stat>
            <Stat name={labels.lastEvent}>{lastEvent ? `${lastEvent.event} → ${labels.position} ${lastEvent.n}` : '–'}</Stat>
          </div>
        </>
      )}
    </div>
  );
}

function AvalancheControls({ labels }: SceneProps) {
  const s = useL1();
  const t = snowTally(s.nodes);
  const status = t.agreed ? labels.stAgreed : t.split ? labels.stSplit : s.stalled ? labels.stStalled : labels.stRunning;
  return (
    <div className="ctl" style={PANEL}>
      <div style={{ display: 'flex', gap: 10, flexBasis: '100%' }}>
        <Range id="ava-k" label={`${labels.sampleK}: ${s.k}`} value={s.k} min={1} max={10} onChange={s.setK} />
        <Range id="ava-alpha" label={`${labels.quorum}: ${s.alpha}`} value={s.alpha} min={1} max={s.k} onChange={s.setAlpha} />
        <Range id="ava-split" label={`${labels.startBlue}: ${s.split}%`} value={s.split} min={0} max={100} step={5} onChange={s.setSplit} />
      </div>
      <button id="ava-step" type="button" className="btn" style={BTN} onClick={s.snowStep} disabled={t.allDecided}>
        {labels.oneRound}
      </button>
      <button id="ava-run" type="button" className="btn btn-primary" style={BTN} onClick={s.snowFinish} disabled={t.allDecided}>
        {labels.runAll}
      </button>
      <button id="ava-reset" type="button" className="btn" style={BTN} onClick={s.snowReset}>
        {labels.reshuffle}
      </button>
      <div className="ctl-stats" style={{ ...STATS, flexBasis: '100%' }}>
        <Stat name={labels.roundsTaken}>{s.round}</Stat>
        <Stat name={labels.blue}>{t.blue}</Stat>
        <Stat name={labels.orange}>{t.orange}</Stat>
        <Stat name={labels.decidedN}>
          {t.decided} / {SNOW_NODES}
        </Stat>
        <Stat name={labels.status} tone={t.agreed ? 'good' : t.split || s.stalled ? 'bad' : undefined}>
          {status}
        </Stat>
      </div>
    </div>
  );
}

function CosmosControls({ labels }: SceneProps) {
  const s = useL1();
  const st = bftStatus(POWERS, s.online);
  const { ibc } = s;
  const done = ibc.phase === 'acked' || ibc.phase === 'refunded';
  return (
    <div className="ctl" style={PANEL}>
      <Seg
        value={s.cosTab}
        options={[
          ['votes', labels.tabVotes],
          ['ibc', labels.tabIbc],
        ]}
        onPick={s.setCosTab}
        label={labels.tabs}
      />
      {s.cosTab === 'votes' ? (
        <>
          <div className="seg" role="group" aria-label={labels.validatorsOnline} style={{ flexWrap: 'wrap' }}>
            {POWERS.map((p, i) => (
              <button key={i} type="button" data-val={i} aria-pressed={s.online[i]} aria-label={`${labels.validatorWord} ${i + 1}, ${p}%`} onClick={() => s.toggleValidator(i)} style={{ minHeight: 32, padding: '0 7px', textDecoration: s.online[i] ? 'none' : 'line-through' }}>
                V{i + 1} {p}%
              </button>
            ))}
          </div>
          <div className="ctl-stats" style={{ ...STATS, flexBasis: '100%' }}>
            <Stat name={labels.onlinePower} tone={st.canCommit ? 'good' : 'bad'}>
              {Math.round(st.onlinePct)}% {st.canCommit ? '>' : '≤'} ⅔
            </Stat>
            <Stat name={labels.chainStatus} tone={st.canCommit ? 'good' : 'bad'}>
              {st.canCommit ? labels.stLive : labels.stHalted}
            </Stat>
            <Stat name={labels.longestChain}>{st.onlinePct > 0 ? labels.keepsGoing : labels.stHalted}</Stat>
          </div>
        </>
      ) : (
        <>
          <button id="ibc-next" type="button" className="btn btn-primary" style={BTN} onClick={s.ibcStep} disabled={!s.relayerOnline && (ibc.phase === 'expired' || ibc.phase === 'minted')} title={labels.needsRelayer}>
            {ibc.phase === 'idle' ? labels.ibcStart : done ? labels.ibcAgain : labels.ibcNext}
          </button>
          <label className="ctl-check">
            <input id="relayer-off" type="checkbox" checked={!s.relayerOnline} onChange={(e) => s.setRelayerOnline(!e.target.checked)} />
            {labels.relayerOffline}
          </label>
          <div className="ctl-stats" style={{ ...STATS, flexBasis: '100%' }}>
            <Stat name={labels.ibcStep} tone={ibc.phase === 'expired' ? 'bad' : done || ibc.phase === 'minted' ? 'good' : undefined}>
              {labels[`ibcS_${ibc.phase}`]}
            </Stat>
            <Stat name={labels.balEscrow}>
              {ibc.balanceA} + {ibc.escrowA}
            </Stat>
            <Stat name={labels.vouchersB}>{ibc.vouchersB}</Stat>
            {(ibc.phase === 'escrowed' || ibc.phase === 'expired') && (
              <Stat name={labels.timeout} tone={ibc.phase === 'expired' ? 'bad' : undefined}>
                {Math.min(ibc.clock, IBC_TIMEOUT)} / {IBC_TIMEOUT}
              </Stat>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TradeoffControls({ labels }: SceneProps) {
  const criterion = useL1((s) => s.criterion);
  const setCriterion = useL1((s) => s.setCriterion);
  const options: [string, string][] = [['all', labels.cAll], ...CRITERIA.map((c): [string, string] => [c, labels[`c_${c}`]])];
  return (
    <div className="ctl" style={PANEL}>
      <Seg value={criterion ?? 'all'} options={options} onPick={(v) => setCriterion(v === 'all' ? null : (v as (typeof CRITERIA)[number]))} label={labels.sortBy} />
      {criterion && (
        <div className="ctl-stats" style={{ ...STATS, flexBasis: '100%' }}>
          {rankChains(criterion).map((r) => (
            <Stat key={r.chain} name={`${r.rank}. ${CHAIN_NAME[r.chain]}`} tone={r.rank === 1 ? 'good' : undefined}>
              {labels[`v_${criterion}_${r.chain}`]}
            </Stat>
          ))}
          <Stat name={labels.ethRef}>{labels[`v_${criterion}_eth`]}</Stat>
        </div>
      )}
    </div>
  );
}

export function Controls(props: SceneProps) {
  switch (props.stepId) {
    case 'trilemma':
      return <TrilemmaControls {...props} />;
    case 'solana':
      return <SolanaControls {...props} />;
    case 'avalanche':
      return <AvalancheControls {...props} />;
    case 'cosmos':
      return <CosmosControls {...props} />;
    case 'tradeoffs':
      return <TradeoffControls {...props} />;
    default:
      return null;
  }
}
