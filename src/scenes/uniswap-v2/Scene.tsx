import { useThree } from '@react-three/fiber';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Vector3, type Group } from 'three';
import { Anim, Ball, Box, Cyl, FlowLine, Label, Person, Platform, PoolBasin, ShadowGround, Token, useLevel, useLoop, useScene, type Vec3 } from '../../scene/kit';
import type { SceneProps } from '../../scene/types';
import type { Lang } from '../../types';
import {
  addLiquidity, arbitrage, BOOKS, DEPTHS, FEE_POOL, marketBuy, matching, MAX_BUY, MAX_DEPOSIT_ETH, MAX_DEPOSIT_USDC, MAX_TRADES, MAX_UNITS, MOVE_MAX, P0,
  poolBuy, priceMove, quoteSwap, ratioOf, simulateTrades, SLIP_TRADE, slippage, TOL_MAX, TOL_MIN, X0, Y0,
  type Ask, type BookFill, type Dir, type PriceMove, type Slippage,
} from './logic';
import { useV2 } from './state';

type L = Record<string, string>;

const OB: Vec3 = [-6, 0, 0];
const LP1: Vec3 = [-4.3, 0, 0.9];
const LP2: Vec3 = [4.4, 0, 0.2];
const TRADER: Vec3 = [0, 0, 3.7];
/** On the swap step the trader stands beside the pool, clear of the controls. */
const TRADER_SIDE: Vec3 = [-3.6, 0, 3];
const ARB: Vec3 = [4.7, 0, -0.9];
/** Fill height of each side of the basin when the pool holds X0 and Y0. */
const LEVEL = 0.75;

// The chart on the board behind the pool: reserves in, board coordinates out.
// The board stands behind the pool and is turned to face the camera.
const PANEL: Vec3 = [-2.5, 0, -2.5];
const AX = { x0: -1.9, y0: 1.25, w: 3.7, h: 2.4, maxX: 260, maxY: 430_000 };
const toPanel = (x: number, y: number, z = 0.1): Vec3 => [AX.x0 + (Math.min(x, AX.maxX) / AX.maxX) * AX.w, AX.y0 + (Math.min(y, AX.maxY) / AX.maxY) * AX.h, z];
const CURVE: Vec3[] = Array.from({ length: 48 }, (_, i) => {
  const x = 47 + (203 * i) / 47;
  return toPanel(x, (X0 * Y0) / x);
});
const START = toPanel(X0, Y0, 0.12);

const PATHS = {
  frontIn: [[0, 1.2, 3.5], [-1, 1.5, 0.2]] as Vec3[],
  frontInB: [[0, 1.2, 3.5], [1, 1.5, 0.2]] as Vec3[],
  frontOutB: [[1, 1.5, 0.2], [0.3, 1.2, 3.5]] as Vec3[],
  frontOutA: [[-1, 1.5, 0.2], [0.3, 1.2, 3.5]] as Vec3[],
  sideInA: [[-3.4, 1.2, 2.8], [-1, 1.5, 0.2]] as Vec3[],
  sideInB: [[-3.4, 1.2, 2.8], [1, 1.5, 0.2]] as Vec3[],
  sideOutB: [[1, 1.5, 0.2], [-3.4, 1.2, 3]] as Vec3[],
  sideOutA: [[-1, 1.5, 0.2], [-3.4, 1.2, 3]] as Vec3[],
  arbInA: [[ARB[0], 1.2, ARB[2]], [-1, 1.5, 0.2]] as Vec3[],
  arbInB: [[ARB[0], 1.2, ARB[2]], [1, 1.5, 0.2]] as Vec3[],
  arbOutA: [[-1, 1.5, 0.2], [ARB[0], 1.2, ARB[2]]] as Vec3[],
  arbOutB: [[1, 1.5, 0.2], [ARB[0], 1.2, ARB[2]]] as Vec3[],
  lp1A: [[LP1[0], 1.4, LP1[2]], [-1, 1.5, 0]] as Vec3[],
  lp1B: [[LP1[0], 1.4, LP1[2]], [1, 1.5, 0]] as Vec3[],
  lp1BackA: [[-1, 1.5, 0], [LP1[0], 1.4, LP1[2]]] as Vec3[],
  lp1BackB: [[1, 1.5, 0], [LP1[0], 1.4, LP1[2]]] as Vec3[],
};

const locale = (lang: Lang) => (lang === 'tr' ? 'tr-TR' : 'en-US');

