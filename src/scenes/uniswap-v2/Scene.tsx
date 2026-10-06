import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Vector3, type Group } from 'three';
import { Anim, Ball, Box, Cyl, FlowLine, Label, Person, Platform, PoolBasin, ShadowGround, Token, useLevel, useLoop, useScene, type Vec3 } from '../../scene/kit';
import type { SceneProps } from '../../scene/types';
import type { Lang } from '../../types';
import { MAX_IN, quote, TOLERANCE, useSwap, X0, Y0, type Quote } from './state';

const OB: Vec3 = [-6, 0, 0];
const LP1: Vec3 = [-4.3, 0, 0.9];
const LP2: Vec3 = [4.4, 0, 0.2];
const TRADER: Vec3 = [0, 0, 3.7];
/** On the swap step the trader stands beside the pool, clear of the controls. */
const TRADER_SIDE: Vec3 = [-3.6, 0, 3];
/** Fill height of each side of the basin when the pool holds X0 and Y0. */
const LEVEL = 0.75;

// The chart on the board behind the pool: reserves in, board coordinates out.
// The board stands behind the pool and is turned to face the camera.
const PANEL: Vec3 = [-2.5, 0, -2.5];
const AX = { x0: -1.9, y0: 1.25, w: 3.7, h: 2.4, maxX: 260, maxY: 280_000 };
const toPanel = (x: number, y: number, z = 0.1): Vec3 => [AX.x0 + (x / AX.maxX) * AX.w, AX.y0 + (y / AX.maxY) * AX.h, z];
const CURVE: Vec3[] = Array.from({ length: 40 }, (_, i) => {
  const x = 80 + (170 * i) / 39;
  return toPanel(x, (X0 * Y0) / x);
});
const START = toPanel(X0, Y0, 0.12);

