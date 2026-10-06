import { Fragment, useRef, useState, type ReactNode } from 'react';
import { useThree } from '@react-three/fiber';
import type { Group } from 'three';
import { Anim, Ball, Box, CoinStack, ContractMachine, Cyl, FlowLine, Label, Mat, Person, Platform, PoolBasin, ShadowGround, useLoop, useScene, type Vec3 } from '../../scene/kit';
import type { SceneProps } from '../../scene/types';
import type { ColorKey } from '../../theme/tokens';
import type { Level } from '../../types';
import {
  AFTER_SWAP_BIT,
  BEFORE_SWAP_BIT,
  deployTotals,
  flagBits,
  flashState,
  HOOK_FEATURES,
  hookAddressSuffix,
  hookSwap,
  MAX_EXTRA_POOLS,
  ROUTE_TOKENS,
  START_POOLS,
  suggestVersion,
  type FitReason,
  type HookFeature,
  type RouteToken,
} from './logic';
import { feeBpsFor, useFee, usePlay, VOL_MAX, VOL_STEP } from './state';

/** The whole stage is turned a little toward the viewer so rows read left to right. */
const TURN = Math.PI / 8;

type Labels = Record<string, string>;

const localeOf = (lang: string) => (lang === 'tr' ? 'tr-TR' : 'en-US');
const fmt = (n: number, lang: string, min = 0, max = min) => (Number.isFinite(n) ? n : 0).toLocaleString(localeOf(lang), { minimumFractionDigits: min, maximumFractionDigits: max });
/** A percentage the way each language writes it: 0.62% / %0,62. */
const pctText = (n: number, lang: string, digits = 2) => (lang === 'tr' ? `%${fmt(n, lang, digits)}` : `${fmt(n, lang, digits)}%`);
/** Gas in round units: 0, 45k, 4.5M. */
const gasText = (n: number, lang: string) => (n >= 1e6 ? `${fmt(n / 1e6, lang, 1)}M` : n >= 1000 ? `${fmt(n / 1000, lang, 0, 1)}k` : fmt(n, lang));

/** Splits a label written as "line one | line two" into lines. */
function Lines({ text }: { text: string }) {
  return (
    <>
      {text.split(' | ').map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </Fragment>
      ))}
    </>
  );
}

/* ---------- Timing helpers: every looping step runs on one shared clock ---------- */

type Key = [time: number, at: Vec3];

/** Moves its children through timed positions on the same repeating clock; hidden outside its keys. */
function Runner({ period, keys, on, arc = 0, children }: { period: number; keys: Key[]; on: boolean; arc?: number; children: ReactNode }) {
  const ref = useRef<Group>(null);
  useLoop((t) => {
    const g = ref.current;
    if (!g) return;
    const u = t % period;
    if (u < keys[0][0] || u > keys[keys.length - 1][0]) {
      g.visible = false;
      return;
    }
    g.visible = true;
    let i = 0;
    while (i < keys.length - 2 && u > keys[i + 1][0]) i++;
    const [t0, a] = keys[i];
    const [t1, b] = keys[i + 1];
    const f = t1 > t0 ? Math.min(1, (u - t0) / (t1 - t0)) : 1;
    const e = f * f * (3 - 2 * f);
    const moving = a[0] !== b[0] || a[2] !== b[2];
    g.position.set(a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e + (moving ? Math.sin(e * Math.PI) * arc : 0), a[2] + (b[2] - a[2]) * e);
  }, on);
  return (
    <group ref={ref} position={keys[keys.length - 1][1]}>
      {children}
    </group>
  );
}

/** Runs `cb` with the seconds passed since `runKey` last changed (or since the step was first shown). */
function useSince(runKey: number, on: boolean, cb: (u: number) => void) {
  const start = useRef<number | null>(null);
  const key = useRef(runKey);
  useLoop((t) => {
    if (start.current === null || key.current !== runKey) {
      start.current = t;
      key.current = runKey;
    }
    cb(t - start.current);
  }, on);
}

/** Like a phase of a repeating timeline, but played once per `runKey`; rests on the last part. */
function useOncePhase(cuts: number[], runKey: number, on: boolean, still: number) {
  const { reducedMotion } = useScene();
  const [phase, setPhase] = useState(cuts.length);
  const cur = useRef(cuts.length);
  useSince(runKey, on, (u) => {
    let p = 0;
    while (p < cuts.length && u >= cuts[p]) p++;
    if (p !== cur.current) {
      cur.current = p;
      setPhase(p);
    }
  });
  return reducedMotion ? still : phase;
}

/** A Runner that plays once per `runKey`. With `hold` it stays at its last position, otherwise it disappears. */
function Shot({ keys, runKey, on, arc = 0, hold = false, children }: { keys: Key[]; runKey: number; on: boolean; arc?: number; hold?: boolean; children: ReactNode }) {
  const ref = useRef<Group>(null);
  useSince(runKey, on, (u) => {
    const g = ref.current;
    if (!g) return;
    const end = keys[keys.length - 1][0];
    if (u < keys[0][0] || (u > end && !hold)) {
      g.visible = false;
      return;
    }
    g.visible = true;
    let i = 0;
    while (i < keys.length - 2 && u > keys[i + 1][0]) i++;
    const [t0, a] = keys[i];
    const [t1, b] = keys[i + 1];
    const f = t1 > t0 ? Math.min(1, (u - t0) / (t1 - t0)) : 1;
    const e = f * f * (3 - 2 * f);
    const moving = a[0] !== b[0] || a[2] !== b[2];
    g.position.set(a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e + (moving ? Math.sin(e * Math.PI) * arc : 0), a[2] + (b[2] - a[2]) * e);
  });
  return (
    <group ref={ref} position={keys[keys.length - 1][1]} visible={hold}>
      {children}
    </group>
  );
}

/* ---------- Shapes ---------- */

/** One pool's state: two reserves side by side. Sits on y = 0. */
function Cell({ a, b, glow = false, size = 1 }: { a: ColorKey; b: ColorKey; glow?: boolean; size?: number }) {
  return (
    <group scale={size}>
      <Box size={[1.5, 0.12, 1.1]} position={[0, 0.06, 0]} color="platform" radius={0.04} />
      <Box size={[0.64, 0.5, 0.9]} position={[-0.35, 0.37, 0]} color={a} glow={glow} radius={0.06} />
      <Box size={[0.64, 0.36, 0.9]} position={[0.35, 0.3, 0]} color={b} glow={glow} radius={0.06} />
    </group>
  );
}

/** A token as a coin lying flat. */
function Coin({ color, r = 0.3 }: { color: ColorKey; r?: number }) {
  return (
    <group>
      <Cyl radius={r} height={0.14} position={[0, 0.07, 0]} color={color} glow />
      <Cyl radius={r * 0.6} height={0.16} position={[0, 0.08, 0]} color="platform" />
    </group>
  );
}