/** Formats a number for display; anything that is not a finite number shows as 0. */
function fmt(n: number, digits: number, lang: Lang): string {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString(locale(lang), { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function pct(fraction: number, digits: number, lang: Lang): string {
  const v = Number.isFinite(fraction) ? fraction * 100 : 0;
  // Avoid "-0.00".
  const shown = Math.abs(v) < 0.5 / 10 ** digits ? 0 : v;
  const body = fmt(Math.abs(shown), digits, lang);
  return `${shown < 0 ? '−' : ''}${lang === 'tr' ? `%${body}` : `${body}%`}`;
}

/**
 * One leg of a repeating sequence: the child travels `path` between `from` and
 * `to` seconds of every `cycle` and is hidden for the rest of it.
 */
function Leg({ path, cycle, from, to, arc = 0.8, children }: { path: Vec3[]; cycle: number; from: number; to: number; arc?: number; children: ReactNode }) {
  const ref = useRef<Group>(null);
  const pts = useMemo(() => path.map((p) => new Vector3(...p)), [path]);
  useLoop((time) => {
    const g = ref.current;
    if (!g) return;
    const t = time % cycle;
    if (t < from || t > to) {
      g.visible = false;
      return;
    }
    g.visible = true;
    const u = (t - from) / (to - from);
    const n = pts.length - 1;
    const seg = Math.min(Math.floor(u * n), n - 1);
    const f = u * n - seg;
    const e = f * f * (3 - 2 * f);
    g.position.lerpVectors(pts[seg], pts[seg + 1], e);
    g.position.y += Math.sin(e * Math.PI) * arc;
  });
  return (
    <group ref={ref} position={path[path.length - 1]}>
      {children}
    </group>
  );
}

function Bob({ amount = 0.1, speed = 2.2, phase = 0, children }: { amount?: number; speed?: number; phase?: number; children: ReactNode }) {
  const ref = useRef<Group>(null);
  useLoop((t) => {
    if (ref.current) ref.current.position.y = Math.sin(t * speed + phase) * amount;
  });
  return <group ref={ref}>{children}</group>;
}

/** A number that glides to its target, so reserve levels rise and fall instead of jumping. */
function useEased(target: number, start: number): number {
  const { reducedMotion } = useScene();
  const cur = useRef(start);
  const [value, setValue] = useState(start);
  useLoop((_, dt) => {
    const d = target - cur.current;
    if (d === 0) return;
    cur.current = Math.abs(d) < 0.003 ? target : cur.current + d * (1 - Math.exp(-dt * 7));
    setValue(cur.current);
  });
  return reducedMotion ? target : value;
}

/** The pool. `a` and `b` are the fill heights of the two reserves. */
function Pool({ a, b }: { a: number; b: number }) {
  const ea = useEased(a, 0.15);
  const eb = useEased(b, 0.15);
  return <PoolBasin a={ea} b={eb} />;
}

/** A small flat coin: the 0.3% fee. */
const FeeCoin = () => <Cyl radius={0.16} height={0.07} color="tx" glow />;

/** Where the fee coins float in the pool on the fee step. */
const COIN_SPOTS: [number, number][] = [
  [-1.5, 0.5], [0.6, -0.3], [-0.5, 0.6], [1.3, 0.5], [-0.9, -0.4], [1.5, -0.5],
  [-1.6, -0.6], [0.4, 0.7], [-0.3, -0.7], [1, -0.8], [-1.1, 0.1], [0.9, 0.1],
];

const BAR_X = -1.15;
const BAR_MAX = 2.3;
const barW = (size: number) => (Math.max(size, 0) / 12) * BAR_MAX;

/**
 * An order book: a board with sell offers on top, buy offers below and a gap
 * between them. A market buy eats the asks from the best price upward.
 */
function OrderBook({ asks, fill, labels, lang }: { asks: Ask[]; fill: BookFill; labels: L; lang: Lang }) {
  const bids = asks.length === 0 ? [] : asks.length < 4 ? [0.5, 0.9] : [2.1, 1.6, 1.15, 0.75];
  const empty = asks.length === 0;
  const done = fill.unfilled <= 1e-9;
  return (
    <group>
      <Platform size={[4.8, 4.8]} position={[0, 0, 0]} color="ground" height={0.2} />
      {/* Turned to face the camera. */}
      <group rotation={[0, Math.PI / 4, 0]}>
        <Box size={[2.8, 3.5, 0.14]} position={[0, 1.85, -0.9]} color="platform" radius={0.06} />
        {/* Asks: the best (lowest) price sits just above the gap. */}
        {asks.map((a, i) => {
          const w = barW(a.size);
          const taken = barW(fill.fills[i] ?? 0);
          const y = 2.3 + i * 0.34;
          return (
            <group key={`a${i}`}>
              {w - taken > 0.01 && <Box size={[w - taken, 0.24, 0.08]} position={[BAR_X + taken + (w - taken) / 2, y, -0.8]} color="invalid" radius={0.04} />}
              {taken > 0.01 && <Box size={[taken, 0.24, 0.1]} position={[BAR_X + taken / 2, y, -0.79]} color="tx" glow radius={0.04} />}
            </group>
          );
        })}
        {bids.map((w, i) => (
          <Box key={`b${i}`} size={[w, 0.24, 0.08]} position={[BAR_X + w / 2, 1.42 - i * 0.34, -0.8]} color="valid" radius={0.04} />
        ))}
        {/* The buyer, holding USDC and wanting ETH. */}
        <group position={[1.75, 0, 1.1]}>
          <Person color="actor" glow={!done} />
          <group position={[0, 1.55, 0]}>
            <Bob>
              <Token color={done && fill.filled > 0 ? 'tokenA' : 'tokenB'} radius={0.28} />
            </Bob>
          </group>
        </group>
        <Anim show={!empty} position={[-1.75, 0, 1.1]}>
          <Person color="actor" />
          <group position={[0, 1.55, 0]}>
            <Bob phase={2}>
              <Token color="tokenA" radius={0.28} />
            </Bob>
          </group>
        </Anim>
        <Label position={[0, 4.15, -0.9]}>{labels.orderBook}</Label>
        <Label position={[0, -0.35, 2.5]} tone={empty ? 'invalid' : done ? 'valid' : 'invalid'}>
          {empty ? labels.noSellers : !done ? `${fmt(fill.unfilled, 0, lang)} ETH ${labels.unfilled}` : `${labels.bookAvg} ${fill.filled > 0 ? fmt(fill.avg, 0, lang) : '—'}`}
        </Label>
        <Label position={[2.1, 3, -0.8]} minLevel="intermediate" tone="invalid" show={!empty}>
          {labels.asks}
          {fill.worst > 0 ? ` ≤ ${fmt(fill.worst, 0, lang)}` : ''}
        </Label>
        <Label position={[-2.05, 1.2, -0.8]} minLevel="intermediate" tone="valid" show={!empty}>
          {labels.bids}
        </Label>
        <Label position={[0, 1.85, -0.8]} minLevel="expert" tone="mono" show={!empty}>
          spread
        </Label>
      </group>
    </group>
  );
}

/** The board behind the pool: the x · y = k curve with the pool's current position on it. */
function CurvePanel({ x, y, labels, lang }: { x: number; y: number; labels: L; lang: Lang }) {
  const { compact } = useScene();
  const p = toPanel(x, y, 0.14);
  const price = x > 0 ? y / x : 0;
  const down = useMemo<Vec3[]>(() => [[p[0], AX.y0, 0.1], [p[0], p[1], 0.1]], [p[0], p[1]]);
  const across = useMemo<Vec3[]>(() => [[AX.x0, p[1], 0.1], [p[0], p[1], 0.1]], [p[0], p[1]]);
  return (
    <group position={PANEL} rotation={[0, Math.PI / 4, 0]}>
      <Box size={[0.16, 1.1, 0.16]} position={[-1.9, 0.55, 0]} color="neutral" radius={0.04} />
      <Box size={[0.16, 1.1, 0.16]} position={[1.9, 0.55, 0]} color="neutral" radius={0.04} />
      <Box size={[4.7, 3.2, 0.14]} position={[0, 2.5, 0]} color="platform" radius={0.08} />
      <FlowLine points={[[AX.x0, AX.y0, 0.1], [AX.x0 + AX.w + 0.1, AX.y0, 0.1]]} color="chain" width={2} />
      <FlowLine points={[[AX.x0, AX.y0, 0.1], [AX.x0, AX.y0 + AX.h + 0.1, 0.1]]} color="chain" width={2} />
      <FlowLine points={CURVE} color="ink" arrow={false} width={3.5} />
      <FlowLine points={down} color="tokenA" arrow={false} dashed width={2} />
      <FlowLine points={across} color="tokenB" arrow={false} dashed width={2} />
      <Ball radius={0.08} position={START} color="chain" />
      <Anim position={p} speed={12}>
        <Ball radius={0.14} color="tx" glow />
        <Label position={[0.95, 0.3, 0]} minLevel="intermediate" tone="tx">
          {compact ? fmt(price, 0, lang) : `1 ETH = ${fmt(price, 0, lang)} USDC`}
        </Label>
      </Anim>
      <Label position={[1.35, 3.6, 0.1]} maxLevel="beginner" tone="plain">
        {labels.curve}
      </Label>
      <Label position={[1.35, 3.6, 0.1]} minLevel="expert" tone="mono">
        x · y = k
      </Label>
      <Label position={[1.8, 0.98, 0.1]} minLevel="intermediate" maxLevel="intermediate" tone="tokenA">
        ETH
      </Label>
      <Label position={[-1.75, 3.95, 0.1]} minLevel="intermediate" maxLevel="intermediate" tone="tokenB">
        USDC
      </Label>
      <Label position={[1.8, 0.98, 0.1]} minLevel="expert" tone="mono">
        x: ETH
      </Label>
      <Label position={[-1.75, 3.95, 0.1]} minLevel="expert" tone="mono">
        y: USDC
      </Label>
    </group>
  );
}

/** Two columns: what the deposit would be worth just held, and what it is worth in the pool. */
function ValueBars({ m, labels, lang }: { m: PriceMove; labels: L; lang: Lang }) {
  const hold = 0.45 * (1 + m.r);
  const inPool = hold * (1 + m.il);
  const gap = Math.max(hold - inPool, 0.02);
  return (
    <group>
      <Platform size={[2.8, 1.7]} position={[0, 0.12, 0]} color="ground" height={0.12} />
      <Anim position={[-0.65, 0.12, 0]} scale={[1, hold, 1]} speed={10}>
        <Box size={[0.8, 1, 0.8]} position={[0, 0.5, 0]} color="neutral" radius={0.03} />
      </Anim>
      <Anim position={[0.65, 0.12, 0]} scale={[1, inPool, 1]} speed={10}>
        <Box size={[0.8, 1, 0.8]} position={[0, 0.5, 0]} color="actor" radius={0.03} />
      </Anim>
      {/* The missing slice on top of the pool column: the loss. */}
      <Anim position={[0.65, 0.12 + inPool, 0]} scale={[1, gap, 1]} speed={10}>
        <Box size={[0.8, 1, 0.8]} position={[0, 0.5, 0]} color="invalid" glow opacity={0.75} radius={0.01} />
      </Anim>
      <Anim position={[-1, hold + 0.65, 0]} speed={10}>
        <Label tone="plain">
          {labels.hold} {fmt(m.hold, 0, lang)}
        </Label>
      </Anim>
      <Anim position={[1.1, hold + 0.6, 0]} speed={10}>
        <Label tone="actor">
          {labels.inPool} {fmt(m.inPool, 0, lang)}
        </Label>
      </Anim>
      <Label position={[0.3, -0.45, 1.3]} maxLevel="intermediate" tone={m.il < -0.0005 ? 'invalid' : 'default'}>
        {labels.il} {pct(m.il, 1, lang)}
      </Label>
      <Label position={[0.3, -0.45, 1.3]} minLevel="expert" tone="mono">
        2·√r/(1+r) − 1 = {pct(m.il, 2, lang)}
      </Label>
    </group>
  );
}

/**
 * The quote, what the swap would actually pay, and the minimum the transaction
 * accepts. The differences are fractions of a percent, so the vertical scale
 * zooms in: whichever of the two is further below the quote sits at height 1.
 */
function SlipBars({ s, tol, labels, lang }: { s: Slippage; tol: number; labels: L; lang: Lang }) {
  const { atLeast } = useLevel();
  const span = Math.max(tol, s.shortfall, 0.0005);
  const h = (dev: number) => 2.2 - (Math.max(dev, 0) / span) * 1.2;
  const got = h(s.shortfall);
  const min = h(tol);
  return (
    <group>
      <Platform size={[2.8, 1.7]} position={[0, 0.12, 0]} color="ground" height={0.12} />
      <Box size={[0.8, 2.2, 0.8]} position={[-0.65, 0.12 + 1.1, 0]} color="neutral" radius={0.03} />
      <Anim position={[0.65, 0.12, 0]} scale={[1, got, 1]} speed={10}>
        <Box size={[0.8, 1, 0.8]} position={[0, 0.5, 0]} color={s.reverts ? 'invalid' : 'valid'} glow={s.reverts} radius={0.03} />
      </Anim>
      {/* The minimum the transaction accepts: a column that ends below this plate reverts. */}
      <Anim position={[0.65, 0.12 + min, 0]} speed={10}>
        <Box size={[1.15, 0.05, 1.15]} color="ink" radius={0.02} />
        <Label position={[1.2, 0, 0]} tone="mono">
          {atLeast('expert') ? 'amountOutMin' : labels.minLine} {fmt(s.minOut, 0, lang)}
        </Label>
      </Anim>
      <Label position={[-1, 2.95, 0]} tone="plain">
        {labels.quoted} {fmt(s.quoted, 0, lang)}
      </Label>
      <Label position={[0.3, -0.45, 1.3]} tone={s.reverts ? 'invalid' : 'valid'}>
        {s.reverts ? labels.reverts : `${labels.youGet} ${fmt(s.executed, 0, lang)}`}
      </Label>
    </group>
  );
}

export default function Scene({ stepId, labels, lang }: SceneProps) {
  const st = useV2();
  const nums = useLevel().atLeast('intermediate');
  const { compact } = useScene();

  const orderbook = stepId === 'orderbook';
  const pool = stepId === 'pool';
  const curve = stepId === 'curve';
  const swap = stepId === 'swap';
  const fees = stepId === 'fees';
  const risks = stepId === 'risks';
  const slipMode = risks && st.riskMode === 'slippage';
  const ilMode = risks && st.riskMode === 'il';

  const q = useMemo(() => quoteSwap(st.dir, st.units), [st.dir, st.units]);
  const arb = useMemo(() => arbitrage(q.x, q.y, P0), [q]);
  const arbOn = swap && st.arb;
  const asks = BOOKS[st.depth];
  const fill = useMemo(() => marketBuy(asks, st.buy), [asks, st.buy]);
  const fromPool = useMemo(() => poolBuy(st.buy), [st.buy]);
  const dep = useMemo(() => addLiquidity(st.depEth, st.unbalanced ? st.depUsdc : matching(st.depEth)), [st.depEth, st.depUsdc, st.unbalanced]);
  const vol = useMemo(() => simulateTrades(st.trades), [st.trades]);
  const slip = useMemo(() => slippage(st.tol, st.move), [st.tol, st.move]);
  const move = useMemo(() => priceMove(ratioOf(st.ilSlider)), [st.ilSlider]);

  // Reserves the basin shows on this step.
  let rx = X0;
  let ry = Y0;
  if (orderbook) [rx, ry] = [fromPool.x, fromPool.y];
  else if (pool && !st.removed) [rx, ry] = [dep.x, dep.y];
  else if (curve) [rx, ry] = [q.x, q.y];
  else if (swap) [rx, ry] = arbOn ? [arb.x, arb.y] : [q.x, q.y];
  else if (fees) [rx, ry] = [vol.x, vol.y];
  else if (slipMode) [rx, ry] = [slip.x, slip.y];
  else if (ilMode) [rx, ry] = [move.x, move.y];

  const sellsEth = st.dir === 'eth';
  const coins = Math.min(COIN_SPOTS.length, Math.round(vol.fees / 500));
  const myCoins = Math.min(12, Math.round(vol.income / 45));
  const inTok = sellsEth ? 'tokenA' : 'tokenB';
  const outTok = sellsEth ? 'tokenB' : 'tokenA';
  const sym = (d: Dir) => (d === 'eth' ? 'ETH' : 'USDC');
  const other = (d: Dir): Dir => (d === 'eth' ? 'usdc' : 'eth');
  const digits = (d: Dir) => (d === 'eth' ? 2 : 0);

  // On a phone the control panel covers the lower part of the canvas: raise and shrink the model to clear it.
  // A short canvas (small phone) leaves even less room above the panel, so the model shrinks a little more.
  const squat = useThree((s) => s.size.height < s.size.width * 0.8) ? 0.85 : 1;
  const lift = !compact ? 0 : (orderbook ? 2.9 : pool ? 2.1 : fees ? 2 : risks ? 2.5 : 1.2) * squat;
  const fit = !compact ? 1 : (orderbook || risks ? 0.82 : 0.88) * squat;
  // On a phone the two columns of the risk step move up-screen, out from under the panel.
  const BARS: Vec3 = compact ? [4.9, 0, -3.5] : [6.2, 0, -2.2];

  return (
    <Anim position={[0, lift, 0]} scale={fit}>
      <ShadowGround />

      {/* The pool is in every step; its two levels are the reserves. */}
      <Platform size={[6.4, 4.4]} position={[0, 0, 0]} color="ground" height={0.2} />
      <Pool a={(LEVEL * rx) / X0} b={(LEVEL * ry) / Y0} />
      <Label position={[-2.6, 2.1, 0.9]} tone="tokenA" show={!orderbook}>
        ETH
        {nums && ` ${fmt(rx, rx % 1 === 0 ? 0 : 1, lang)}`}
      </Label>
      <Label position={[2.9, 1.9, 0.5]} tone="tokenB" show={!orderbook}>
        USDC
        {nums && ` ${fmt(ry, 0, lang)}`}
      </Label>

      {/* Step 1: a market buy walks the order book; the pool beside it always quotes. */}
      <Anim show={orderbook} position={OB}>
        <OrderBook asks={asks} fill={fill} labels={labels} lang={lang} />
      </Anim>
      <Anim show={orderbook}>
        <Label position={[0.6, 2.5, -0.6]} tone="valid">
          {labels.poolReady}
        </Label>
        <Label position={[3.1, 1.7, 0.5]} tone="tokenB">
          {labels.poolAvg} {fmt(fromPool.avg, 0, lang)}
        </Label>
        <Label position={[3.3, 2.3, -1.6]} minLevel="expert" tone="mono">
          getAmountIn()
        </Label>
        <Leg path={PATHS.frontInB} cycle={4} from={0} to={1.6}>
          <Token color="tokenB" radius={0.3} />
        </Leg>
        <Leg path={PATHS.frontOutA} cycle={4} from={1.9} to={3.5}>
          <Token color="tokenA" radius={0.3} />
        </Leg>
      </Anim>

      {/* The trader: one token in, the other out. */}
      <Anim show={orderbook || swap || fees} position={swap ? TRADER_SIDE : TRADER}>
        <Person color="actor" />
        <Label position={[0, -0.4, 0.7]} show={fees} tone="actor">
          {labels.trader}
        </Label>
        <Label position={[0, -0.4, 0.7]} show={swap} maxLevel="beginner" tone="actor">
          {labels.trader}
        </Label>
      </Anim>
      <Anim show={fees}>
        <Leg path={PATHS.frontIn} cycle={4} from={0} to={1.6}>
          <Token color="tokenA" radius={0.3} />
        </Leg>
        <Leg path={PATHS.frontOutB} cycle={4} from={1.9} to={3.5}>
          <Token color="tokenB" radius={0.3} />
        </Leg>
      </Anim>
      <Anim show={swap && !arbOn && q.amountIn > 0}>
        <Leg path={sellsEth ? PATHS.sideInA : PATHS.sideInB} cycle={4} from={0} to={1.6}>
          <Token color={inTok} radius={0.3} />
        </Leg>
        <Leg path={sellsEth ? PATHS.sideOutB : PATHS.sideOutA} cycle={4} from={1.9} to={3.5}>
          <Token color={outTok} radius={0.3} />
        </Leg>
      </Anim>
      <Anim show={swap}>
        <Label position={[-3.6, 1.9, 3]} minLevel="intermediate" tone={inTok}>
          {labels.in} {fmt(q.amountIn, 0, lang)} {sym(st.dir)}
        </Label>
        <Label position={[-3.4, -0.45, 3.7]} minLevel="intermediate" tone={outTok}>
          {labels.out} {fmt(q.out, digits(other(st.dir)), lang)} {sym(other(st.dir))}
        </Label>
        <Label position={[3.4, 2.6, -1.6]} minLevel="expert" tone="mono" show={!arbOn}>
          getAmountOut()
        </Label>
      </Anim>

      {/* Step 4, after the swap: an arbitrageur trades the pool back toward the market price. */}
      <Anim show={arbOn} position={ARB}>
        <Person color="chain" glow={arb.dir !== null} />
        <Label position={[0, 1.9, 0]} tone={arb.dir ? 'valid' : 'plain'}>
          {arb.dir ? `${labels.arbitrageur} +${fmt(arb.profit, 0, lang)} USDC` : `${labels.arbitrageur}: ${labels.arbNone}`}
        </Label>
      </Anim>
      <Anim show={arbOn && arb.dir !== null}>
        <Leg path={arb.dir === 'eth' ? PATHS.arbInA : PATHS.arbInB} cycle={4} from={0} to={1.6}>
          <Token color={arb.dir === 'eth' ? 'tokenA' : 'tokenB'} radius={0.3} />
        </Leg>
        <Leg path={arb.dir === 'eth' ? PATHS.arbOutB : PATHS.arbOutA} cycle={4} from={1.9} to={3.5}>
          <Token color={arb.dir === 'eth' ? 'tokenB' : 'tokenA'} radius={0.3} />
        </Leg>
      </Anim>

      {/* Steps 2 and 5: liquidity providers. The one on the left is the learner. */}
      {[LP1, LP2].map((p, i) => (
        <Anim key={i} show={pool || fees} position={p} speed={5 + i}>
          <Person color={i === 0 ? 'actor' : 'chain'} glow={i === 0} />
          <Anim show={i === 0 ? fees || (!st.removed && dep.minted > 0) : fees} position={[0, 1.6, 0]} scale={i === 0 && pool ? 0.7 + dep.share * 2.2 : 1}>
            <Bob phase={i * 2}>
              <Token color="valid" radius={0.3} />
            </Bob>
          </Anim>
        </Anim>
      ))}
      <Label position={[LP2[0] + 0.2, -0.45, LP2[2] + 0.7]} show={pool || fees} tone="plain">
        {labels.others}
      </Label>
      <Anim show={pool}>
        <Label position={[LP1[0], 2.9, LP1[2]]} tone={st.removed ? 'actor' : 'valid'}>
          {st.removed
            ? `${labels.back} ${fmt(dep.backEth, 1, lang)} ETH + ${fmt(dep.backUsdc, 0, lang)} USDC`
            : nums
              ? `${labels.you}: ${fmt(dep.minted, 0, lang)} LP · ${pct(dep.share, 1, lang)}`
              : `${labels.you}: ${pct(dep.share, 1, lang)}`}
        </Label>
        <Label position={[LP1[0], -0.45, LP1[2] + 0.7]} tone="actor" maxLevel="beginner">
          {labels.lp}
        </Label>
        <Anim show={!st.removed && dep.eth > 0}>
          <Leg path={PATHS.lp1A} cycle={4} from={0} to={1.5} arc={1}>
            <Token color="tokenA" radius={0.3} />
          </Leg>
        </Anim>
        <Anim show={!st.removed && dep.usdc > 0}>
          <Leg path={PATHS.lp1B} cycle={4} from={0.3} to={1.9} arc={1.7}>
            <Token color="tokenB" radius={0.3} />
          </Leg>
        </Anim>
        <Anim show={st.removed && dep.minted > 0}>
          <Leg path={PATHS.lp1BackA} cycle={4} from={0} to={1.5} arc={1}>
            <Token color="tokenA" radius={0.3} />
          </Leg>
          <Leg path={PATHS.lp1BackB} cycle={4} from={0.3} to={1.9} arc={1.7}>
            <Token color="tokenB" radius={0.3} />
          </Leg>
        </Anim>
        <Label position={[0.9, 3.5, -0.9]} minLevel="intermediate" tone={dep.limiting ? 'invalid' : 'plain'}>
          {dep.limiting ? `${labels.counted}: ${sym(dep.limiting)}` : labels.bothTokens}
        </Label>
        <Label position={[0.4, -0.5, 2.6]} minLevel="expert" tone="mono">
          min(dx/x, dy/y) · totalSupply
        </Label>
      </Anim>

      {/* Step 5: a slice of every swap stays behind in the pool, and each share is worth more. */}
      <Anim show={fees}>
        <Leg path={PATHS.frontIn} cycle={4} from={0.25} to={1.85} arc={0.8}>
          <group position={[0, 0.2, 0]}>
            <FeeCoin />
          </group>
        </Leg>
        {COIN_SPOTS.map(([x, z], i) => (
          <Anim key={i} show={i < coins} position={[x, 1.25, z]}>
            <Bob amount={0.03} phase={i}>
              <FeeCoin />
            </Bob>
          </Anim>
        ))}
        {/* The learner's cut of the fees, stacked beside them. */}
        <group position={[LP1[0] - 0.9, 0, LP1[2] + 0.5]}>
          {Array.from({ length: 12 }, (_, i) => (
            <Anim key={i} show={i < myCoins} position={[0, 0.06 + i * 0.11, 0]}>
              <FeeCoin />
            </Anim>
          ))}
        </group>
        <Label position={[LP1[0], 2.75, LP1[2]]} tone="valid">
          {labels.you}: {nums ? `${fmt(vol.value, 0, lang)} USDC` : labels.lpToken}
        </Label>
        <Label position={[LP1[0] - 0.9, -0.45, LP1[2] + 1.3]} tone="tx">
          +{fmt(vol.income, 0, lang)} USDC
        </Label>
        <Label position={[0.2, 3, -0.8]} tone="tx">
          {nums ? `k +${fmt(vol.kGrowth * 100, 2, lang)}%` : labels.fee}
        </Label>
        <Label position={[0.6, -0.9, 2.2]} minLevel="expert" tone="mono">
          √k / totalSupply +{fmt(vol.shareGrowth * 100, 3, lang)}%
        </Label>
      </Anim>

      {/* Steps 3, 4, 6: the curve and the pool's position on it. */}
      <Anim show={curve || swap || risks}>
        <CurvePanel x={rx} y={ry} labels={labels} lang={lang} />
      </Anim>

      {/* Step 6: either the slippage check or holding versus providing liquidity. */}
      <Anim show={slipMode} position={BARS}>
        <SlipBars s={slip} tol={st.tol} labels={labels} lang={lang} />
      </Anim>
      <Anim show={ilMode} position={BARS}>
        <ValueBars m={move} labels={labels} lang={lang} />
      </Anim>
      <Label position={[1.2, -0.5, 2.6]} show={ilMode && !compact} minLevel="intermediate" tone="plain">
        {labels.volNeeded} ≈ {fmt(move.volumeToOffset, 0, lang)} USDC
      </Label>
      <Label position={[1.2, -0.5, 2.6]} show={slipMode && !compact} minLevel="intermediate" tone="plain">
        {labels.in} {fmt(SLIP_TRADE, 0, lang)} ETH
      </Label>
    </Anim>
  );
}

/* ---------- Controls ---------- */

const ROW = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 12px', flexBasis: '100%' } as const;

/** One figure in the control panel: name and value on one line, so the panel stays low on a phone. */
function Stat({ name, tone, children }: { name: string; tone?: 'good' | 'bad'; children: ReactNode }) {
  return (
    <div className="ctl-stat" style={{ display: 'flex', alignItems: 'baseline', gap: 6, whiteSpace: 'nowrap' }}>
      <span>{name}</span>
      <strong style={{ fontSize: isSmall() ? '0.76rem' : '0.84rem' }} data-tone={tone}>
        {children}
      </strong>
    </div>
  );
}

const Stats = ({ children }: { children: ReactNode }) => (
  <div className="ctl-stats" style={{ gap: '2px 14px', flexBasis: '100%' }}>
    {children}
  </div>
);

/** A slider with its label and current value on one line. */
function Slider({ id, label, value, min, max, step, onChange, shown, wide = false, stack = false }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; shown: string; wide?: boolean; stack?: boolean }) {
  return (
    <label className="ctl-field" style={stack ? { flex: '1 1 130px', minWidth: 0, gap: 0 } : { display: 'flex', alignItems: 'center', gap: 8, flex: wide ? '1 1 100%' : '1 1 150px', minWidth: 0 }}>
      <span style={{ whiteSpace: 'nowrap' }}>
        {label}: {shown}
      </span>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} style={{ flex: 1, minWidth: 60 }} />
    </label>
  );
}

/** True on a phone, where the panel has to stay as low as possible. */
const isSmall = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;
/** Narrower buttons for a phone. */
const TIGHT = { padding: '0 9px', fontSize: '0.82rem', minHeight: 32 } as const;

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)} style={isSmall() ? { padding: '0 6px', fontSize: '0.78rem', minHeight: 30 } : { padding: '0 8px' }}>
          {text}
        </button>
      ))}
    </div>
  );
}