const PATHS = {
  sellA: [[0, 1.2, 3.5], [-1, 1.5, 0.2]] as Vec3[],
  buyB: [[1, 1.5, 0.2], [0.3, 1.2, 3.5]] as Vec3[],
  sideSellA: [[-3.4, 1.2, 2.8], [-1, 1.5, 0.2]] as Vec3[],
  sideBuyB: [[1, 1.5, 0.2], [-3.4, 1.2, 3]] as Vec3[],
  lp1A: [[LP1[0], 1.4, LP1[2]], [-1, 1.5, 0]] as Vec3[],
  lp1B: [[LP1[0], 1.4, LP1[2]], [1, 1.5, 0]] as Vec3[],
  lp2A: [[LP2[0], 1.4, LP2[2]], [-1, 1.5, 0]] as Vec3[],
  lp2B: [[LP2[0], 1.4, LP2[2]], [1, 1.5, 0]] as Vec3[],
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
  return `${shown < 0 ? '−' : ''}${fmt(Math.abs(shown), digits, lang)}%`;
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

/** An order book: a board with sell offers on top, buy offers below and a gap between them. */
function OrderBook({ labels }: { labels: Record<string, string> }) {
  const asks = [2.1, 1.6, 1.15, 0.75];
  return (
    <group>
      <Platform size={[4.8, 4.8]} position={[0, 0, 0]} color="ground" height={0.2} />
      {/* Turned to face the camera. */}
      <group rotation={[0, Math.PI / 4, 0]}>
        <Box size={[2.8, 3.5, 0.14]} position={[0, 1.85, -0.9]} color="platform" radius={0.06} />
        {asks.map((w, i) => (
          <Box key={`a${i}`} size={[w, 0.24, 0.08]} position={[0, 3.3 - i * 0.34, -0.8]} color="invalid" radius={0.04} />
        ))}
        {asks.map((w, i) => (
          <Box key={`b${i}`} size={[w, 0.24, 0.08]} position={[0, 0.4 + i * 0.34, -0.8]} color="valid" radius={0.04} />
        ))}
        <group position={[1.75, 0, 1.1]}>
          <Person color="actor" />
          <group position={[0, 1.55, 0]}>
            <Bob>
              <Token color="tokenA" radius={0.28} />
            </Bob>
          </group>
        </group>
        <group position={[-1.75, 0, 1.1]}>
          <Person color="actor" />
          <group position={[0, 1.55, 0]}>
            <Bob phase={2}>
              <Token color="tokenB" radius={0.28} />
            </Bob>
          </group>
        </group>
        <Label position={[0, 4.15, -0.9]}>{labels.orderBook}</Label>
        <Label position={[0, -0.35, 2.5]} tone="plain">
          {labels.waiting}
        </Label>
        <Label position={[2.1, 3, -0.8]} minLevel="intermediate" tone="invalid">
          {labels.asks}
        </Label>
        <Label position={[-2.05, 1.5, -0.8]} minLevel="intermediate" tone="valid">
          {labels.bids}
        </Label>
        <Label position={[0, 1.85, -0.8]} minLevel="expert" tone="mono">
          spread
        </Label>
      </group>
    </group>
  );
}

/** The board behind the pool: the x · y = k curve with the pool's current position on it. */
function CurvePanel({ q, labels, lang }: { q: Quote; labels: Record<string, string>; lang: Lang }) {
  const { compact } = useScene();
  const p = toPanel(q.x, q.y, 0.14);
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
        <Label position={[-0.25, -0.5, 0]} minLevel="intermediate" tone="tx">
          {compact ? fmt(q.priceAfter, 0, lang) : `1 ETH = ${fmt(q.priceAfter, 0, lang)} USDC`}
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
function ValueBars({ q, labels, lang }: { q: Quote; labels: Record<string, string>; lang: Lang }) {
  const hold = 1 + q.ratio;
  const inPool = hold * (1 + q.il);
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
      <Label position={[-1, hold + 0.65, 0]} tone="plain">
        {labels.hold}
      </Label>
      <Label position={[1.1, hold + 0.6, 0]} tone="actor">
        {labels.inPool}
      </Label>
      <Label position={[0.3, -0.45, 1.3]} maxLevel="intermediate" tone={q.il < -0.0005 ? 'invalid' : 'default'}>
        {labels.il} {pct(q.il, 1, lang)}
      </Label>
      <Label position={[0.3, -0.45, 1.3]} minLevel="expert" tone="mono">
        2·√r/(1+r) − 1 = {pct(q.il, 2, lang)}
      </Label>
    </group>
  );
}

export default function Scene({ stepId, labels, lang }: SceneProps) {
  const dx = useSwap((s) => s.dx);
  const q = useMemo(() => quote(dx), [dx]);
  const nums = useLevel().atLeast('intermediate');

  const orderbook = stepId === 'orderbook';
  const pool = stepId === 'pool';
  const curve = stepId === 'curve';
  const swap = stepId === 'swap';
  const fees = stepId === 'fees';
  const risks = stepId === 'risks';
  const live = curve || swap || risks;

  const a = live ? (LEVEL * q.x) / X0 : orderbook ? 0.45 : fees ? 0.9 : LEVEL;
  const b = live ? (LEVEL * q.y) / Y0 : orderbook ? 0.45 : fees ? 0.9 : LEVEL;
  const trading = orderbook || swap || fees;

  return (
    <>
      <ShadowGround />

      {/* The pool is in every step; its two levels are the reserves. */}
      <Platform size={[6.4, 4.4]} position={[0, 0, 0]} color="ground" height={0.2} />
      <Pool a={a} b={b} />
      <Label position={[-2.6, 2.1, 0.9]} tone="tokenA" show={!orderbook}>
        ETH
        {nums && ` ${fmt(live ? q.x : X0, live ? 1 : 0, lang)}`}
      </Label>
      <Label position={[2.9, 1.9, 0.5]} tone="tokenB" show={!orderbook}>
        USDC
        {nums && ` ${fmt(live ? q.y : Y0, 0, lang)}`}
      </Label>
      <Label position={[0.6, 2.4, -0.6]} show={orderbook} tone="valid">
        {labels.poolReady}
      </Label>

      {/* Step 1: buyers and sellers waiting at an order book, next to a pool that is always open. */}
      <Anim show={orderbook} position={OB}>
        <OrderBook labels={labels} />
      </Anim>

      {/* The trader: one token in, the other out. */}
      <Anim show={trading} position={swap ? TRADER_SIDE : TRADER}>
        <Person color="actor" />
        <Label position={[0, -0.4, 0.7]} show={fees} tone="actor">
          {labels.trader}
        </Label>
        <Label position={[0, -0.4, 0.7]} show={swap} maxLevel="beginner" tone="actor">
          {labels.trader}
        </Label>
      </Anim>
      <Anim show={trading}>
        <Leg path={swap ? PATHS.sideSellA : PATHS.sellA} cycle={4} from={0} to={1.6}>
          <Token color="tokenA" radius={0.3} />
        </Leg>
        <Leg path={swap ? PATHS.sideBuyB : PATHS.buyB} cycle={4} from={1.9} to={3.5}>
          <Token color="tokenB" radius={0.3} />
        </Leg>
      </Anim>
      <Anim show={swap}>
        <Label position={[-3.6, 1.9, 3]} minLevel="intermediate" tone="tokenA">
          {labels.in} {fmt(q.dx, 0, lang)} ETH
        </Label>
        <Label position={[-3.4, -0.45, 3.7]} minLevel="intermediate" tone="tokenB">
          {labels.out} {fmt(q.out, 0, lang)} USDC
        </Label>
        <Label position={[3.4, 2.2, -1.6]} minLevel="expert" tone="mono">
          getAmountOut()
        </Label>
      </Anim>

      {/* Steps 2 and 5: liquidity providers. Each one adds both tokens and holds a share. */}
      {[LP1, LP2].map((p, i) => (
        <Anim key={i} show={pool || fees} position={p} speed={5 + i}>
          <Person color="actor" />
          <Anim show={fees} position={[0, 1.6, 0]}>
            <Bob phase={i * 2}>
              <Token color="valid" radius={0.3} />
            </Bob>
          </Anim>
        </Anim>
      ))}
      <Label position={[LP1[0], -0.45, LP1[2] + 0.7]} show={pool} tone="actor">
        {labels.lp}
      </Label>
      <Label position={[LP1[0], 2.75, LP1[2]]} show={fees} tone="valid">
        {labels.lpToken}
      </Label>
      <Anim show={pool}>
        <Leg path={PATHS.lp1A} cycle={5} from={0} to={1.5} arc={1}>
          <Token color="tokenA" radius={0.3} />
        </Leg>
        <Leg path={PATHS.lp1B} cycle={5} from={0.3} to={1.9} arc={1.7}>
          <Token color="tokenB" radius={0.3} />
        </Leg>
        <Leg path={PATHS.lp2A} cycle={5} from={2.5} to={4.1} arc={1.7}>
          <Token color="tokenA" radius={0.3} />
        </Leg>
        <Leg path={PATHS.lp2B} cycle={5} from={2.8} to={4.3} arc={1}>
          <Token color="tokenB" radius={0.3} />
        </Leg>
        <Label position={[0.9, 3.5, -0.9]} minLevel="intermediate" tone="plain">
          {labels.bothTokens}
        </Label>
        <Label position={[0.4, -0.5, 2.6]} minLevel="expert" tone="mono">
          Pair.mint() → √(x · y)
        </Label>
      </Anim>

      {/* Step 5: a slice of every swap stays behind in the pool. */}
      <Anim show={fees}>
        <Leg path={PATHS.sellA} cycle={4} from={0.25} to={1.85} arc={0.8}>
          <group position={[0, 0.2, 0]}>
            <FeeCoin />
          </group>
        </Leg>
        {[
          [-1.5, 0.5],
          [-0.9, -0.4],
          [-0.5, 0.6],
          [0.6, -0.3],
          [1.3, 0.5],
        ].map(([x, z], i) => (
          <group key={i} position={[x, 1.1, z]}>
            <Bob amount={0.03} phase={i}>
              <FeeCoin />
            </Bob>
          </group>
        ))}
        <Label position={[0.2, 2.9, -0.8]} tone="tx">
          {labels.fee}
        </Label>
        <Label position={[0.6, -0.9, 2.2]} minLevel="expert" tone="mono">
          min(dx/x, dy/y) · totalSupply
        </Label>
      </Anim>

      {/* Steps 3, 4, 6: the curve and the pool's position on it. */}
      <Anim show={live}>
        <CurvePanel q={q} labels={labels} lang={lang} />
      </Anim>

      {/* Step 6: holding versus providing liquidity at the new price. */}
      <Anim show={risks} position={[6.2, 0, -2.2]}>
        <ValueBars q={q} labels={labels} lang={lang} />
      </Anim>
    </>
  );
}

/** One figure in the control panel: name and value on one line, so the panel stays low on a phone. */
function Stat({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="ctl-stat" style={{ display: 'flex', alignItems: 'baseline', gap: 6, whiteSpace: 'nowrap' }}>
      <span>{name}</span>
      <strong style={{ fontSize: '0.84rem' }}>{children}</strong>
    </div>
  );
}

export function Controls({ stepId, labels, lang }: SceneProps) {
  const dx = useSwap((s) => s.dx);
  const setDx = useSwap((s) => s.setDx);
  const risks = stepId === 'risks';
  if (stepId !== 'curve' && stepId !== 'swap' && !risks) return null;
  const q = quote(dx);
  return (
    <div className="ctl" style={{ gap: '4px 14px', maxWidth: 560 }}>
      <label className="ctl-field" style={{ display: 'flex', alignItems: 'center', gap: 10, flexBasis: '100%' }}>
        <span style={{ whiteSpace: 'nowrap', minWidth: '6.2em' }}>
          {labels.sell}: {fmt(q.dx, 0, lang)} ETH
        </span>
        <input id="swap-amount" type="range" min={0} max={MAX_IN} step={1} value={q.dx} onChange={(e) => setDx(Number(e.target.value))} aria-label={labels.sell} style={{ flex: 1, minWidth: 0 }} />
      </label>
      {risks ? (
        <div className="ctl-stats" style={{ gap: '2px 14px' }}>
          <Stat name={labels.impact}>{pct(q.impact, 2, lang)}</Stat>
          <Stat name={`${labels.minOut} (${pct(TOLERANCE, 1, lang)})`}>{fmt(q.minOut, 0, lang)} USDC</Stat>
          <Stat name={labels.ratio}>{fmt(q.ratio, 3, lang)}</Stat>
          <Stat name={labels.il}>{pct(q.il, 2, lang)}</Stat>
        </div>
      ) : (
        <div className="ctl-stats" style={{ gap: '2px 14px' }}>
          <Stat name={labels.youGet}>{fmt(q.out, 0, lang)} USDC</Stat>
          <Stat name={labels.price}>
            {fmt(q.priceBefore, 0, lang)} → {fmt(q.priceAfter, 0, lang)}
          </Stat>
          <Stat name={labels.impact}>{pct(q.impact, 2, lang)}</Stat>
          <Stat name={labels.reserves}>
            {fmt(q.x, 0, lang)} ETH · {fmt(q.y, 0, lang)} USDC
          </Stat>
        </div>
      )}
    </div>
  );
}