/** v2 / v3: every pool is its own deployed contract. */
function PoolHouse({ glow = false }: { glow?: boolean }) {
  return (
    <group>
      <Box size={[1.25, 0.8, 1.05]} position={[0, 0.4, 0]} color="contract" glow={glow} radius={0.1} />
      <Box size={[0.5, 0.26, 0.8]} position={[-0.29, 0.93, 0]} color="tokenA" radius={0.05} />
      <Box size={[0.5, 0.2, 0.8]} position={[0.29, 0.9, 0]} color="tokenB" radius={0.05} />
      <Box size={[0.3, 0.38, 0.05]} position={[0, 0.22, 0.54]} color="ink" radius={0.03} />
    </group>
  );
}

const VAULT_W = 7.4;
const VAULT_D = 3.8;
const VAULT_H = 0.5;
const CELL_X = [-2.3, 0, 2.3];
const CELL_Z = [-0.9, 0.9];
const PAIRS: [ColorKey, ColorKey][] = [
  ['tokenA', 'block'],
  ['tokenB', 'tx'],
  ['block', 'tokenA'],
  ['tokenA', 'tokenB'],
  ['tokenB', 'block'],
  ['tx', 'tokenA'],
];

/** v4: one contract holding every pool as a compartment. `count` compartments are in use; those from `fresh` on were just added. */
function Vault({ lit = [], count = 6, fresh = 6 }: { lit?: number[]; count?: number; fresh?: number }) {
  const rim = 0.16;
  return (
    <group>
      <Box size={[VAULT_W, VAULT_H, VAULT_D]} position={[0, VAULT_H / 2, 0]} color="contract" radius={0.14} />
      <Box size={[VAULT_W, 0.36, rim]} position={[0, VAULT_H + 0.18, -VAULT_D / 2 + rim / 2]} color="contract" radius={0.05} />
      <Box size={[rim, 0.36, VAULT_D]} position={[-VAULT_W / 2 + rim / 2, VAULT_H + 0.18, 0]} color="contract" radius={0.05} />
      <Box size={[rim, 0.36, VAULT_D]} position={[VAULT_W / 2 - rim / 2, VAULT_H + 0.18, 0]} color="contract" radius={0.05} />
      <Box size={[VAULT_W, 0.16, rim]} position={[0, VAULT_H + 0.08, VAULT_D / 2 - rim / 2]} color="contract" radius={0.05} />
      {CELL_Z.map((z, zi) =>
        CELL_X.map((x, xi) => {
          const i = zi * 3 + xi;
          return (
            <Anim key={i} position={[x, VAULT_H, z]} show={i < count}>
              <Cell a={PAIRS[i][0]} b={PAIRS[i][1]} glow={lit.includes(i) || i >= fresh} size={1.15} />
            </Anim>
          );
        }),
      )}
    </group>
  );
}

/* ---------- Step 1: many contracts vs one ---------- */

const HOUSES: Vec3[] = [
  [-6.6, 0, -1.1],
  [-4.9, 0, -1.1],
  [-3.2, 0, -1.1],
  [-6.6, 0, 1.1],
  [-4.9, 0, 1.1],
  [-3.2, 0, 1.1],
];
const VAULT_X = 3.3;
const MOVE = 6;
const OLD_GAS_AT: Vec3 = [-1.25, 0, 1.3];
const V4_GAS_AT: Vec3 = [VAULT_X, 0, 2.75];
/** Coins on the gas pile per pool opened the old way; a v4 pool adds one thin slice. */
const GAS_COINS = 6;

function Singleton({ on, labels, lang }: { on: boolean; labels: Labels; lang: string }) {
  const oldExtra = usePlay((s) => s.oldExtra);
  const v4Extra = usePlay((s) => s.v4Extra);
  const t = deployTotals(oldExtra, v4Extra);
  return (
    <>
      <Platform size={[5.6, 4.6]} position={[-4.9, 0, 0]} color="ground" height={0.25} />
      {HOUSES.map((h, i) => (
        <Anim key={i} position={h} show={i < t.oldContracts}>
          <PoolHouse glow={i >= START_POOLS} />
        </Anim>
      ))}
      {/* Pools move out of their own contracts and into compartments of the one contract. */}
      {HOUSES.slice(0, START_POOLS).map((h, i) => {
        const to: Vec3 = [VAULT_X + CELL_X[i], VAULT_H + 0.2, CELL_Z[0]];
        const start = i * 0.9;
        return (
          <Runner key={i} period={MOVE} on={on} arc={2.2} keys={[[start, [h[0], 1.1, h[2]]], [start + 1.5, to]]}>
            <Cell a="tokenA" b="tokenB" size={0.5} glow />
          </Runner>
        );
      })}

      {/* What the learner has spent on gas each way. */}
      <group position={OLD_GAS_AT}>
        <Cyl radius={0.5} height={0.08} position={[0, 0.04, 0]} color="platform" />
        <group position={[0, 0.08, 0]}>
          <CoinStack count={oldExtra * GAS_COINS} color="tx" radius={0.34} glow />
        </group>
      </group>
      <Label position={[OLD_GAS_AT[0], 0.7 + oldExtra * GAS_COINS * 0.14, OLD_GAS_AT[2]]} tone="tx">
        ≈ {gasText(t.oldGas, lang)} gas
      </Label>
      <group position={V4_GAS_AT}>
        <Cyl radius={0.5} height={0.08} position={[0, 0.04, 0]} color="platform" />
        {Array.from({ length: v4Extra }, (_, i) => (
          <Cyl key={i} radius={0.34} height={0.03} position={[0, 0.1 + i * 0.04, 0]} color="tx" glow />
        ))}
      </group>
      <Label position={[V4_GAS_AT[0], 0.75, V4_GAS_AT[2]]} tone="tx">
        ≈ {gasText(t.v4Gas, lang)} gas
      </Label>

      <Label position={[-4.9, 2.2, -1.1]} maxLevel="beginner">
        {labels.oldWay}
      </Label>
      <Label position={[-4.9, 2.2, -1.1]} minLevel="intermediate" maxLevel="intermediate">
        {labels.oldWayI}
      </Label>
      <Label position={[-4.9, 2.3, -1.1]} minLevel="expert" tone="mono">
        factory.createPool()
        <br />
        → new UniswapV3Pool
      </Label>
      <Label position={[VAULT_X, 2.5, -0.9]} maxLevel="beginner" tone="valid">
        {labels.newWay}
      </Label>
      <Label position={[VAULT_X, 2.5, -0.9]} minLevel="intermediate" maxLevel="intermediate" tone="valid">
        PoolManager · {labels.newWayI}
      </Label>
      <Label position={[VAULT_X, 2.6, -0.9]} minLevel="expert" tone="mono">
        PoolManager
        <br />
        _pools[PoolId] → Pool.State
      </Label>
    </>
  );
}

/* ---------- Step 2: flash accounting ---------- */

const BOARD_Z = -2.75;
const ZERO_Y = 3;
const USER: Vec3 = [-5.4, 0, 2.3];
const BAR_X = [-1.95, -0.65, 0.65, 1.95];
const TOKEN_COLOR: Record<RouteToken, ColorKey> = { ETH: 'tokenA', USDC: 'tokenB', DAI: 'block', WBTC: 'tx' };
/** The three pools of the route are the front compartments of the vault. */
const ROUTE_CELL = [3, 4, 5];
const overPool = (hop: number, y: number): Vec3 => [CELL_X[Math.min(Math.max(hop, 0), 2)], VAULT_H + y, CELL_Z[1]];
const V3_COUNT_AT: Vec3 = [-6.7, 0, -0.7];
const V4_COUNT_AT: Vec3 = [-4.7, 0, -3.3];