export function Controls({ stepId, labels, lang }: SceneProps) {
  const st = useV2();
  const small = isSmall();
  const box = { gap: '4px 12px', maxWidth: 580 } as const;

  if (stepId === 'orderbook') {
    const fill = marketBuy(BOOKS[st.depth], st.buy);
    const fromPool = poolBuy(st.buy);
    return (
      <div className="ctl" style={box}>
        {!small && <div className="ctl-title">{labels.tryBook}</div>}
        <div style={ROW}>
          <Seg label={labels.orderBook} value={st.depth} options={DEPTHS.map((d) => [d, labels[`depth_${d}`]])} onChange={st.setDepth} />
          <Slider id="book-buy" label={labels.buyEth} value={st.buy} min={0} max={MAX_BUY} step={1} onChange={st.setBuy} shown={`${fmt(st.buy, 0, lang)} ETH`} />
        </div>
        <Stats>
          <Stat name={labels.filled} tone={fill.unfilled > 0 ? 'bad' : 'good'}>
            {fmt(fill.filled, 0, lang)} / {fmt(st.buy, 0, lang)} ETH
          </Stat>
          <Stat name={labels.bookAvg}>{fill.filled > 0 ? `${fmt(fill.avg, 0, lang)} USDC` : '—'}</Stat>
          <Stat name={labels.poolAvg}>{fmt(fromPool.avg, 0, lang)} USDC</Stat>
        </Stats>
      </div>
    );
  }

  if (stepId === 'pool') {
    const usdc = st.unbalanced ? st.depUsdc : matching(st.depEth);
    const dep = addLiquidity(st.depEth, usdc);
    return (
      <div className="ctl" style={box}>
        {!small && <div className="ctl-title">{labels.tryPool}</div>}
        <div style={ROW}>
          <Slider id="dep-eth" label={labels.deposit} value={st.depEth} min={0} max={MAX_DEPOSIT_ETH} step={1} onChange={st.setDepEth} shown={`${fmt(st.depEth, 0, lang)} ETH`} />
          {st.unbalanced ? (
            <Slider id="dep-usdc" label="USDC" value={st.depUsdc} min={0} max={MAX_DEPOSIT_USDC} step={1000} onChange={st.setDepUsdc} shown={fmt(st.depUsdc, 0, lang)} />
          ) : (
            <span className="ctl-stat" style={{ whiteSpace: 'nowrap' }}>
              <strong>+ {fmt(usdc, 0, lang)} USDC</strong>
            </span>
          )}
        </div>
        <div style={ROW}>
          <label className="ctl-check">
            <input type="checkbox" checked={st.unbalanced} onChange={(e) => st.setUnbalanced(e.target.checked)} />
            {labels.unbalanced}
          </label>
          <button type="button" style={small ? TIGHT : undefined} className="btn" onClick={() => st.setRemoved(!st.removed)} disabled={dep.minted <= 0}>
            {st.removed ? labels.addBack : labels.remove}
          </button>
        </div>
        <Stats>
          {!small && <Stat name={labels.lpTokens}>{fmt(st.removed ? 0 : dep.minted, 1, lang)}</Stat>}
          {!small && <Stat name={labels.share}>{pct(st.removed ? 0 : dep.share, 2, lang)}</Stat>}
          <Stat name={labels.back} tone={dep.limiting ? 'bad' : undefined}>
            {fmt(dep.backEth, 2, lang)} ETH + {fmt(dep.backUsdc, 0, lang)} USDC
          </Stat>
          {dep.limiting && (
            <Stat name={labels.gift} tone="bad">
              {fmt(dep.gift, 0, lang)} USDC
            </Stat>
          )}
        </Stats>
      </div>
    );
  }

  if (stepId === 'curve' || stepId === 'swap') {
    const q = quoteSwap(st.dir, st.units);
    const a = arbitrage(q.x, q.y, P0);
    const arbOn = stepId === 'swap' && st.arb;
    const outSym = st.dir === 'eth' ? 'USDC' : 'ETH';
    return (
      <div className="ctl" style={box}>
        <div style={ROW}>
          <Seg
            label={labels.sell}
            value={st.dir}
            options={[
              ['eth', 'ETH → USDC'],
              ['usdc', 'USDC → ETH'],
            ]}
            onChange={st.setDir}
          />
          {stepId === 'swap' && (
            <button type="button" style={small ? TIGHT : undefined} className="btn" onClick={() => st.setArb(!st.arb)} disabled={q.amountIn <= 0}>
              {st.arb ? labels.arbUndo : labels.arbRun}
            </button>
          )}
        </div>
        <Slider id="swap-amount" label={labels.sell} value={st.units} min={0} max={MAX_UNITS} step={1} onChange={st.setUnits} shown={`${fmt(q.amountIn, 0, lang)} ${st.dir === 'eth' ? 'ETH' : 'USDC'}`} wide />
        <Stats>
          <Stat name={labels.youGet}>
            {fmt(q.out, st.dir === 'eth' ? 0 : 2, lang)} {outSym}
          </Stat>
          <Stat name={labels.price}>
            {fmt(q.priceBefore, 0, lang)} → {fmt(q.priceAfter, 0, lang)}
            {arbOn && ` → ${fmt(a.price, 0, lang)}`}
          </Stat>
          {!(small && stepId === 'curve') && <Stat name={labels.impact}>{pct(q.impact, 2, lang)}</Stat>}
          {arbOn && (
            <Stat name={labels.arbProfit} tone={a.dir ? 'good' : undefined}>
              {fmt(a.profit, 0, lang)} USDC
            </Stat>
          )}
        </Stats>
      </div>
    );
  }

  if (stepId === 'fees') {
    const v = simulateTrades(st.trades);
    return (
      <div className="ctl" style={box}>
        {!small && <div className="ctl-title">{labels.tryFees}</div>}
        <div style={ROW}>
          <Slider id="fee-trades" label={labels.trades} value={st.trades} min={0} max={MAX_TRADES} step={2} onChange={st.setTrades} shown={fmt(v.trades, 0, lang)} />
          <button type="button" style={small ? TIGHT : undefined} className="btn" onClick={() => st.setTrades(st.trades >= MAX_TRADES ? 0 : st.trades + 20)}>
            {st.trades >= MAX_TRADES ? labels.resetTrades : labels.moreTrades}
          </button>
        </div>
        <Stats>
          <Stat name={labels.volume}>{fmt(v.volume, 0, lang)} USDC</Stat>
          <Stat name="k">+{fmt(v.kGrowth * 100, 2, lang)}%</Stat>
          <Stat name={`${labels.share} (${pct(FEE_POOL.share, 1, lang)})`}>{fmt(v.value, 0, lang)} USDC</Stat>
          <Stat name={labels.income} tone={v.income > 0 ? 'good' : undefined}>
            +{fmt(v.income, 0, lang)} USDC
          </Stat>
        </Stats>
      </div>
    );
  }

  if (stepId === 'risks') {
    const s = slippage(st.tol, st.move);
    const m = priceMove(ratioOf(st.ilSlider));
    return (
      <div className="ctl" style={box}>
        <div style={ROW}>
          <Seg
            label={labels.il}
            value={st.riskMode}
            options={[
              ['slippage', labels.modeSlip],
              ['il', labels.modeIl],
            ]}
            onChange={st.setRiskMode}
          />
        </div>
        {st.riskMode === 'slippage' ? (
          <>
            <div style={ROW}>
              <Slider id="slip-tol" label={labels.tolerance} value={Math.round(st.tol * 1000)} min={TOL_MIN * 1000} max={TOL_MAX * 1000} step={1} onChange={(v) => st.setTol(v / 1000)} shown={pct(st.tol, 1, lang)} stack={small} />
              <Slider id="slip-move" label={labels.priceMoved} value={Math.round(st.move * 1000)} min={0} max={MOVE_MAX * 1000} step={1} onChange={(v) => st.setMove(v / 1000)} shown={pct(-st.move, 1, lang)} stack={small} />
            </div>
            <Stats>
              {!small && <Stat name={labels.minOut}>{fmt(s.minOut, 0, lang)} USDC</Stat>}
              <Stat name={labels.wouldGet}>{fmt(s.executed, 0, lang)} USDC</Stat>
              <Stat name={labels.result} tone={s.reverts ? 'bad' : 'good'}>
                {s.reverts ? labels.reverts : labels.goesThrough}
              </Stat>
            </Stats>
          </>
        ) : (
          <>
            <Slider id="il-price" label={labels.ilPrice} value={st.ilSlider} min={-100} max={100} step={1} onChange={st.setIlSlider} shown={`${fmt(m.price, 0, lang)} USDC (${fmt(m.r, 2, lang)}×)`} wide />
            <Stats>
              <Stat name={labels.hold}>{fmt(m.hold, 0, lang)}</Stat>
              <Stat name={labels.inPool}>{fmt(m.inPool, 0, lang)}</Stat>
              <Stat name={labels.il} tone={m.il < -0.0005 ? 'bad' : undefined}>
                {pct(m.il, 2, lang)}
              </Stat>
              <Stat name={labels.breakEven}>{fmt(m.loss, 0, lang)} USDC</Stat>
            </Stats>
          </>
        )}
      </div>
    );
  }

  return null;
}
