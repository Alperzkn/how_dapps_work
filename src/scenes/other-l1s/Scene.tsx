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
  PoolBasin,
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
import type { Level } from '../../types';

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
}

/* ---------- Step 1: the trilemma ---------- */

const SEC = at(0, -3.3);
const DEC = at(-4.3, 2.5);
const SCA = at(4.3, 2.5);
const MARKER: Vec3[] = [at(0, 0.5, 0.5), at(-2.15, -0.4, 0.5), at(2.15, -0.4, 0.5), at(0, 2.5, 0.5)];
const NODE_SPOTS: [number, number][] = [
  [0, 0],
  [-0.85, 0.5],
  [0.8, 0.55],
  [-0.55, -0.8],
  [0.6, -0.75],
];

function Trilemma({ on, level, labels }: WorldProps) {
  const phase = useCycle([2.2, 2.4, 2.4, 2.4], on, 0);
  const weak = [null, 'sca', 'dec', 'sec'][phase];
  const lanes = weak === 'sca' ? 1 : phase === 0 ? 2 : 3;
  const nodes = weak === 'dec' ? 2 : phase === 0 ? 4 : 5;
  const wall = weak === 'sec' ? 0.45 : phase === 0 ? 0.8 : 1;
  const corner = (key: string) => (
    <>
      {labels[key]}
      {level !== 'beginner' && (
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
        <Anim scale={[1, wall, 1]} speed={4}>
          <Cyl radius={0.72} height={2} position={[0, 1.1, 0]} color="block" glow={weak !== 'sec'} />
          <Cyl radius={0.9} height={0.22} position={[0, 2.2, 0]} color="platform" />
        </Anim>
        <Label position={[0, 3.6, 0]} tone="block">
          {corner('security')}
        </Label>
        <Label position={[0, 1.2, 1.6]} show={weak === 'sec'} tone="invalid">
          {labels.weakSec}
        </Label>
      </group>

      {/* Decentralization: many independent nodes. */}
      <group position={DEC}>
        <Cyl radius={1.5} height={0.16} position={[0, 0.08, 0]} color="platform" />
        {NODE_SPOTS.map(([x, z], i) => (
          <Anim key={i} position={[x, 0.16, z]} scale={weak === 'dec' ? 0.85 : 0.55} show={i < nodes} speed={5}>
            <NodeTower units={weak === 'dec' ? 3 : 1} color="actor" />
          </Anim>
        ))}
        <Label position={[0.5, -1.25, 0.1]} tone="actor">
          {corner('decentral')}
        </Label>
        <Label position={[0, 2.2, 0]} show={weak === 'dec'} tone="invalid">
          {labels.weakDec}
        </Label>
      </group>

      {/* Scalability: lanes of transactions getting through. */}
      <group position={SCA}>
        <Cyl radius={1.5} height={0.16} position={[0, 0.08, 0]} color="platform" />
        {[0, 1, 2].map((i) => {
          const z = (i - 1) * 0.6;
          return (
            <Anim key={i} show={i < lanes} speed={5}>
              <Box size={[2.2, 0.08, 0.36]} position={[0, 0.2, z]} color="neutral" radius={0.03} />
              <Mover path={[[-1, 0.24, z], [1, 0.24, z]]} duration={0.9 + i * 0.15} delay={i * 0.3} playing={on}>
                <Packet size={0.26} />
              </Mover>
            </Anim>
          );
        })}
        <Label position={[-0.35, -1.25, 0.95]} tone="tx">
          {corner('scalable')}
        </Label>
        <Label position={[0, 1.7, 0]} show={weak === 'sca'} tone="invalid">
          {labels.weakSca}
        </Label>
      </group>

      {/* The design point: move toward two corners and the third gives way. */}
      <Anim position={MARKER[phase]} speed={2.6}>
        <Ball radius={0.36} color="valid" glow />
        <Cyl radius={0.05} height={0.5} position={[0, -0.25, 0]} color="chain" segments={8} />
        <Label position={[0, 0.85, 0]} tone="valid">
          {labels.design}
        </Label>
      </Anim>
    </>
  );
}

/* ---------- Step 2: Solana ---------- */

function Clock({ active }: { active: boolean }) {
  const hand = useRef<Group>(null);
  useLoop((t) => {
    if (hand.current) hand.current.rotation.z = (-Math.floor(t * 5) * Math.PI) / 6;
  }, active);
  return (
    <group>
      <Box size={[0.6, 1.3, 0.5]} position={[0, 0.65, 0]} color="neutral" radius={0.08} />
      <Cyl radius={0.78} height={0.2} position={[0, 1.95, 0]} rotation={[Math.PI / 2, 0, 0]} color="actor" />
      <Cyl radius={0.62} height={0.22} position={[0, 1.95, 0.01]} rotation={[Math.PI / 2, 0, 0]} color="platform" />
      <group ref={hand} position={[0, 1.95, 0.14]}>
        <Box size={[0.09, 0.5, 0.05]} position={[0, 0.22, 0]} color="ink" radius={0.02} />
      </group>
      <Ball radius={0.07} position={[0, 1.95, 0.14]} color="ink" />
    </group>
  );
}

/** The Proof of History sequence: each bead is the hash of the one before it. */
function HashBeads({ active, count = 11, gap = 0.72 }: { active: boolean; count?: number; gap?: number }) {
  const refs = useRef<(Group | null)[]>([]);
  useLoop((t) => {
    const head = (t * 7) % count;
    refs.current.forEach((g, i) => {
      if (!g) return;
      const behind = (head - i + count) % count;
      g.scale.setScalar(1 + Math.max(0, 1 - behind / 2.5) * 0.8);
    });
  }, active);
  return (
    <group>
      <Box size={[(count - 1) * gap, 0.06, 0.08]} position={[((count - 1) * gap) / 2, 0.2, 0]} color="chain" radius={0.02} />
      {Array.from({ length: count }, (_, i) => (
        <group
          key={i}
          ref={(g) => {
            refs.current[i] = g;
          }}
          position={[i * gap, 0.2, 0]}
        >
          <Box size={[0.26, 0.26, 0.26]} color="actor" glow radius={0.06} />
        </group>
      ))}
    </group>
  );
}

const LANE_Z = [-0.75, -0.05, 0.75, 1.45];
const LANE_FROM = -3.7;
const LANE_TO = 2.5;
const ACCT_X = 4.1;

function Solana({ on, focus, level, labels }: WorldProps) {
  const shared = (LANE_Z[2] + LANE_Z[3]) / 2;
  return (
    <>
      <Box size={[11.4, 0.3, 5]} position={[0, -0.15, 0]} color="ground" radius={0.14} />

      <group position={[-4.7, 0, -1.7]}>
        <Clock active={on} />
        <Label position={[0, 3.25, 0]} show={focus} tone="actor">
          {labels.poh}
          {level !== 'beginner' && (
            <>
              <br />
              <span style={{ fontWeight: 400 }}>{labels.slot}</span>
            </>
          )}
        </Label>
      </group>
      <group position={[-3.7, 0, -1.95]}>
        <HashBeads active={on} />
        <Label position={[5.2, 2.1, -0.4]} show={focus} minLevel="expert" tone="mono">
          hₙ = SHA-256(hₙ₋₁)
        </Label>
      </group>

      <group position={[-4.75, 0, 0.35]} scale={0.8}>
        <ValidatorPillar stake={3} glow />
      </group>
      <Label position={[-4.75, -0.8, 1.2]} show={focus} tone="actor">
        {labels.leader}
      </Label>

      {LANE_Z.map((z, i) => {
        const end: Vec3 = [ACCT_X, 0.75, i < 2 ? z : shared];
        const path: Vec3[] = [[LANE_FROM, 0.12, z], [LANE_TO, 0.12, z], end];
        return (
          <group key={i}>
            <Box size={[LANE_TO - LANE_FROM + 0.4, 0.07, 0.42]} position={[(LANE_FROM + LANE_TO) / 2, 0.035, z]} color="platform" radius={0.03} />
            {i < 2 ? (
              <>
                <Mover path={path} duration={1} delay={i * 0.25} playing={on}>
                  <Packet size={0.3} />
                </Mover>
                <Mover path={path} duration={1} delay={0.7 + i * 0.25} playing={on}>
                  <Packet size={0.3} />
                </Mover>
              </>
            ) : (
              <Mover path={path} duration={1.2} delay={i === 2 ? 0 : 0.8} playing={on}>
                <Packet size={0.3} />
              </Mover>
            )}
          </group>
        );
      })}

      {/* Accounts the transactions write to. The last two lanes want the same one. */}
      {[LANE_Z[0], LANE_Z[1]].map((z) => (
        <Box key={z} size={[0.9, 0.6, 0.56]} position={[ACCT_X, 0.3, z]} color="tokenB" radius={0.08} />
      ))}
      <Box size={[0.9, 0.6, 1.1]} position={[ACCT_X, 0.3, shared]} color="tokenA" radius={0.08} />
      <Label position={[ACCT_X + 0.9, 2.1, LANE_Z[0] - 1.1]} show={focus} tone="valid">
        {lines(level === 'expert' ? labels.parallelE : labels.parallel)}
      </Label>
      <Label position={[ACCT_X - 0.3, -0.7, shared + 1.5]} show={focus} tone="tokenA">
        {lines(level === 'expert' ? labels.serialE : labels.serial)}
      </Label>
    </>
  );
}

/* ---------- Step 3: Avalanche ---------- */

type Pref = 'block' | 'tx';
const B: Pref = 'block';
const T: Pref = 'tx';
const PREFS: Pref[][] = [
  [B, T, B, T, T, B, B, T],
  [B, T, B, B, T, B, B, T],
  [B, B, B, B, T, B, B, T],
  [B, B, B, B, B, B, B, B],
];
/** Who asks whom in each round: [asker, ...sampled peers]. */
const QUERIES: number[][][] = [[[3, 0, 2, 6]], [[1, 0, 3, 5]], [[4, 2, 5, 6], [7, 0, 3, 5]], []];
const RING = 2.15;
const ringPos = (i: number, y = 0): Vec3 => {
  const a = (i / 8) * Math.PI * 2 + 0.3;
  return [Math.cos(a) * RING, y, Math.sin(a) * RING];
};
const SUBNETS: { pos: Vec3; color: ColorKey }[] = [
  { pos: at(-5.1, 0.4), color: 'contract' },
  { pos: at(5.1, 0.4), color: 'tokenA' },
  { pos: at(0.4, 4.9), color: 'tokenB' },
];

function Avalanche({ on, focus, level, labels }: WorldProps) {
  const phase = useCycle([1.7, 1.7, 1.7, 2.8], on);
  const done = phase === 3;
  return (
    <>
      <Island radius={3.2} />
      {PREFS[phase].map((pref, i) => (
        <group key={i} position={ringPos(i)} scale={0.56}>
          <NodeTower units={2} color={pref} glow={done} light={done ? 'valid' : 'neutral'} />
        </group>
      ))}
      <Block size={1} color={done ? 'valid' : 'neutral'} glow={done} />
      <Label position={[0, 1.75, 0]} show={focus && done} tone="valid">
        {labels.accepted}
      </Label>

      {QUERIES.map((round, p) => (
        <Anim key={p} show={phase === p} speed={9}>
          {round.map(([asker, ...peers]) => (
            <group key={asker}>
              {peers.map((peer) => (
                <FlowLine key={peer} points={[ringPos(asker, 0.95), ringPos(peer, 0.95)]} color="actor" dashed width={2} />
              ))}
              <Ball radius={0.2} position={ringPos(asker, 1.35)} color="actor" glow />
            </group>
          ))}
        </Anim>
      ))}
      <Label position={[0, 3.3, 0]} show={focus && !done} tone="actor">
        {lines(byLevel(labels, 'sample', level))}
      </Label>
      <Label position={at(0, -3.2, 2.6)} show={focus} tone="block">
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
        k = 20 · α = 15 · β = 20
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
const toward = (a: Vec3, b: Vec3, t: number, y = 0): Vec3 => [a[0] + (b[0] - a[0]) * t, y, a[2] + (b[2] - a[2]) * t];

function Zone({ position, voting, children }: { position: Vec3; voting: number; children?: ReactNode }) {
  // voting: 0 propose, 1 prevote, 2 precommit, 3 commit. The fourth validator is offline throughout.
  return (
    <group position={position}>
      <Island radius={2.15} sides={6} />
      {VOTE_SPOTS.map((p, i) => {
        const offline = i === 3;
        const lit = !offline && (voting >= 1 || i === 0);
        return (
          <group key={i} position={p} scale={0.42}>
            <ValidatorPillar stake={offline ? 0 : 2} color={offline ? 'neutral' : lit ? 'valid' : 'actor'} glow={lit && voting >= 2} />
          </group>
        );
      })}
      {children}
    </group>
  );
}

function Cosmos({ on, focus, level, labels }: WorldProps) {
  const phase = useCycle([1.4, 1.4, 1.4, 2.4], on);
  const stepName = [labels.propose, labels.prevote, labels.precommit, labels.commit][phase];
  const ab: [Vec3, Vec3] = [toward(ZONE_A, ZONE_B, 0.23), toward(ZONE_A, ZONE_B, 0.77)];
  const bc: [Vec3, Vec3] = [toward(ZONE_B, ZONE_C, 0.3), toward(ZONE_B, ZONE_C, 0.7)];
  const ca: [Vec3, Vec3] = [toward(ZONE_C, ZONE_A, 0.3), toward(ZONE_C, ZONE_A, 0.7)];
  const lift = (p: Vec3): Vec3 => [p[0], 0.1, p[2]];
  return (
    <>
      <Zone position={ZONE_A} voting={phase}>
        <group position={[0, 0, 0.75]} scale={0.3}>
          <PoolBasin a={0.9} b={0.6} />
        </group>
        {/* The proposed block: grey until more than two thirds have precommitted. */}
        <Anim position={[0, phase === 3 ? 0 : 0.9, -0.2]} scale={phase === 3 ? 1 : 0.7} speed={5}>
          <Block size={0.6} color={phase === 3 ? 'valid' : 'neutral'} glow={phase === 3} />
        </Anim>
        <Label position={[0, 2.45, -0.6]} show={focus} tone={phase === 3 ? 'valid' : 'actor'}>
          {stepName}
          {level !== 'beginner' && phase > 0 && phase < 3 && ' · 3 / 4 > ⅔'}
        </Label>
        <Label position={[0, -1.1, 1.9]} show={focus} tone="block">
          {labels.chainA}
        </Label>
      </Zone>
      <Zone position={ZONE_B} voting={3}>
        <group position={[0, 0, 0.6]} scale={0.8}>
          <Token />
        </group>
        <group position={[-1.15, 0, 0.75]} scale={0.34}>
          <Screen face="block" glow />
        </group>
        <Label position={[0.2, 2.3, -1.0]} show={focus} minLevel="intermediate">
          {labels.lightClient}
        </Label>
        <Label position={[1.3, -1.0, 1.1]} show={focus} tone="block">
          {labels.chainB}
        </Label>
      </Zone>
      <Zone position={ZONE_C} voting={3}>
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
          <Mover path={[lift(from), lift(to)]} duration={2 + i * 0.3} delay={i * 0.7} playing={on}>
            <Packet size={0.3} />
          </Mover>
        </group>
      ))}
      <Label position={toward(ZONE_A, ZONE_B, 0.5, 1.0)} show={focus} tone="tx">
        IBC
        {level === 'expert' && (
          <>
            <br />
            <span style={{ fontWeight: 400 }}>packet + Merkle proof</span>
          </>
        )}
      </Label>
      <group position={toward(ZONE_B, ZONE_C, 0.5)}>
        <group position={[0.55, -0.1, 0.1]} scale={0.6}>
          <Person />
        </group>
        <Label position={[1.0, -1.6, 0.6]} show={focus} minLevel="intermediate" tone="actor">
          {labels.relayer}
        </Label>
      </group>
      <Label position={at(0, -3.4, 2.2)} show={focus} minLevel="expert" tone="mono">
        commit ⇔ precommits &gt; ⅔ · safe if f &lt; ⅓
      </Label>
    </>
  );
}

/* ---------- Step 5: the three designs next to each other ---------- */

const COMPARE = 0.58;
const SOL_AT = onScreen(-4.4, 3.8);
const AVA_AT = onScreen(4.4, 0.1);
const COS_AT = onScreen(-4.4, -4.3);

export default function Scene({ stepId, level, labels }: SceneProps) {
  const cmp = stepId === 'tradeoffs';
  const world = (id: string): WorldProps => ({ on: stepId === id || cmp, focus: stepId === id, level, labels });
  const fact = (name: string, key: string, position: Vec3, tone: 'tx' | 'actor' | 'block') => (
    <Label position={position} show={cmp} tone={tone}>
      {name}
      <br />
      <span style={{ fontWeight: 400 }}>{lines(byLevel(labels, key, level))}</span>
    </Label>
  );
  return (
    <>
      <ShadowGround />
      <Anim show={stepId === 'trilemma'}>
        <Trilemma {...world('trilemma')} on={stepId === 'trilemma'} />
      </Anim>

      <Anim show={stepId === 'solana' || cmp} position={cmp ? SOL_AT : [0, 0, 0]} scale={cmp ? COMPARE : 1} speed={4}>
        <Solana {...world('solana')} />
        <Label position={at(-3.6, 2.5)} show={stepId === 'solana'} tone="tx">
          Solana
        </Label>
      </Anim>
      <Anim show={stepId === 'avalanche' || cmp} position={cmp ? AVA_AT : [0, 0, 0]} scale={cmp ? COMPARE : 1} speed={4}>
        <Avalanche {...world('avalanche')} />
      </Anim>
      <Anim show={stepId === 'cosmos' || cmp} position={cmp ? COS_AT : [0, 0, 0]} scale={cmp ? COMPARE : 1} speed={4}>
        <Cosmos {...world('cosmos')} />
      </Anim>

      {fact('Solana', 'sol', onScreen(4.6, 4.0), 'tx')}
      {fact('Avalanche', 'ava', onScreen(-4.6, 0.3), 'actor')}
      {fact('Cosmos', 'cos', onScreen(4.6, -3.9), 'block')}
      <Label position={onScreen(4.6, -6.1)} show={cmp} minLevel="intermediate" tone="plain">
        {labels.approx}
      </Label>
    </>
  );
}