function DeltaBar({ x, value, color, show }: { x: number; value: number; color: ColorKey; show: boolean }) {
  return (
    <Anim position={[x, ZERO_Y, BOARD_Z + 0.16]} show={show}>
      <Anim scale={[1, value === 0 ? 0.03 : Math.sign(value) * 0.95, 1]} speed={9}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.7, 1, 0.14]} />
          <Mat color={color} glow={value !== 0} />
        </mesh>
      </Anim>
    </Anim>
  );
}

/** Fills {n}, {a} and {b} in a label. */
const fill = (text: string, v: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ''));

function Flash({ labels, lang, level }: { labels: Labels; lang: string; level: Level }) {
  const hops = usePlay((s) => s.hops);
  const skipSettle = usePlay((s) => s.skipSettle);
  const callIndex = usePlay((s) => s.callIndex);
  const s = flashState(hops, skipSettle, callIndex);
  const { call, status } = s;
  const last = ROUTE_TOKENS[hops];
  const reverted = status === 'reverted';
  const kinds = s.calls.map((c) => c.kind);
  const paid = !reverted && kinds.includes('settle') && s.index >= kinds.indexOf('settle');
  const taken = !reverted && s.index >= kinds.indexOf('take');
  const tone = status === 'settled' ? 'valid' : reverted ? 'invalid' : 'tx';
  const sign = (n: number) => (n === 0 ? '0' : `${n > 0 ? '+' : '−'}${fmt(Math.abs(n), lang, 0, 4)}`);

  const plain =
    call.kind === 'unlock'
      ? labels.callUnlock
      : call.kind === 'swap'
        ? fill(labels.callSwap, { n: (call.hop ?? 0) + 1, a: call.from ?? '', b: call.to ?? '' })
        : call.kind === 'settle'
          ? fill(labels.callSettle, { a: call.token ?? '' })
          : call.kind === 'take'
            ? fill(labels.callTake, { b: call.token ?? '' })
            : call.kind === 'end'
              ? reverted
                ? labels.callRevert
                : labels.callOk
              : labels.callIdle;
  const code =
    call.kind === 'unlock'
      ? 'unlock(data)'
      : call.kind === 'swap'
        ? `swap(${call.from} → ${call.to})`
        : call.kind === 'settle'
          ? 'settle{value: 1 ether}()'
          : call.kind === 'take'
            ? `take(${call.token}, user, amount)`
            : call.kind === 'end'
              ? reverted
                ? 'revert CurrencyNotSettled()'
                : 'deltas == 0 → ok'
              : labels.callIdle;
  const swapHop = call.kind === 'swap' ? (call.hop ?? 0) : s.swapsDone > 0 ? s.swapsDone - 1 : 0;
  const payFrom: Vec3 = [USER[0] + 0.5, 0.9, USER[2]];
  const payTo: Vec3 = [CELL_X[0] - 0.4, VAULT_H + 0.7, CELL_Z[1]];
  const takeFrom: Vec3 = [CELL_X[hops - 1] + 0.4, VAULT_H + 0.7, CELL_Z[1]];
  const takeTo: Vec3 = [USER[0] + 0.5, 0.9, USER[2] + 0.6];

  return (
    <>
      {/* The tab: what the caller owes (below the line) and is owed (above it). */}
      <Box size={[5.6, 4, 0.16]} position={[0, ZERO_Y, BOARD_Z]} color="platform" radius={0.1} />
      <Box size={[5.2, 0.05, 0.06]} position={[0, ZERO_Y, BOARD_Z + 0.12]} color="ink" radius={0.01} />
      {ROUTE_TOKENS.map((t, i) => (
        <DeltaBar key={t} x={BAR_X[i]} value={s.deltas[t]} color={reverted && s.deltas[t] !== 0 ? 'invalid' : TOKEN_COLOR[t]} show={i <= hops} />
      ))}
      <Ball radius={0.2} position={[-2.45, ZERO_Y + 1.65, BOARD_Z + 0.16]} color={status === 'open' ? 'tx' : reverted ? 'invalid' : 'valid'} glow />
      <Label position={[0, ZERO_Y + 2.5, BOARD_Z]} tone={level === 'expert' ? (reverted ? 'invalid' : 'mono') : tone}>
        {level === 'expert' ? code : plain}
      </Label>
      <Label position={[3.7, ZERO_Y - 1.5, BOARD_Z]} maxLevel="beginner" tone="plain">
        <Lines text={labels.tab} />
      </Label>
      <Label position={[3.7, ZERO_Y + 0.4, BOARD_Z]} tone="mono">
        {ROUTE_TOKENS.slice(0, hops + 1).map((t, i) => (
          <Fragment key={t}>
            {i > 0 && <br />}
            {t} {sign(s.deltas[t])}
          </Fragment>
        ))}
      </Label>

      <group position={USER} rotation={[0, 0.9, 0]}>
        <Person color="actor" />
      </group>
      <Label position={[USER[0], 1.8, USER[2]]} tone="actor">
        {labels.you}
      </Label>

      {/* A swap only touches pool state inside the vault. */}
      <Anim show={call.kind === 'swap'} position={overPool(swapHop, 1.1)} speed={5}>
        <Box size={[0.34, 0.34, 0.34]} color="tx" glow radius={0.08} />
      </Anim>
      {/* Only the net amounts cross the vault wall: one payment in, one out. */}
      <Anim show={paid} position={paid ? payTo : payFrom} speed={3}>
        <Coin color="tokenA" />
      </Anim>
      <Anim show={taken} position={taken ? takeTo : takeFrom} speed={3}>
        <Coin color={TOKEN_COLOR[last]} />
      </Anim>

      {/* Token transfers made so far: the same route in v3, and here. */}
      <group position={V3_COUNT_AT}>
        <Cyl radius={0.45} height={0.08} position={[0, 0.04, 0]} color="platform" />
        <group position={[0, 0.08, 0]}>
          <CoinStack count={s.transfersV3} color="neutral" radius={0.3} />
        </group>
      </group>
      <Label position={[V3_COUNT_AT[0], 0.75 + s.transfersV3 * 0.14, V3_COUNT_AT[2]]} tone="plain">
        v3 · {labels.moves}
        <br />
        {s.transfersV3}
      </Label>
      <group position={V4_COUNT_AT}>
        <Cyl radius={0.45} height={0.08} position={[0, 0.04, 0]} color="platform" />
        <group position={[0, 0.08, 0]}>
          <CoinStack count={s.transfersV4} color="valid" radius={0.3} glow />
        </group>
      </group>
      <Label position={[V4_COUNT_AT[0], 0.75 + s.transfersV4 * 0.14, V4_COUNT_AT[2]]} tone="valid">
        v4 · {labels.moves}
        <br />
        {s.transfersV4}
      </Label>
      <Label position={[3.7, ZERO_Y - 1.5, BOARD_Z]} minLevel="expert" tone="mono">
        TSTORE / TLOAD
        <br />
        EIP-1153
      </Label>
    </>
  );
}

