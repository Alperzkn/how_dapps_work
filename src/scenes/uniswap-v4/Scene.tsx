import { Fragment, useRef, useState, type ReactNode } from 'react';
import type { Group } from 'three';
import { Anim, Ball, Box, ContractMachine, Cyl, FlowLine, Label, Mat, Person, Platform, PoolBasin, ShadowGround, useLoop, useScene, type Vec3 } from '../../scene/kit';
import type { SceneProps } from '../../scene/types';
import type { ColorKey } from '../../theme/tokens';
import { feeBpsFor, useFee, VOL_MAX, VOL_STEP } from './state';

/** The whole stage is turned a little toward the viewer so rows read left to right. */
const TURN = Math.PI / 8;

type Labels = Record<string, string>;

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

/** Index of the current part of a repeating timeline. `cuts` are the times where the next part begins. */
function usePhase(period: number, cuts: number[], on: boolean, still: number) {
  const { reducedMotion } = useScene();
  const [phase, setPhase] = useState(0);
  const cur = useRef(0);
  useLoop((t) => {
    const u = t % period;
    let p = 0;
    while (p < cuts.length && u >= cuts[p]) p++;
    if (p !== cur.current) {
      cur.current = p;
      setPhase(p);
    }
  }, on);
  return reducedMotion ? still : phase;
}

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
function PoolHouse() {
  return (
    <group>
      <Box size={[1.25, 0.8, 1.05]} position={[0, 0.4, 0]} color="contract" radius={0.1} />
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

/** v4: one contract holding every pool as a compartment. */
function Vault({ lit = [] }: { lit?: number[] }) {
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
            <group key={i} position={[x, VAULT_H, z]}>
              <Cell a={PAIRS[i][0]} b={PAIRS[i][1]} glow={lit.includes(i)} size={1.15} />
            </group>
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

function Singleton({ on, labels }: { on: boolean; labels: Labels }) {
  return (
    <>
      <Platform size={[5.6, 4.6]} position={[-4.9, 0, 0]} color="ground" height={0.25} />
      {HOUSES.map((h, i) => (
        <group key={i} position={h}>
          <PoolHouse />
        </group>
      ))}
      {/* Pools move out of their own contracts and into compartments of the one contract. */}
      {HOUSES.map((h, i) => {
        const to: Vec3 = [VAULT_X + CELL_X[i % 3], VAULT_H + 0.2, CELL_Z[Math.floor(i / 3)]];
        const start = i * 0.9;
        return (
          <Runner key={i} period={MOVE} on={on} arc={2.2} keys={[[start, [h[0], 1.1, h[2]]], [start + 1.5, to]]}>
            <Cell a="tokenA" b="tokenB" size={0.5} glow />
          </Runner>
        );
      })}
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

const FLASH = 9.6;
const FLASH_CUTS = [1.2, 2.9, 4.6, 6.2, 7.8];
const DELTAS: Record<'eth' | 'usdc' | 'dai', number[]> = {
  eth: [0, -1, -1, -1, 0, 0],
  usdc: [0, 1, 0, 0, 0, 0],
  dai: [0, 0, 1, 1, 1, 0],
};
const FLASH_CODE = ['unlock(data)', 'swap(ETH → USDC)', 'swap(USDC → DAI)', 'settle{value: 1 ether}()', 'take(DAI, user, 1999e18)', 'deltas == 0 → ok'];
const BOARD_Z = -2.75;
const ZERO_Y = 3;
const USER: Vec3 = [-5.4, 0, 2.3];
const POOL_1: Vec3 = [CELL_X[0], VAULT_H + 1.1, CELL_Z[1]];
const POOL_2: Vec3 = [CELL_X[1], VAULT_H + 1.1, CELL_Z[1]];

function DeltaBar({ x, value, color }: { x: number; value: number; color: ColorKey }) {
  return (
    <group position={[x, ZERO_Y, BOARD_Z + 0.16]}>
      <Anim scale={[1, value === 0 ? 0.03 : value * 0.95, 1]} speed={9}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.7, 1, 0.14]} />
          <Mat color={color} glow={value !== 0} />
        </mesh>
      </Anim>
    </group>
  );
}

function Flash({ on, phase, labels }: { on: boolean; phase: number; labels: Labels }) {
  const eth = DELTAS.eth[phase];
  const usdc = DELTAS.usdc[phase];
  const dai = DELTAS.dai[phase];
  const sign = (n: number, unit: number) => (n === 0 ? '0' : `${n > 0 ? '+' : '−'}${unit.toLocaleString('en-US')}`);
  const settled = phase === 0 || phase === 5;
  return (
    <>
      {/* The tab: what the caller owes (below the line) and is owed (above it). */}
      <Box size={[5.6, 4, 0.16]} position={[0, ZERO_Y, BOARD_Z]} color="platform" radius={0.1} />
      <Box size={[5.2, 0.05, 0.06]} position={[0, ZERO_Y, BOARD_Z + 0.12]} color="ink" radius={0.01} />
      <DeltaBar x={-1.6} value={eth} color="tokenA" />
      <DeltaBar x={0} value={usdc} color="tokenB" />
      <DeltaBar x={1.6} value={dai} color="block" />
      <Ball radius={0.2} position={[-2.45, ZERO_Y + 1.65, BOARD_Z + 0.16]} color={settled ? 'valid' : 'tx'} glow />
      <Label position={[0, ZERO_Y + 2.5, BOARD_Z]} maxLevel="intermediate" tone={settled ? 'valid' : 'tx'}>
        {labels[`flash${phase}`]}
      </Label>
      <Label position={[0, ZERO_Y + 2.5, BOARD_Z]} minLevel="expert" tone="mono">
        {FLASH_CODE[phase]}
      </Label>
      <Label position={[3.7, ZERO_Y + 0.4, BOARD_Z]} maxLevel="beginner" tone="plain">
        <Lines text={labels.tab} />
      </Label>
      <Label position={[3.9, ZERO_Y + 0.4, BOARD_Z]} minLevel="intermediate" tone="mono">
        ETH {sign(eth, 1)}
        <br />
        USDC {sign(usdc, 2000)}
        <br />
        DAI {sign(dai, 1999)}
      </Label>

      <group position={USER} rotation={[0, 0.9, 0]}>
        <Person color="actor" />
      </group>
      <Label position={[USER[0], 1.8, USER[2]]} tone="actor">
        {labels.you}
      </Label>

      {/* The two swaps only touch pool state inside the vault. */}
      <Runner period={FLASH} on={on} arc={0.7} keys={[[1.2, POOL_1], [2.9, POOL_1], [3.7, POOL_2], [4.6, POOL_2]]}>
        <Box size={[0.34, 0.34, 0.34]} color="tx" glow radius={0.08} />
      </Runner>
      {/* Only two real transfers cross the vault wall. */}
      <Runner period={FLASH} on={on} arc={1.6} keys={[[4.6, [USER[0] + 0.5, 0.9, USER[2]]], [6.1, [CELL_X[0] - 0.4, VAULT_H + 0.7, CELL_Z[1]]], [6.2, [CELL_X[0] - 0.4, VAULT_H + 0.7, CELL_Z[1]]]]}>
        <Coin color="tokenA" />
      </Runner>
      <Runner period={FLASH} on={on} arc={1.6} keys={[[6.2, [CELL_X[1] + 0.4, VAULT_H + 0.7, CELL_Z[1]]], [7.7, [USER[0] + 0.5, 0.9, USER[2] + 0.5]], [7.8, [USER[0] + 0.5, 0.9, USER[2] + 0.5]]]}>
        <Coin color="block" />
      </Runner>
      <Label position={[1.2, -0.4, 3.2]} minLevel="expert" tone="mono">
        TSTORE / TLOAD · EIP-1153
      </Label>
    </>
  );
}

/* ---------- Step 3: hooks around a swap ---------- */

const HOOK = 7.4;
const HOOK_CUTS = [1, 2.2, 3, 3.8, 4.6, 5.8];
const LANE_Z = 0.7;
const LANE_Y = 0.62;
const GATE_X = 2.7;
const HOOK_AT: Vec3 = [0, 0, 4];
const OTHER_X = [-3.3, -1.1, 1.1, 3.3];

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

function Hooks({ on, phase, labels }: { on: boolean; phase: number; labels: Labels }) {
  const before = phase === 1;
  const after = phase === 5;
  const swapping = phase === 3;
  const y = 0.5 + LANE_Y;
  const lane = (x: number): Vec3 => [x, y - 0.17, LANE_Z];
  const plug = (x: number): Vec3 => [x, 0.5 + 1.58, LANE_Z + 0.55];
  const top: Vec3 = [HOOK_AT[0], 1.7, HOOK_AT[2]];
  return (
    <>
      {/* The PoolManager, with the path a swap takes across it. */}
      <Box size={[9.6, 0.5, 3.4]} position={[0, 0.25, 0]} color="contract" radius={0.14} />
      <Box size={[9, 0.1, 0.8]} position={[0, 0.55, LANE_Z]} color="platform" radius={0.04} />
      <group position={[0, 0.5, -0.75]}>
        <Cell a="tokenA" b="tokenB" glow={swapping} size={1.3} />
      </group>
      <group position={[-GATE_X, 0.5, LANE_Z]}>
        <Gate color={before ? 'valid' : 'chain'} glow={before} />
      </group>
      <group position={[GATE_X, 0.5, LANE_Z]}>
        <Gate color={after ? 'valid' : 'chain'} glow={after} />
      </group>
      {/* Hook points that this pool's hook does not use. */}
      {OTHER_X.map((x) => (
        <group key={x} position={[x, 0.5, -1.4]} scale={0.42}>
          <Gate color="neutral" glow={false} />
        </group>
      ))}

      {/* The hook: a separate contract, wired to the points it asked for. */}
      <group position={HOOK_AT}>
        <Platform size={[2.6, 2]} color="ground" height={0.25} />
        <ContractMachine color="contract" glow={before || after} active={on} />
      </group>
      <FlowLine points={[plug(-GATE_X), [-GATE_X * 0.75, 2.5, 2.7], top]} color={before ? 'valid' : 'chain'} curved arrow={false} dashed={!before} />
      <FlowLine points={[plug(GATE_X), [GATE_X * 0.75, 2.5, 2.7], top]} color={after ? 'valid' : 'chain'} curved arrow={false} dashed={!after} />

      {/* The swap: token in, token out. */}
      <Runner period={HOOK} on={on} keys={[[0, lane(-4.4)], [1, lane(-GATE_X)], [2.2, lane(-GATE_X)], [3, lane(0)], [3.4, lane(0)]]}>
        <Coin color="tokenA" r={0.26} />
      </Runner>
      <Runner period={HOOK} on={on} keys={[[3.4, lane(0)], [3.8, lane(0)], [4.6, lane(GATE_X)], [5.8, lane(GATE_X)], [6.6, lane(4.4)], [7.3, lane(4.4)]]}>
        <Coin color="tokenB" r={0.26} />
      </Runner>
      {/* The call out to the hook and back. */}
      <Runner period={HOOK} on={on} keys={[[1, plug(-GATE_X)], [1.6, top], [2.2, plug(-GATE_X)]]}>
        <Ball radius={0.14} color="valid" glow />
      </Runner>
      <Runner period={HOOK} on={on} keys={[[4.6, plug(GATE_X)], [5.2, top], [5.8, plug(GATE_X)]]}>
        <Ball radius={0.14} color="valid" glow />
      </Runner>

      <Label position={[-GATE_X, 2.8, LANE_Z]} maxLevel="intermediate" tone={before ? 'valid' : 'default'}>
        {labels.before}
      </Label>
      <Label position={[-GATE_X, 2.8, LANE_Z]} minLevel="expert" tone="mono">
        beforeSwap()
      </Label>
      <Label position={[0, 2, -0.9]} maxLevel="intermediate" tone={swapping ? 'tokenB' : 'default'}>
        {labels.theSwap}
      </Label>
      <Label position={[0, 2, -0.9]} minLevel="expert" tone="mono">
        Pool.swap()
      </Label>
      <Label position={[GATE_X, 2.8, LANE_Z]} maxLevel="intermediate" tone={after ? 'valid' : 'default'}>
        {labels.after}
      </Label>
      <Label position={[GATE_X, 2.8, LANE_Z]} minLevel="expert" tone="mono">
        afterSwap()
      </Label>
      <Label position={[HOOK_AT[0], -0.4, HOOK_AT[2] + 1.5]} maxLevel="beginner" tone={before || after ? 'valid' : 'default'}>
        {labels.hookB}
      </Label>
      <Label position={[HOOK_AT[0], -0.4, HOOK_AT[2] + 1.5]} minLevel="intermediate" maxLevel="intermediate" tone={before || after ? 'valid' : 'default'}>
        {labels.hookI}
      </Label>
      <Label position={[HOOK_AT[0], -0.5, HOOK_AT[2] + 1.6]} minLevel="expert" tone="mono">
        hooks = 0x…00C0
        <br />
        bit 7 beforeSwap · bit 6 afterSwap
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

const CHOOSERS = ['need2', 'need3', 'need4'] as const;

export default function Scene({ stepId, labels, lang, level }: SceneProps) {
  const isSingleton = stepId === 'singleton';
  const isFlash = stepId === 'flash';
  const isHooks = stepId === 'hooks';
  const isNative = stepId === 'native-dynamic';
  const isCompare = stepId === 'compare';
  const isChoose = stepId === 'choose';
  const flashPhase = usePhase(FLASH, FLASH_CUTS, isFlash, 2);
  const hookPhase = usePhase(HOOK, HOOK_CUTS, isHooks, 1);
  const suffix = level === 'beginner' ? 'B' : 'I';

  return (
    <>
      <ShadowGround />
      <group rotation={[0, TURN, 0]}>
        {/* Steps 1-2: the singleton vault; it slides to the centre for the flash-accounting step. */}
        <Anim show={isSingleton || isFlash} position={[isFlash ? 0 : VAULT_X, 0, 0]} speed={4}>
          <Vault lit={isFlash ? (flashPhase === 1 ? [3] : flashPhase === 2 ? [4] : []) : []} />
        </Anim>
        <Anim show={isSingleton}>
          <Singleton on={isSingleton} labels={labels} />
        </Anim>
        <Anim show={isFlash}>
          <Flash on={isFlash} phase={flashPhase} labels={labels} />
        </Anim>

        <Anim show={isHooks}>
          <Hooks on={isHooks} phase={hookPhase} labels={labels} />
        </Anim>

        <Anim show={isNative}>
          <NativeDynamic on={isNative} labels={labels} lang={lang} />
        </Anim>

        {/* Steps 5-6: the same three models; in the last step people walk up to the one that fits them. */}
        <Anim show={isCompare || isChoose} position={[0, 0, isChoose ? -1.6 : 0]} speed={4}>
          <Models on={isCompare || isChoose} />
          {MODEL_X.map((x, i) => (
            <group key={x} position={[x, 0, 0]}>
              <Label position={[0, 3.2, -0.6]} tone={i === 2 ? 'valid' : 'default'}>
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
          {MODEL_X.map((x, i) => (
            <group key={x}>
              <group position={[x, 0, 3.1]} rotation={[0, Math.PI, 0]}>
                <Person color="actor" />
              </group>
              <FlowLine points={[[x, 0.05, 2.5], [x, 0.05, 0.2]]} color="actor" dashed />
              <Runner period={2.6} on={isChoose} arc={0.5} keys={[[i * 0.5, [x, 0.3, 2.6]], [i * 0.5 + 1.4, [x, 0.5, 0.1]]]}>
                <Ball radius={0.14} color="actor" glow />
              </Runner>
              <Label position={[x + (i === 0 ? 0.7 : 0.2), i === 1 ? -1.3 : -0.5, 4.3]} tone="actor">
                <Lines text={labels[`${CHOOSERS[i]}${suffix}`]} />
              </Label>
            </group>
          ))}
        </Anim>
      </group>
    </>
  );
}

const EXPERT_FACTS = ['UniswapV2Pair | x · y = k | ERC-20 LP', 'UniswapV3Pool | sqrtPriceX96, ticks | ERC-721', 'PoolManager | PoolKey + hooks | ERC-6909, EIP-1153'];

export function Controls({ stepId, labels, lang, level }: SceneProps) {
  const volatility = useFee((s) => s.volatility);
  const setVolatility = useFee((s) => s.setVolatility);
  if (stepId !== 'native-dynamic') return null;
  const locale = lang === 'tr' ? 'tr-TR' : 'en-US';
  const bps = feeBpsFor(volatility);
  const num = (n: number, digits: number) => n.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const pct = (text: string) => (lang === 'tr' ? `%${text}` : `${text}%`);
  return (
    <div className="ctl" style={{ width: 'min(440px, calc(100vw - 46px))', gap: '4px 14px', flexWrap: 'nowrap' }}>
      <label className="ctl-field" style={{ minWidth: 120 }}>
        <span>
          {labels.volatility} {pct(num(volatility, 1))}
        </span>
        <input type="range" style={{ height: 22 }} min={0} max={VOL_MAX} step={VOL_STEP} value={volatility} onChange={(e) => setVolatility(+e.target.value)} />
      </label>
      <div className="ctl-stat">
        <span>{labels.lpFee}</span>
        <strong>{pct(num(bps / 100, 2))}</strong>
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