/* ---------- Step 3: hooks around a swap ---------- */

const HOOK_CUTS = [1, 2.2, 3, 3.8, 4.6, 5.8];
const LANE_Z = 0.7;
const LANE_Y = 0.62;
const GATE_X = 2.7;
const HOOK_AT: Vec3 = [0, 0, 4];
const OTHER_X = [-3.3, -1.1, 1.1, 3.3];
const FEATURE_COLOR: Record<HookFeature, ColorKey> = { dynamic: 'tx', limit: 'tokenB', twamm: 'tokenA', malicious: 'invalid' };
const ACT_LABEL: Record<HookFeature, string> = { dynamic: 'actDynamic', limit: 'actLimit', twamm: 'actTwamm', malicious: 'actMalicious' };

/** A socket on the swap path where the pool calls out to its hook. */
function Gate({ color, glow }: { color: ColorKey; glow: boolean }) {
  return (
    <group>
      <Box size={[0.16, 1.3, 0.16]} position={[0, 0.65, -0.55]} color={color} glow={glow} radius={0.04} />
      <Box size={[0.16, 1.3, 0.16]} position={[0, 0.65, 0.55]} color={color} glow={glow} radius={0.04} />
      <Box size={[0.2, 0.2, 1.3]} position={[0, 1.36, 0]} color={color} glow={glow} radius={0.05} />
      <Ball radius={0.15} position={[0, 1.58, 0.55]} color={color} glow={glow} />
    </group>
  );
}

function Hooks({ on, labels, lang, level }: { on: boolean; labels: Labels; lang: string; level: Level }) {
  const hook = usePlay((s) => s.hook);
  const run = usePlay((s) => s.swapRun);
  const r = hookSwap(hook);
  const phase = useOncePhase(HOOK_CUTS, run, on, HOOK_CUTS.length);
  const before = phase === 1 && r.before;
  const after = phase === 5 && r.after;
  const swapping = phase === 3;
  const any = r.flags !== 0;
  const expert = level === 'expert';
  const narrow = useThree((three) => three.size.width < 560);
  const y = 0.5 + LANE_Y;
  const lane = (x: number): Vec3 => [x, y - 0.17, LANE_Z];
  const plug = (x: number): Vec3 => [x, 0.5 + 1.58, LANE_Z + 0.55];
  const top: Vec3 = [HOOK_AT[0], 1.7, HOOK_AT[2]];
  const gate = (flagged: boolean, active: boolean): ColorKey => (active ? 'valid' : flagged ? 'chain' : 'neutral');
  const act = (f: HookFeature) => (f === 'dynamic' ? `${labels.actDynamic} ${pctText(r.feeBps / 100, lang)}` : labels[ACT_LABEL[f]]);
  const point = (head: string, bit: number, called: boolean, acts: HookFeature[]) => (
    <>
      {expert ? `${head}() · bit ${bit} = ${called ? 1 : 0}` : called ? head : labels.skipped}
      {acts.map((f) => (
        <Fragment key={f}>
          <br />
          {act(f)}
        </Fragment>
      ))}
    </>
  );
  return (
    <>
      {/* The PoolManager, with the path a swap takes across it. */}
      <Box size={[9.6, 0.5, 3.4]} position={[0, 0.25, 0]} color="contract" radius={0.14} />
      <Box size={[9, 0.1, 0.8]} position={[0, 0.55, LANE_Z]} color="platform" radius={0.04} />
      <group position={[0, 0.5, -0.75]}>
        <Cell a="tokenA" b="tokenB" glow={swapping} size={1.3} />
      </group>
      <group position={[-GATE_X, 0.5, LANE_Z]}>
        <Gate color={gate(r.before, before)} glow={before} />
      </group>
      <group position={[GATE_X, 0.5, LANE_Z]}>
        <Gate color={gate(r.after, after)} glow={after} />
      </group>
      {/* Hook points that this pool's hook does not use. */}
      {OTHER_X.map((x) => (
        <group key={x} position={[x, 0.5, -1.4]} scale={0.42}>
          <Gate color="neutral" glow={false} />
        </group>
      ))}
      {/* A resting limit order next to the pool; it turns green once the swap has filled it. */}
      <Anim show={hook.limit} position={[1.45, 0.5, -0.75]}>
        <Box size={[0.07, 1, 0.07]} position={[0, 0.5, 0]} color="ink" radius={0.02} />
        <Box size={[0.5, 0.3, 0.06]} position={[0.25, 0.85, 0]} color={phase >= 5 && r.ordersFilled > 0 ? 'valid' : 'tokenB'} glow={phase >= 5} radius={0.03} />
      </Anim>

      {/* The hook: a separate contract, wired to the points it asked for. One module per behaviour. */}
      <Anim show={any} position={HOOK_AT}>
        <Platform size={[2.6, 2]} color="ground" height={0.25} />
        <ContractMachine color={hook.malicious ? 'invalid' : 'contract'} glow={before || after} active={on} />
        {HOOK_FEATURES.map((f, i) => (
          <Anim key={f} show={hook[f]} position={[-0.93 + i * 0.62, 0.5, 0]}>
            <Box size={[0.42, 0.36, 0.42]} position={[0, 1.2, 0]} color={FEATURE_COLOR[f]} glow radius={0.07} />
          </Anim>
        ))}
      </Anim>
      <Anim show={r.before}>
        <FlowLine points={[plug(-GATE_X), [-GATE_X * 0.75, 2.5, 2.7], top]} color={before ? 'valid' : 'chain'} curved arrow={false} dashed={!before} />
        <Shot runKey={run} on={on} keys={[[1, plug(-GATE_X)], [1.6, top], [2.2, plug(-GATE_X)]]}>
          <Ball radius={0.14} color="valid" glow />
        </Shot>
      </Anim>
      <Anim show={r.after}>
        <FlowLine points={[plug(GATE_X), [GATE_X * 0.75, 2.5, 2.7], top]} color={after ? 'valid' : 'chain'} curved arrow={false} dashed={!after} />
        <Shot runKey={run} on={on} keys={[[4.6, plug(GATE_X)], [5.2, top], [5.8, plug(GATE_X)]]}>
          <Ball radius={0.14} color="valid" glow />
        </Shot>
      </Anim>
      {/* TWAMM: the hook's own order trades just before yours. */}
      <Anim show={hook.twamm}>
        <Shot runKey={run} on={on} arc={1} keys={[[1.5, top], [2.2, [-0.5, 1.6, -0.75]]]}>
          <Coin color="tokenA" r={0.2} />
        </Shot>
      </Anim>
      {/* Malicious: part of the output goes to the hook instead of the swapper. */}
      <Anim show={hook.malicious}>
        <Shot runKey={run} on={on} arc={1} hold keys={[[4.9, lane(GATE_X)], [5.8, [top[0] + 0.6, 1.75, top[2]]]]}>
          <Coin color="tokenB" r={0.2} />
        </Shot>
      </Anim>

      {/* The swap: token in, token out. */}
      <Shot runKey={run} on={on} keys={[[0, lane(-4.4)], [1, lane(-GATE_X)], [2.2, lane(-GATE_X)], [3, lane(0)], [3.4, lane(0)]]}>
        <Coin color="tokenA" r={0.26} />
      </Shot>
      <Shot runKey={run} on={on} hold keys={[[3.4, lane(0)], [3.8, lane(0)], [4.6, lane(GATE_X)], [5.8, lane(GATE_X)], [6.6, lane(4.4)]]}>
        <Coin color="tokenB" r={hook.malicious ? 0.21 : 0.26} />
      </Shot>

      <Label position={[-GATE_X - 0.7, 3.2, LANE_Z]} tone={expert ? 'mono' : before ? 'valid' : r.before ? 'default' : 'plain'}>
        {point(expert ? 'beforeSwap' : labels.before, BEFORE_SWAP_BIT, r.before, r.beforeActs)}
      </Label>
      <Label position={[0, 2, -0.9]} show={!narrow} maxLevel="intermediate" tone={swapping ? 'tokenB' : 'default'}>
        {labels.theSwap}
      </Label>
      <Label position={[0, 2, -0.9]} show={!narrow} minLevel="expert" tone="mono">
        Pool.swap()
      </Label>
      <Label position={[GATE_X + 1, 2.5, LANE_Z]} tone={expert ? 'mono' : after ? 'valid' : r.after ? 'default' : 'plain'}>
        {point(expert ? 'afterSwap' : labels.after, AFTER_SWAP_BIT, r.after, r.afterActs)}
      </Label>
      <Label position={[HOOK_AT[0] + 2.5, 1.2, HOOK_AT[2] - 0.4]} maxLevel="intermediate" tone={!any ? 'plain' : hook.malicious ? 'invalid' : before || after ? 'valid' : 'default'}>
        {!any ? labels.noHook : level === 'beginner' ? labels.hookB : labels.hookI}
      </Label>
      <Label position={[HOOK_AT[0] + 2.5, 1.2, HOOK_AT[2] - 0.4]} minLevel="expert" tone="mono">
        {any ? `hooks = 0x…${hookAddressSuffix(r.flags)}` : 'hooks = address(0)'}
        {any && (
          <>
            <br />
            bits {flagBits(r.flags).join(' · ')}
          </>
        )}
      </Label>
      <Label position={[-4.3, -0.5, 2.6]} minLevel="intermediate" maxLevel="intermediate" tone="plain">
        <Lines text={labels.others} />
      </Label>
      <Label position={[-4.3, -0.5, 2.6]} minLevel="expert" tone="mono">
        initialize
        <br />
        add / removeLiquidity
        <br />
        donate
      </Label>
      <Label position={[3.9, -0.3, 2.1]} minLevel="intermediate" tone="plain">
        PoolManager
      </Label>
    </>
  );
}

/* ---------- Step 4: native ETH and a dynamic fee ---------- */

const NATIVE = 5;
const GAUGE_H = 2.4;
const OLD_Z = -3.1;
const NEW_Z = 0.5;

function Wobble({ amount }: { amount: number }) {
  const ref = useRef<Group>(null);
  const amp = useRef(amount);
  amp.current = amount;
  useLoop((t) => {
    if (ref.current) ref.current.position.y = (Math.sin(t * 5.1) * 0.6 + Math.sin(t * 8.7) * 0.4) * amp.current;
  });
  return (
    <group ref={ref}>
      <Ball radius={0.2} color="tx" glow />
    </group>
  );
}

function NativeDynamic({ on, labels, lang }: { on: boolean; labels: Labels; lang: string }) {
  const volatility = useFee((s) => s.volatility);
  const bps = feeBpsFor(volatility);
  const level = Math.max(0.03, bps / 100);
  const color: ColorKey = bps < 30 ? 'valid' : bps < 70 ? 'tx' : 'invalid';
  const pct = (bps / 100).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const feeText = lang === 'tr' ? `%${pct}` : `${pct}%`;
  return (
    <>
      {/* The pool inside the PoolManager. */}
      <Box size={[4.6, 0.5, 3.4]} position={[0.5, 0.25, 0]} color="contract" radius={0.14} />
      <group position={[0.5, 0.5, 0]}>
        <PoolBasin width={3} depth={1.9} wall={1} a={0.55} b={0.5} />
      </group>

      {/* Old way: ETH has to be wrapped into an ERC-20 before a pool can hold it. */}
      <Platform size={[7.6, 1.7]} position={[-3.6, 0, OLD_Z]} color="ground" height={0.2} />
      <group position={[-4, 0, OLD_Z]}>
        <Box size={[1.3, 1, 1.1]} position={[0, 0.5, 0]} color="neutral" radius={0.1} />
        <Box size={[0.7, 0.14, 0.06]} position={[0, 0.7, 0.56]} color="ink" radius={0.02} />
      </group>
      <group position={[-1, 0, OLD_Z]}>
        <PoolHouse />
      </group>
      <Runner period={NATIVE} on={on} arc={0.8} keys={[[0, [-6.4, 0.3, OLD_Z]], [1.4, [-4, 1.05, OLD_Z]], [2, [-4, 1.05, OLD_Z]]]}>
        <Coin color="tokenA" r={0.28} />
      </Runner>
      <Runner period={NATIVE} on={on} arc={0.8} keys={[[2, [-4, 1.05, OLD_Z]], [2.6, [-4, 1.05, OLD_Z]], [4, [-1, 1.1, OLD_Z]], [4.6, [-1, 1.1, OLD_Z]]]}>
        <group>
          <Coin color="tokenA" r={0.28} />
          <Cyl radius={0.36} height={0.08} position={[0, 0.04, 0]} color="neutral" />
        </group>
      </Runner>
      <Label position={[-4, 1.75, OLD_Z]} maxLevel="intermediate" tone="plain">
        {labels.wrapOld}
      </Label>
      <Label position={[-4, 1.75, OLD_Z]} minLevel="expert" tone="mono">
        v3: WETH.deposit()
      </Label>

      {/* New way: ETH itself is a currency of the pool. */}
      <Runner period={NATIVE} on={on} arc={1.2} keys={[[0.4, [-6.4, 0.3, NEW_Z]], [2.4, [-0.3, 1.2, NEW_Z - 0.4]], [3, [-0.3, 1.2, NEW_Z - 0.4]]]}>
        <Coin color="tokenA" r={0.28} />
      </Runner>
      <FlowLine points={[[-6.2, 0.05, NEW_Z], [-2.2, 0.05, NEW_Z]]} color="tokenA" dashed />
      <Label position={[-3.9, -0.3, NEW_Z + 1.2]} maxLevel="intermediate" tone="tokenA">
        {labels.direct}
      </Label>
      <Label position={[-3.9, -0.3, NEW_Z + 1.2]} minLevel="expert" tone="mono">
        v4: currency0 =
        <br />
        address(0)
      </Label>

      {/* The hook watches volatility and sets the pool's fee. */}
      <group position={[5.3, 0, -2.6]}>
        <Platform size={[2.4, 2]} color="ground" height={0.2} />
        <ContractMachine color="contract" glow active={on} />
        <group position={[0, 2.5, 0]}>
          <Wobble amount={volatility / VOL_MAX} />
        </group>
        <Label position={[0, 3.6, 0]} maxLevel="intermediate" tone="tx">
          {labels.swing}
        </Label>
        <Label position={[0, 3.7, 0]} minLevel="expert" tone="mono">
          beforeSwap() →
          <br />
          fee |
          <br />
          OVERRIDE_FEE_FLAG
        </Label>
      </group>
      <FlowLine points={[[5.1, 0.6, -1.7], [4.6, 0.6, 0.7]]} color={color} />
      <group position={[4.4, 0, 1.7]}>
        <Cyl radius={0.75} height={0.2} position={[0, 0.1, 0]} color="platform" />
        <Cyl radius={0.5} height={GAUGE_H} position={[0, 0.2 + GAUGE_H / 2, 0]} color="neutral" opacity={0.3} />
        <Anim position={[0, 0.2, 0]} scale={[1, level, 1]} speed={9}>
          <mesh position={[0, GAUGE_H / 2, 0]}>
            <cylinderGeometry args={[0.4, 0.4, GAUGE_H, 28]} />
            <Mat color={color} glow />
          </mesh>
        </Anim>
        <Label position={[0, GAUGE_H + 0.8, 0]} tone={color === 'valid' ? 'valid' : color === 'tx' ? 'tx' : 'invalid'}>
          {labels.fee} {feeText}
        </Label>
      </group>
    </>
  );
}

/* ---------- Steps 5 and 6: the three versions side by side ---------- */

const MODEL_X = [-5.3, 0, 5.3];
const V3_BINS = [0.3, 0.5, 0.9, 1.5, 2, 1.5, 0.9, 0.5, 0.3];

function Slider({ from, to, speed, children }: { from: number; to: number; speed: number; children: ReactNode }) {
  const ref = useRef<Group>(null);
  useLoop((t) => {
    if (ref.current) ref.current.position.x = from + (to - from) * (0.5 + 0.5 * Math.sin(t * speed));
  });
  return (
    <group ref={ref} position={[(from + to) / 2, 0, 0]}>
      {children}
    </group>
  );
}

function Models({ on }: { on: boolean }) {
  return (
    <>
      {/* v2: one basin, liquidity over every price. */}
      <group position={[MODEL_X[0], 0, 0]}>
        <Platform size={[3.8, 2.8]} color="ground" height={0.25} />
        <group position={[0, 0, -0.1]}>
          <PoolBasin width={2.6} depth={1.5} wall={1} a={0.5} b={0.5} />
        </group>
        <Runner period={3} on={on} arc={1} keys={[[0, [-1.9, 0.3, 1.5]], [1.2, [-0.6, 0.9, 0]], [1.3, [-0.6, 0.9, 0]]]}>
          <Coin color="tokenA" r={0.2} />
        </Runner>
        <Runner period={3} on={on} arc={1} keys={[[1.3, [0.6, 0.9, 0]], [2.5, [1.9, 0.3, 1.5]], [2.6, [1.9, 0.3, 1.5]]]}>
          <Coin color="tokenB" r={0.2} />
        </Runner>
      </group>

      {/* v3: the same pool, but liquidity stands where the price is. */}
      <group position={[MODEL_X[1], 0, 0]}>
        <Platform size={[3.8, 2.8]} color="ground" height={0.25} />
        {V3_BINS.map((h, i) => (
          <Box key={i} size={[0.3, h, 1.3]} position={[-1.36 + i * 0.34, h / 2, -0.1]} color={i < 4 ? 'tokenB' : 'tokenA'} radius={0.03} />
        ))}
        <Slider from={-0.5} to={0.5} speed={1.3}>
          <Box size={[0.07, 2.5, 0.07]} position={[0, 1.25, 0.7]} color="ink" radius={0.02} />
          <Ball radius={0.13} position={[0, 2.55, 0.7]} color="valid" glow />
        </Slider>
      </group>

      {/* v4: many pools in one contract, with a hook plugged in. */}
      <group position={[MODEL_X[2], 0, 0]}>
        <Platform size={[3.8, 2.8]} color="ground" height={0.25} />
        <Box size={[3.1, 0.4, 2.1]} position={[0, 0.2, 0]} color="contract" radius={0.1} />
        {[-0.75, 0.75].map((x) =>
          [-0.5, 0.5].map((z) => (
            <group key={`${x}${z}`} position={[x, 0.4, z]}>
              <Cell a={x < 0 ? 'tokenA' : 'tokenB'} b={z < 0 ? 'block' : x < 0 ? 'tokenB' : 'tx'} size={0.8} />
            </group>
          )),
        )}
        <group position={[1.15, 0.4, -1.2]} scale={0.5}>
          <Gate color="valid" glow />
        </group>
        <Runner period={3.2} on={on} arc={0.6} keys={[[0, [-0.75, 1, 0.5]], [1, [0.75, 1, 0.5]], [2, [0.75, 1, -0.5]], [3, [-0.75, 1, -0.5]], [3.2, [-0.75, 1, 0.5]]]}>
          <Box size={[0.22, 0.22, 0.22]} color="tx" glow radius={0.05} />
        </Runner>
      </group>
    </>
  );
}

const EXPERT_FACTS = ['UniswapV2Pair | x · y = k | ERC-20 LP', 'UniswapV3Pool | sqrtPriceX96, ticks | ERC-721', 'PoolManager | PoolKey + hooks | ERC-6909, EIP-1153'];
/** World units the stage is raised on narrow screens, per step. */
const LIFT: Record<string, number> = { singleton: 2.4, flash: 2.1, hooks: 2.6, choose: 1.7 };
const REASON_LABEL: Record<FitReason, string> = { custom: 'rsCustom', passiveVolatile: 'rsPassiveVolatile', passiveStable: 'rsPassiveStable', activeVolatile: 'rsActiveVolatile', activeStable: 'rsActiveStable' };

export default function Scene({ stepId, labels, lang, level }: SceneProps) {
  const isSingleton = stepId === 'singleton';
  const isFlash = stepId === 'flash';
  const isHooks = stepId === 'hooks';
  const isNative = stepId === 'native-dynamic';
  const isCompare = stepId === 'compare';
  const isChoose = stepId === 'choose';
  const v4Extra = usePlay((s) => s.v4Extra);
  const hops = usePlay((s) => s.hops);
  const skipSettle = usePlay((s) => s.skipSettle);
  const callIndex = usePlay((s) => s.callIndex);
  const needs = usePlay((s) => s.needs);
  const flash = flashState(hops, skipSettle, callIndex);
  const fit = suggestVersion(needs);
  const fitIndex = fit.version - 2;
  const suffix = level === 'beginner' ? 'B' : 'I';
  // On a phone the control panel covers the lower half of the canvas, so the stage moves up.
  const narrow = useThree((three) => three.size.width < 560);
  const lift = narrow ? (LIFT[stepId] ?? 0) : 0;
  const litCells = isFlash && flash.call.kind === 'swap' ? [ROUTE_CELL[flash.call.hop ?? 0]] : [];

  return (
    <Anim position={[0, lift, 0]} speed={5}>
      <ShadowGround />
      <group rotation={[0, TURN, 0]}>
        {/* Steps 1-2: the singleton vault; it slides to the centre for the flash-accounting step. */}
        <Anim show={isSingleton || isFlash} position={[isFlash ? 0 : VAULT_X, 0, 0]} speed={4}>
          <Vault lit={litCells} count={isFlash ? 6 : START_POOLS + v4Extra} fresh={isSingleton ? START_POOLS : 6} />
        </Anim>
        <Anim show={isSingleton}>
          <Singleton on={isSingleton} labels={labels} lang={lang} />
        </Anim>
        <Anim show={isFlash}>
          <Flash labels={labels} lang={lang} level={level} />
        </Anim>

        <Anim show={isHooks}>
          <Hooks on={isHooks} labels={labels} lang={lang} level={level} />
        </Anim>

        <Anim show={isNative}>
          <NativeDynamic on={isNative} labels={labels} lang={lang} />
        </Anim>

        {/* Steps 5-6: the same three models; in the last step the learner is walked to the one that fits. */}
        <Anim show={isCompare || isChoose} position={[0, 0, isChoose ? -1.6 : 0]} speed={4}>
          <Models on={isCompare || isChoose} />
          {MODEL_X.map((x, i) => (
            <group key={x} position={[x, 0, 0]}>
              <Label position={[0, 3.2, -0.6]} tone={(isChoose ? i === fitIndex : i === 2) ? 'valid' : 'default'}>
                v{i + 2} · {['2020', '2021', '2025'][i]}
              </Label>
              <Label position={[0, -0.5, 2.1]} show={isCompare} maxLevel="intermediate" tone="plain">
                <Lines text={labels[`cmp${i + 2}${suffix}`]} />
              </Label>
              <Label position={[0, -0.5, 2.1]} show={isCompare} minLevel="expert" tone="mono">
                <Lines text={EXPERT_FACTS[i]} />
              </Label>
            </group>
          ))}
        </Anim>
        <Anim show={isChoose}>
          {/* A lit base under the suggested version, and the learner walking up to it. */}
          <Anim position={[MODEL_X[fitIndex], 0, -1.6]} speed={5}>
            <Box size={[4.5, 0.14, 3.5]} position={[0, -0.16, 0]} color="valid" glow radius={0.06} />
            <group position={[0, 0, 2.9]} rotation={[0, Math.PI, 0]}>
              <Person color="actor" glow />
            </group>
            <FlowLine points={[[0, 0.05, 2.4], [0, 0.05, 1.75]]} color="valid" />
            <Runner period={2.2} on={isChoose} arc={0.4} keys={[[0, [0, 0.4, 2.5]], [1.3, [0, 0.6, 1.5]], [1.9, [0, 0.6, 1.5]]]}>
              <Ball radius={0.14} color="valid" glow />
            </Runner>
          </Anim>
          <Label position={[MODEL_X[fitIndex] + 0.5, -0.6, 2.4]} tone="valid">
            <Lines text={labels[REASON_LABEL[fit.reason]]} />
          </Label>
        </Anim>
      </group>
    </Anim>
  );
}

/* ---------- Controls ---------- */

const PANEL = { width: 'min(600px, calc(100vw - 46px))', gap: '6px 12px' } as const;
/** Tighter controls on phones, so the panel leaves the scene visible. */
const PHONE_CSS = `@media (max-width: 639px) {
  .v4ctl { gap: 4px 8px !important; }
  .v4ctl .ctl-title, .v4ctl .wide-only { display: none; }
  .v4ctl .btn { min-height: 32px; padding: 0 9px; font-size: 0.8rem; }
  .v4ctl .seg { padding: 2px; }
  .v4ctl .seg button { min-height: 28px; padding: 0 7px; font-size: 0.76rem; }
  .v4ctl .ctl-check { min-height: 30px; gap: 6px; font-size: 0.78rem; }
  .v4ctl .ctl-check input { width: 17px; height: 17px; }
  .v4ctl .ctl-field { font-size: 0.72rem; }
  .v4ctl .ctl-stats { gap: 2px 10px; }
  .v4ctl .ctl-stat { font-size: 0.66rem; }
  .v4ctl .ctl-stat strong { font-size: 0.78rem; }
}`;
const Phone = () => <style>{PHONE_CSS}</style>;
const TIGHT = { minWidth: 0, flex: '0 0 auto' } as const;

function DeployControls({ labels, lang }: SceneProps) {
  const { oldExtra, v4Extra, deployOld, deployV4, resetDeploy } = usePlay();
  const t = deployTotals(oldExtra, v4Extra);
  return (
    <div className="ctl v4ctl" style={PANEL}>
      <Phone />
      <div className="ctl-title">{labels.tryDeploy}</div>
      <button type="button" className="btn" data-act="deploy-old" disabled={oldExtra >= MAX_EXTRA_POOLS} onClick={deployOld}>
        {labels.deployOld}
      </button>
      <button type="button" className="btn btn-primary" data-act="deploy-v4" disabled={v4Extra >= MAX_EXTRA_POOLS} onClick={deployV4}>
        {labels.deployV4}
      </button>
      <button type="button" className="btn btn-quiet" data-act="deploy-reset" disabled={oldExtra + v4Extra === 0} onClick={resetDeploy}>
        {labels.reset}
      </button>
      <div className="ctl-stats" style={{ flexBasis: '100%' }}>
        <div className="ctl-stat">
          <span>v2 / v3 · {labels.contracts}</span>
          <strong>{t.oldContracts}</strong>
        </div>
        <div className="ctl-stat">
          <span>v2 / v3 · gas*</span>
          <strong data-tone={t.oldGas > 0 ? 'bad' : undefined}>≈ {gasText(t.oldGas, lang)}</strong>
        </div>
        <div className="ctl-stat">
          <span>v4 · {labels.contracts}</span>
          <strong>
            {t.v4Contracts} ({t.v4Pools} {labels.pools})
          </strong>
        </div>
        <div className="ctl-stat">
          <span>v4 · gas*</span>
          <strong data-tone={t.v4Gas > 0 ? 'good' : undefined}>≈ {gasText(t.v4Gas, lang)}</strong>
        </div>
      </div>
      <div className="ctl-stat">
        <span>* {labels.illustrative}</span>
      </div>
    </div>
  );
}

function FlashControls({ labels, level }: SceneProps) {
  const { hops, skipSettle, callIndex, setHops, setSkipSettle, nextCall } = usePlay();
  const s = flashState(hops, skipSettle, callIndex);
  const last = s.calls.length - 1;
  const tab = s.status === 'idle' ? '—' : s.status === 'open' && s.nonZero > 0 ? `${s.nonZero} ${labels.tabOpen}` : s.status !== 'reverted' ? labels.tabZero : '';
  return (
    <div className="ctl v4ctl" style={PANEL}>
      <Phone />
      <div className="ctl-title">{labels.tryFlash}</div>
      <div className="ctl-field" style={{ ...TIGHT, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{labels.hops}</span>
        <div className="seg" role="group" aria-label={labels.hops}>
          {[1, 2, 3].map((n) => (
            <button type="button" key={n} data-hops={n} aria-pressed={hops === n} onClick={() => setHops(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <label className="ctl-check">
        <input type="checkbox" checked={skipSettle} onChange={(e) => setSkipSettle(e.target.checked)} />
        {labels.forget}
      </label>
      <button type="button" className="btn btn-primary" data-act="next-call" onClick={nextCall}>
        {s.index >= last ? labels.startOver : labels.nextCall}
      </button>
      <div className="ctl-stats">
        <div className="ctl-stat">
          <span>{labels.statCall}</span>
          <strong>
            {s.index} / {last}
          </strong>
        </div>
        <div className="ctl-stat">
          <span>{labels.statTab}</span>
          <strong data-tone={s.status === 'settled' ? 'good' : s.status === 'reverted' ? 'bad' : undefined}>
            {s.status !== 'reverted' ? (
              tab
            ) : level === 'beginner' ? (
              labels.reverted
            ) : (
              <>
                <span className="wide-only">{labels.reverted}: </span>CurrencyNotSettled
              </>
            )}
          </strong>
        </div>
        <div className="ctl-stat">
          <span>{labels.transfers}</span>
          <strong>
            v3 {s.totalV3} · v4 {s.totalV4}
          </strong>
        </div>
      </div>
    </div>
  );
}

function HookControls({ labels, lang, level }: SceneProps) {
  const { hook, swapped, toggleHook, runSwap } = usePlay();
  const r = hookSwap(hook);
  const names = level === 'beginner' ? [labels.cbBefore, labels.cbSwap, labels.cbAfter] : ['beforeSwap', 'swap', 'afterSwap'];
  const fired = [r.before && names[0], names[1], r.after && names[2]].filter(Boolean).join(' → ');
  const usdc = (n: number) => `${fmt(n, lang, 0, 0)} USDC`;
  return (
    <div className="ctl v4ctl" style={PANEL}>
      <Phone />
      <div className="ctl-title">{labels.tryHooks}</div>
      <div className="seg" role="group" aria-label={labels.hookDoes} style={{ flexWrap: 'wrap' }}>
        {HOOK_FEATURES.map((f) => (
          <button type="button" key={f} data-hook={f} aria-pressed={hook[f]} onClick={() => toggleHook(f)}>
            {labels[`hk_${f}`]}
          </button>
        ))}
      </div>
      <button type="button" className="btn btn-primary" data-act="swap" onClick={runSwap}>
        {labels.swapBtn}
      </button>
      <div className="ctl-stats" style={{ flexBasis: '100%' }}>
        <div className="ctl-stat">
          <span>{labels.fired}</span>
          <strong>{swapped ? fired : labels.notYet}</strong>
        </div>
        <div className="ctl-stat">
          <span>{labels.lpFee}</span>
          <strong>{pctText(r.feeBps / 100, lang)}</strong>
        </div>
        <div className="ctl-stat">
          <span>{labels.received}</span>
          <strong>{swapped ? usdc(r.received) : '—'}</strong>
        </div>
        {hook.malicious && (
          <div className="ctl-stat">
            <span>{labels.hookTakes}</span>
            <strong data-tone="bad">{swapped ? usdc(r.hookTake) : '—'}</strong>
          </div>
        )}
        {hook.limit && (
          <div className="ctl-stat">
            <span>{labels.filled}</span>
            <strong data-tone={swapped && r.ordersFilled > 0 ? 'good' : undefined}>{swapped ? r.ordersFilled : '—'}</strong>
          </div>
        )}
        {level === 'expert' && (
          <div className="ctl-stat">
            <span>key.hooks</span>
            <strong>
              {r.flags ? `0x…${hookAddressSuffix(r.flags)}` : 'address(0)'}
              {r.flags !== 0 && <span className="wide-only"> · bits {flagBits(r.flags).join(', ')}</span>}
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}

function ChooseControls({ labels }: SceneProps) {
  const { needs, setNeeds } = usePlay();
  const fit = suggestVersion(needs);
  const pick = (name: string, options: [label: string, on: boolean, set: () => void][]) => (
    <div className="seg" role="group" aria-label={name}>
      {options.map(([label, on, set], i) => (
        <button type="button" key={label} data-pick={`${name}-${i}`} aria-pressed={on} onClick={set}>
          {label}
        </button>
      ))}
    </div>
  );
  return (
    <div className="ctl v4ctl" style={PANEL}>
      <Phone />
      <div className="ctl-title">{labels.tryChoose}</div>
      {pick('lp', [
        [labels.qPassive, needs.lp === 'passive', () => setNeeds({ lp: 'passive' })],
        [labels.qActive, needs.lp === 'active', () => setNeeds({ lp: 'active' })],
      ])}
      {pick('logic', [
        [labels.qStandard, !needs.custom, () => setNeeds({ custom: false })],
        [labels.qCustom, needs.custom, () => setNeeds({ custom: true })],
      ])}
      {pick('pair', [
        [labels.qVolatile, needs.pair === 'volatile', () => setNeeds({ pair: 'volatile' })],
        [labels.qStable, needs.pair === 'stable', () => setNeeds({ pair: 'stable' })],
      ])}
      <div className="ctl-stat">
        <span>{labels.suggested}</span>
        <strong data-tone="good">
          Uniswap v{fit.version}
          <span className="wide-only">: {labels[REASON_LABEL[fit.reason]].replace(' | ', ' ')}</span>
        </strong>
      </div>
    </div>
  );
}

function FeeControls({ labels, lang, level }: SceneProps) {
  const volatility = useFee((s) => s.volatility);
  const setVolatility = useFee((s) => s.setVolatility);
  const bps = feeBpsFor(volatility);
  return (
    <div className="ctl" style={{ width: 'min(440px, calc(100vw - 46px))', gap: '4px 14px', flexWrap: 'nowrap' }}>
      <label className="ctl-field" style={{ minWidth: 120 }}>
        <span>
          {labels.volatility} {pctText(volatility, lang, 1)}
        </span>
        <input type="range" style={{ height: 22 }} min={0} max={VOL_MAX} step={VOL_STEP} value={volatility} onChange={(e) => setVolatility(+e.target.value)} />
      </label>
      <div className="ctl-stat">
        <span>{labels.lpFee}</span>
        <strong>{pctText(bps / 100, lang)}</strong>
      </div>
      {level === 'expert' && (
        <div className="ctl-stat">
          <span>uint24 fee</span>
          <strong>{bps * 100}</strong>
        </div>
      )}
    </div>
  );
}

export function Controls(props: SceneProps) {
  switch (props.stepId) {
    case 'singleton':
      return <DeployControls {...props} />;
    case 'flash':
      return <FlashControls {...props} />;
    case 'hooks':
      return <HookControls {...props} />;
    case 'native-dynamic':
      return <FeeControls {...props} />;
    case 'choose':
      return <ChooseControls {...props} />;
    default:
      return null;
  }
}
