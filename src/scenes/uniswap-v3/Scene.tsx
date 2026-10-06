import { useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { Group } from 'three';
import { Anim, Ball, Box, Cyl, FlowLine, Label, Mat, Mover, Packet, Person, Platform, ShadowGround, useLoop, type Vec3 } from '../../scene/kit';
import type { SceneProps } from '../../scene/types';
import { inRange, priceToTick } from '../../sim/ammV3';
import type { ColorKey } from '../../theme/tokens';
import type { Lang } from '../../types';
import { idleShare, PATH_KINDS, positionMove, simulateDay, TIER_MODELS, type PathKind } from './logic';
import {
  BIN,
  CAPITAL,
  derive,
  ENTRY,
  MOVE_MAX,
  MOVE_MIN,
  MOVE_STEP,
  P_MAX,
  P_MIN,
  POOL_BIN,
  POOL_BINS,
  POOL_HEIGHTS,
  POOL_PRICE,
  POOL_START,
  PRICE_STEP,
  quoteSwap,
  SWAP_MAX,
  SWAP_STEP,
  useFees,
  useIdle,
  usePosition,
  useSwapSim,
  WIDTH_MAX,
  WIDTH_MIN,
  WIDTH_STEP,
  xOf,
} from './state';

const INTERACTIVE = new Set(['concentrated', 'ticks', 'efficiency']);
const BINS = Array.from({ length: (P_MAX - P_MIN) / BIN }, (_, i) => P_MIN + i * BIN);
const BIN_W = xOf(P_MIN + BIN) - xOf(P_MIN);
const DEPTH = 1.6;
/** Height of a full-range (v2) position of the same value. */
const V2_H = 0.45;
const PILE = 2.3;
/** World units the stage is raised on narrow screens, per step. */
const PHONE_LIFT: Record<string, number> = { idle: 1.6, crossing: 2, 'fees-nft': 1.6, 'fee-day': 2.2, efficiency: 1.6 };
/** Step 1: a column standing for the whole pool's capital. */
const GAUGE_H = 2.4;
const GAUGE_X = -4.9;
const GAUGE_Z = 3.3;
const MID = (P_MIN + P_MAX) / 2;
/** The whole stage is turned a little toward the viewer so the price axis reads left to right. */
const TURN = Math.PI / 8;

/** Bar height for a liquidity ratio. A power scale keeps a 150x range on screen. */
const heightOf = (ratio: number) => Math.min(4.6, V2_H * Math.max(1, ratio) ** 0.45);

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** Number formatting for the scene and the panel, in the page's language. */
function formats(lang: Lang) {
  const locale = lang === 'tr' ? 'tr-TR' : 'en-US';
  const dec = (n: number, digits: number) => (Number.isFinite(n) ? n : 0).toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return {
    int: (n: number) => dec(Math.round(Number.isFinite(n) ? n : 0), 0),
    dec,
    /** A share given in percent: 3.7% in English, %3,7 in Turkish. */
    pct: (n: number, digits = 1) => (lang === 'tr' ? `%${dec(n, digits)}` : `${dec(n, digits)}%`),
    /** Millions with one decimal: 2.5M. */
    mil: (n: number) => `${dec(n / 1e6, 1)}M`,
  };
}

/** A unit-high box standing on y = 0; scale its parent on y to set the height. */
function Bar({ w, d, color, glow = false, opacity = 1 }: { w: number; d: number; color: ColorKey; glow?: boolean; opacity?: number }) {
  return (
    <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, 1, d]} />
      <Mat color={color} glow={glow} opacity={opacity} />
    </mesh>
  );
}

function Bob({ children, amp = 0.12, speed = 1.6, phase = 0 }: { children: ReactNode; amp?: number; speed?: number; phase?: number }) {
  const ref = useRef<Group>(null);
  useLoop((t) => {
    if (ref.current) ref.current.position.y = Math.sin(t * speed + phase) * amp;
  });
  return <group ref={ref}>{children}</group>;
}

/* ---------- Step 4: a swap walks the price across initialized ticks ---------- */

const CW = 0.56;
const CGAP = 0.05;
const C0 = -(POOL_HEIGHTS.length * CW) / 2;
const MARK_H = 4.3;
/** World x of a price on the pool of step 4. */
const poolX = (price: number) => C0 + ((price - POOL_START) / POOL_BIN) * CW;

function Crossing({ on, labels, lang }: { on: boolean; labels: Record<string, string>; lang: Lang }) {
  const size = useSwapSim((s) => s.size);
  const buy = useSwapSim((s) => s.buy);
  const { walk } = useMemo(() => quoteSwap(size, buy), [size, buy]);
  const f = formats(lang);
  const end = walk.priceEnd;
  const x0 = poolX(POOL_PRICE);
  const x1 = poolX(end);
  const lo = Math.min(POOL_PRICE, end);
  const hi = Math.max(POOL_PRICE, end);
  const moved = Math.abs(x1 - x0) > 0.08;
  const z = DEPTH / 2 + 0.16;

  return (
    <>
      <Platform size={[POOL_HEIGHTS.length * CW + 0.6, 2.4]} color="ground" height={0.25} />
      {POOL_BINS.map((b, i) => {
        const h = POOL_HEIGHTS[i];
        const w = CW - CGAP;
        // Share of this range already sold for USDC: everything below the price.
        const sold = clamp((end - b.lo) / (b.hi - b.lo), 0, 1);
        const active = i === walk.endBin;
        return (
          <group key={i} position={[C0 + i * CW + CGAP / 2, 0, 0]}>
            <Anim position={[(sold * w) / 2, 0, 0]} scale={[Math.max(sold * w, 0.001), h, 1]} show={sold > 0.001} speed={9}>
              <Bar w={1} d={DEPTH} color="tokenB" glow={active} />
            </Anim>
            <Anim position={[sold * w + ((1 - sold) * w) / 2, 0, 0]} scale={[Math.max((1 - sold) * w, 0.001), h, 1]} show={sold < 0.999} speed={9}>
              <Bar w={1} d={DEPTH} color="tokenA" glow={active} />
            </Anim>
            {/* Initialized ticks: every boundary here starts or ends somebody's position. */}
            {i > 0 && (
              <Tick x={-CGAP / 2} z={z} crossed={b.lo > lo && b.lo <= hi && moved} />
            )}
          </group>
        );
      })}
      <Anim position={[C0 + (walk.endBin + 0.5) * CW, POOL_HEIGHTS[walk.endBin] + 0.04, 0]} speed={12}>
        <Box size={[CW - CGAP, 0.08, DEPTH]} color="valid" glow radius={0.02} />
      </Anim>

      {/* Where the price started, and how far this swap pushed it. */}
      <Box size={[0.06, 0.7, 0.06]} position={[x0, 0.35, z + 0.5]} color="chain" radius={0.02} />
      {moved && <FlowLine points={[[x0, 0.12, z + 0.5], [x1, 0.12, z + 0.5]]} color="valid" width={3} />}

      <Anim position={[x1, 0, z]} speed={9}>
        <Box size={[0.08, MARK_H, 0.08]} position={[0, MARK_H / 2, 0]} color="ink" radius={0.02} />
        <Ball radius={0.17} position={[0, MARK_H + 0.1, 0]} color="valid" glow />
        <Label position={[0, MARK_H + 0.7, 0]} maxLevel="beginner" tone="valid">
          {labels.priceNow}: {f.int(end)}
        </Label>
        <Label position={[0, MARK_H + 0.7, 0]} minLevel="intermediate" maxLevel="intermediate" tone="valid">
          {f.int(end)} · L {f.mil(walk.activeL)}
        </Label>
        <Label position={[0, MARK_H + 0.75, 0]} minLevel="expert" tone="mono">
          tick {priceToTick(end)}
          <br />
          liquidity = {f.mil(walk.activeL)}
        </Label>
      </Anim>

      <Label position={[C0 + 1.6 * CW, 1.5, 0]} tone="tokenB" show={end > POOL_START + 3 * POOL_BIN}>
        {labels.usdcSide}
      </Label>
      <Label position={[C0 + 15.4 * CW, 1.4, 0]} tone="tokenA" show={end < POOL_START + 13 * POOL_BIN}>
        {labels.ethSide}
      </Label>
      <Label position={[(x0 + x1) / 2 + 0.6, -0.25, z + 1.3]} minLevel="intermediate" maxLevel="intermediate" tone="plain">
        {labels.crossed}: {walk.ticksCrossed}
      </Label>
      <Label position={[(x0 + x1) / 2 + 0.6, -0.3, z + 1.4]} minLevel="expert" tone="mono">
        {walk.ticksCrossed} × (L ← L {buy ? '+' : '−'} liquidityNet)
      </Label>

      {/* The trader pays one token in and takes the other out; that is what pushes the price. */}
      <group position={[-3.6, 0, 3.4]} rotation={[0, 0.6, 0]}>
        <Person color="actor" />
      </group>
      <Label position={[-3.6, 1.75, 3.4]} tone="actor">
        {buy ? labels.trader : labels.traderSell}
      </Label>
      <Mover path={SWAP_IN} duration={1.5} arc={0.9} playing={on && size > 0}>
        <Packet color={buy ? 'tokenB' : 'tokenA'} size={0.3} />
      </Mover>
      <Mover path={SWAP_OUT} duration={1.5} delay={0.95} arc={0.9} playing={on && size > 0}>
        <Packet color={buy ? 'tokenA' : 'tokenB'} size={0.3} />
      </Mover>
    </>
  );
}

function Tick({ x, z, crossed }: { x: number; z: number; crossed: boolean }) {
  return (
    <Anim position={[x, 0, z]} scale={[1, crossed ? 1.8 : 1, 1]} speed={10}>
      <Box key={crossed ? 'x' : 'o'} size={[0.07, 0.5, 0.07]} position={[0, 0.25, 0]} color={crossed ? 'valid' : 'ink'} glow={crossed} radius={0.02} />
    </Anim>
  );
}

const SWAP_IN: Vec3[] = [
  [-3.6, 0.8, 3.2],
  [-0.6, 1.2, 0.9],
];
const SWAP_OUT: Vec3[] = [
  [0.4, 1.2, 0.9],
  [-3.2, 0.8, 3.6],
];

/* ---------- Step 5: fee tiers as separate pools, positions as NFTs ---------- */

interface Tier {
  x: number;
  fee: string;
  spacing: number;
  use: 'tierStable' | 'tierMost' | 'tierExotic';
  bins: number[];
  /** Positions: first and last bin index, and the token id drawn on the card. */
  cards: { from: number; to: number; id: number }[];
}

const TIER_W = 3;
const TIERS: Tier[] = [
  { x: -5.2, fee: '0.05%', spacing: 10, use: 'tierStable', bins: [0.2, 0.3, 0.5, 0.9, 1.5, 2.1, 2.4, 2.4, 2.1, 1.5, 0.9, 0.5, 0.3, 0.2], cards: [{ from: 4, to: 9, id: 4217 }] },
  { x: 0, fee: '0.30%', spacing: 60, use: 'tierMost', bins: [0.4, 0.8, 1.3, 1.6, 1.3, 0.8, 0.4], cards: [{ from: 0, to: 2, id: 311 }, { from: 3, to: 5, id: 8052 }] },
  { x: 5.2, fee: '1%', spacing: 200, use: 'tierExotic', bins: [0.5, 0.9, 0.7, 0.4], cards: [{ from: 1, to: 2, id: 96 }] },
];

/** A position NFT: a card showing the range it covers. */
function NftCard() {
  return (
    <group rotation={[0, Math.PI / 4, 0]}>
      <Box size={[0.96, 1.26, 0.06]} position={[0, 0, -0.03]} color="actor" radius={0.08} />
      <Box size={[0.84, 1.14, 0.06]} position={[0, 0, 0.02]} color="platform" radius={0.06} />
      <Box size={[0.6, 0.06, 0.03]} position={[0, -0.36, 0.06]} color="chain" radius={0.01} />
      <Box size={[0.14, 0.34, 0.03]} position={[-0.09, -0.16, 0.06]} color="tokenB" radius={0.01} />
      <Box size={[0.14, 0.5, 0.03]} position={[0.09, -0.08, 0.06]} color="tokenA" radius={0.01} />
      <Ball radius={0.09} position={[0, 0.36, 0.05]} color="actor" />
    </group>
  );
}

function Tiers({ labels, lang }: { labels: Record<string, string>; lang: Lang }) {
  const sel = useFees((s) => s.tier);
  const narrow = useThree((s) => s.size.width < 640);
  return (
    <>
      {TIERS.map((t, ti) => {
        const w = TIER_W / t.bins.length;
        const at = (i: number) => -TIER_W / 2 + (i + 0.5) * w;
        const mine = ti === sel;
        const fee = tierName(lang, TIER_MODELS[ti].feeBps);
        return (
          <Anim key={t.fee} position={[t.x, mine ? 0.45 : 0, 0]} speed={7}>
            <Platform size={[TIER_W + 0.6, 2.6]} color={mine ? 'platform' : 'ground'} height={0.25} />
            {t.bins.map((h, i) => (
              <group key={i} position={[at(i), 0, -0.3]} scale={[1, h, 1]}>
                <Bar key={mine ? 'on' : 'off'} w={w - 0.04} d={1.2} color={i < t.bins.length / 2 ? 'tokenB' : 'tokenA'} glow={mine} opacity={mine ? 1 : 0.55} />
              </group>
            ))}
            {t.cards.map((c, ci) => {
              const mid = (at(c.from) + at(c.to)) / 2;
              const span = at(c.to) - at(c.from) + w;
              const top = Math.max(...t.bins.slice(c.from, c.to + 1)) + 1.25;
              return (
                <group key={c.id}>
                  {/* The strip marks the range this position covers. */}
                  <Box size={[span - 0.04, 0.08, 0.26]} position={[mid, 0.04, 0.62]} color="actor" glow radius={0.03} />
                  <FlowLine points={[[mid, top - 0.7, 0.62], [mid, 0.14, 0.62]]} color="actor" dashed arrow={false} width={1.5} />
                  <group position={[mid, top, 0.62]}>
                    <Bob phase={ti * 1.3 + ci * 2}>
                      <NftCard />
                    </Bob>
                    <Label position={[0, 0.95, 0]} minLevel="intermediate" maxLevel="intermediate" tone="actor" show={ci === 0}>
                      NFT #{c.id}
                    </Label>
                    <Label position={[0, 0.95, 0]} minLevel="expert" tone="mono" show={ci === 0 && ti !== 1}>
                      tokenId {c.id}
                    </Label>
                  </group>
                </group>
              );
            })}
            <Label position={[0, -0.3, 1.9]} maxLevel="beginner" tone={mine ? 'valid' : 'default'}>
              {fee}
              <br />
              {mine ? labels.yourPool : labels[t.use]}
            </Label>
            <Label position={[0, -0.4, 1.9]} minLevel="intermediate" tone={mine ? 'valid' : 'default'}>
              {fee} · {mine ? labels.yourPool : labels[t.use]}
              <br />
              tickSpacing {t.spacing}
            </Label>
          </Anim>
        );
      })}
      <Label position={[0, 4.6, 0]} maxLevel="beginner" tone="actor">
        {labels.nftCaption}
      </Label>
      <Label position={narrow ? [1.5, 5.7, 0.6] : [0.3, 5.2, 0.6]} minLevel="expert" tone="mono">
        NonfungiblePositionManager
        <br />
        ERC-721 · positions[tokenId] →
        <br />
        (tickLower, tickUpper, liquidity)
      </Label>
    </>
  );
}

/* ---------- Step 6: one simulated day for a position ---------- */

const DAY_W = 9;
const DAY_H = 4.4;
const DAY_Y0 = 0.3;
const DAY_LO = 1600;
const DAY_HI = 2400;
const dayX = (t: number, n: number) => -DAY_W / 2 + (t / n) * DAY_W;
const dayY = (p: number) => DAY_Y0 + ((clamp(p, DAY_LO, DAY_HI) - DAY_LO) / (DAY_HI - DAY_LO)) * DAY_H;
const pileH = (fees: number) => clamp(0.45 * Math.sqrt(Math.max(0, fees)), 0.03, 4.2);
const PILE_X = DAY_W / 2 + 1.1;

/** A unit-high coin pile standing on y = 0. */
function Pile({ color, glow = false }: { color: ColorKey; glow?: boolean }) {
  return (
    <mesh position={[0, 0.5, 0]} castShadow>
      <cylinderGeometry args={[0.42, 0.42, 1, 28]} />
      <Mat color={color} glow={glow} />
    </mesh>
  );
}

function FeeDay({ on, labels, lang }: { on: boolean; labels: Record<string, string>; lang: Lang }) {
  const tier = useFees((s) => s.tier);
  const width = useFees((s) => s.width);
  const kind = useFees((s) => s.path);
  const narrow = useThree((s) => s.size.width < 640);
  const model = TIER_MODELS[tier];
  const day = useMemo(() => simulateDay(model, width, kind), [model, width, kind]);
  const wide = useMemo(() => simulateDay(model, WIDTH_MAX, kind), [model, kind]);
  const f = formats(lang);
  const n = day.path.length - 1;
  const yLo = dayY(day.lower);
  const yHi = dayY(day.upper);
  const top = DAY_Y0 + DAY_H;

  // A marker replays the day along the path.
  const head = useRef<Group>(null);
  const pathRef = useRef(day.path);
  pathRef.current = day.path;
  useLoop((time) => {
    if (!head.current) return;
    const pts = pathRef.current;
    const u = Math.min(1, (time % 9) / 7.5) * (pts.length - 1);
    const i = Math.min(pts.length - 2, Math.floor(u));
    const p = pts[i] + (pts[i + 1] - pts[i]) * (u - i);
    head.current.position.set(dayX(u, pts.length - 1), dayY(p), -0.36);
  }, on);

  return (
    <>
      <Platform size={[DAY_W + 4, 3.6]} position={[1.2, 0, 0.3]} color="ground" height={0.25} />
      {/* The chart: time runs to the right, price goes up. */}
      <Box size={[DAY_W + 0.3, DAY_H + 0.5, 0.12]} position={[0, DAY_Y0 + DAY_H / 2, -0.7]} color="platform" radius={0.05} />
      <Box size={[DAY_W, 0.03, 0.03]} position={[0, dayY(ENTRY), -0.62]} color="chain" radius={0.01} />

      {/* The position's range as a band across the whole day. */}
      <Anim position={[0, (yLo + yHi) / 2, -0.56]} scale={[1, Math.max(0.05, yHi - yLo), 1]} speed={9}>
        <mesh>
          <boxGeometry args={[DAY_W, 1, 0.06]} />
          <Mat color="actor" opacity={0.38} />
        </mesh>
      </Anim>
      <Anim position={[0, yLo, -0.54]} speed={9}>
        <Box size={[DAY_W, 0.05, 0.05]} color="actor" radius={0.02} />
      </Anim>
      <Anim position={[0, yHi, -0.54]} speed={9}>
        <Box size={[DAY_W, 0.05, 0.05]} color="actor" radius={0.02} />
      </Anim>

      {/* The day's prices: green while inside the range, red outside. */}
      {day.path.map((p, t) => {
        const ok = inRange(p, day.lower, day.upper);
        return (
          <Anim key={t} position={[dayX(t, n), dayY(p), -0.4]} speed={9}>
            <Ball key={ok ? 'in' : 'out'} radius={0.085} color={ok ? 'valid' : 'invalid'} glow={ok} />
          </Anim>
        );
      })}
      <group ref={head} position={[dayX(n, n), dayY(day.path[n]), -0.36]}>
        <Ball radius={0.15} color="ink" />
      </group>

      {/* Fees earned in each half hour: nothing while the price is outside. */}
      {day.earned.map((e, t) => (
        <Anim key={t} position={[dayX(t + 0.5, n), 0, 1]} scale={[1, clamp(1.1 * Math.sqrt(e), 0.03, 1.5), 1]} speed={9}>
          <Bar key={e > 0 ? 'fee' : 'none'} w={DAY_W / n - 0.05} d={0.5} color={e > 0 ? 'tokenB' : 'invalid'} glow={e > 0} />
        </Anim>
      ))}

      {/* The day's total: this position against a wide one in the same pool. */}
      <group position={[PILE_X, 0, 0.3]}>
        <Anim scale={[1, pileH(day.fees), 1]} speed={8}>
          <Pile color="tokenB" glow />
        </Anim>
        <Anim position={[0, pileH(day.fees) + 0.55, 0]} speed={8}>
          <Label tone="tokenB">
            {labels.you} {f.dec(day.fees, 2)}
          </Label>
        </Anim>
      </group>
      <group position={[PILE_X + 1.25, 0, 0.3]}>
        <Anim scale={[1, pileH(wide.fees), 1]} speed={8}>
          <Pile color="neutral" />
        </Anim>
        <Anim position={[0.2, pileH(wide.fees) + 0.55, 0]} speed={8}>
          <Label tone="plain" show={!narrow}>
            {labels.wide} {f.dec(wide.fees, 2)}
          </Label>
        </Anim>
      </group>

      <Anim position={[-DAY_W / 2 - 0.9, (yLo + yHi) / 2, -0.5]} speed={9}>
        <Label maxLevel="beginner" tone="actor">
          {labels.yourRange}
        </Label>
        <Label minLevel="intermediate" tone="actor">
          {f.int(day.lower)} – {f.int(day.upper)}
        </Label>
      </Anim>
      <Label position={[-DAY_W / 2 + 1.7, top - 0.3, -0.6]} maxLevel="intermediate">
        {tierName(lang, model.feeBps)} · {labels.simulated}
      </Label>
      <Label position={[-DAY_W / 2 + 4.2, narrow ? top + 0.5 : top - 0.4, -0.6]} minLevel="expert" tone="mono">
        fee {model.feeBps * 100} · tickSpacing {model.spacing}
        <br />
        ticks {day.tickLower} … {day.tickUpper}
      </Label>
      <Label position={[-DAY_W / 2 + 1.2, -0.35, 2]} tone="plain">
        {labels.feeBars}
      </Label>
      <Label position={[DAY_W / 2 - 0.2, -0.35, 2]} minLevel="intermediate" tone="plain" show={!narrow}>
        24:00
      </Label>
    </>
  );
}

/* ---------- The scene ---------- */

export default function Scene({ stepId, labels, lang }: SceneProps) {
  const pos = usePosition();
  const move = useIdle((s) => s.move);
  // On a phone the control panel covers the lower part of the canvas, so the stage moves up out from under it.
  const narrow = useThree((s) => s.size.width < 640);
  const lift = narrow ? (PHONE_LIFT[stepId] ?? 0) : 0;
  const shrink = narrow && stepId === 'fee-day' ? 0.9 : 1;
  const interactive = INTERACTIVE.has(stepId);
  const flat = stepId === 'idle';
  const showRow = flat || interactive;
  const isEff = stepId === 'efficiency';
  const isTicks = stepId === 'ticks';

  // Steps without controls always show the starting market.
  const price = interactive ? pos.price : MID;
  const { lower, upper } = pos;
  const d = derive(lower, upper, price);
  const h = heightOf(d.ratio);
  const ok = flat || d.active;
  const inside = price >= lower && price < upper;
  const markH = (flat ? V2_H : inside ? h : 0.05) + 0.9;
  const v3Capital = d.efficiency > 0 ? CAPITAL / d.efficiency : 0;
  const f = formats(lang);
  const fmt = f.int;
  const one = (n: number) => f.dec(n, 1);
  // Step 1: the prices the market really visits, and the share of a v2 pool they use.
  const idle = idleShare(move, MID);
  const bandLo = xOf(Math.max(P_MIN, idle.lower));
  const bandHi = xOf(Math.min(P_MAX, idle.upper));
  const xMid = xOf(MID);
  const usedH = Math.max(0.04, idle.used * GAUGE_H);
  // Last step: the position was opened at ENTRY and the price moved on from there.
  const pm = positionMove(CAPITAL, ENTRY, lower, upper, price);

  return (
    <>
      <ShadowGround y={lift} />
      <group position={[0, lift, 0]} rotation={[0, TURN, 0]} scale={shrink}>
      {/* Steps 1, 2, 3, 6: one price axis, liquidity drawn as bins standing on it. */}
      <Anim show={showRow}>
        <Platform size={[12.7, 2.5]} color="ground" height={0.25} />
        {BINS.map((lo) => {
          const mid = lo + BIN / 2;
          const on = flat || (lo >= lower && lo < upper);
          const busy = !flat;
          const here = !flat && price >= lo && price < lo + BIN;
          return (
            <Anim key={lo} position={[xOf(mid), 0, 0]} scale={[1, flat ? V2_H : h, 1]} show={on} speed={8}>
              <Bar key={ok ? 'live' : 'dim'} w={BIN_W - 0.04} d={DEPTH} color={!busy ? 'neutral' : mid < price ? 'tokenB' : 'tokenA'} glow={here && ok} opacity={ok ? 1 : 0.4} />
            </Anim>
          );
        })}

        {/* The same money spread v2-style, for comparison. */}
        <Anim show={stepId === 'concentrated' || isEff} position={[0, 0, 0]}>
          <Box size={[12, V2_H, DEPTH + 0.06]} position={[0, V2_H / 2, 0]} color="neutral" opacity={0.45} radius={0.03} />
          <Label position={[3, V2_H + 1.3, 0.2]} tone="plain" show={!isEff && price < 2150 && upper < 2500}>
            {labels.v2Spread}
          </Label>
        </Anim>

        {/* Current price. */}
        <Anim position={[xOf(price), 0, DEPTH / 2 + 0.16]} scale={[1, markH, 1]} speed={10}>
          <Bar w={0.08} d={0.08} color={ok ? 'ink' : 'invalid'} />
        </Anim>
        <Anim position={[xOf(price), markH + 0.12, DEPTH / 2 + 0.16]} speed={10}>
          <Ball radius={0.17} color={ok ? 'valid' : 'invalid'} glow />
          <Label position={[0, 0.6, 0]} maxLevel="beginner" tone={ok ? 'valid' : 'invalid'}>
            {ok ? labels.priceNow : labels.outRange}
          </Label>
          <Label position={[0, 0.6, 0]} minLevel="intermediate" tone={ok ? 'valid' : 'invalid'}>
            {fmt(price)}
            {interactive && ` · ${ok ? labels.inRange : labels.outRange}`}
          </Label>
        </Anim>

        {/* Axis ends. */}
        <Label position={[xOf(P_MIN) + 0.9, 0.1, -1.7]} tone="plain" show={stepId === 'concentrated' || isTicks}>
          {fmt(P_MIN)} USDC
        </Label>
        <Label position={[xOf(P_MAX) - 0.4, 0.1, -1.7]} tone="plain" show={stepId === 'concentrated' || isTicks}>
          {fmt(P_MAX)} USDC
        </Label>

        {/* Step 1: most of the slab never trades. */}
        <Label position={[-4.4, V2_H + 0.6, 0]} show={flat && bandLo > -3.2}>
          {labels.idle}
        </Label>
        <Label position={[4.4, V2_H + 0.6, 0]} show={flat && bandHi < 3.2}>
          {labels.idle}
        </Label>
        <Label position={[1.6, -0.3, 2.2]} show={flat} minLevel="intermediate" tone="valid">
          ±{f.pct(move)} → {fmt(idle.lower)} – {fmt(idle.upper)}
        </Label>
        <Label position={[-3.4, 2.4, -1]} show={flat} minLevel="expert" tone="mono">
          x · y = k &nbsp; p ∈ (0, ∞)
        </Label>
        <Label position={[xOf(P_MIN) + 0.5, 0.1, -1.7]} show={flat && !narrow} minLevel="intermediate" tone="plain">
          {labels.toZero}
        </Label>
        <Label position={[xOf(P_MAX) - 0.3, 0.1, -1.7]} show={flat && !narrow} minLevel="intermediate" tone="plain">
          {labels.toInf}
        </Label>
        <Anim show={flat} position={[0, 0, 0]}>
          {/* The band of prices the market visits: the only part of the slab that trades. */}
          <Anim position={[(bandLo + xMid) / 2, 0, 0]} scale={[Math.max(0.02, xMid - bandLo), V2_H + 0.07, 1]} speed={10}>
            <Bar w={1} d={DEPTH + 0.08} color="tokenB" glow />
          </Anim>
          <Anim position={[(bandHi + xMid) / 2, 0, 0]} scale={[Math.max(0.02, bandHi - xMid), V2_H + 0.07, 1]} speed={10}>
            <Bar w={1} d={DEPTH + 0.08} color="tokenA" glow />
          </Anim>
          {/* All of the pool's capital as one column; the lit part is what those prices need. */}
          <group position={[GAUGE_X, 0, GAUGE_Z]}>
            <Platform size={[1.5, 1.5]} color="ground" height={0.2} />
            <Anim position={[0, usedH, 0]} scale={[1, GAUGE_H - usedH, 1]} speed={10}>
              <Bar w={0.9} d={0.9} color="neutral" />
            </Anim>
            <Anim scale={[1, usedH, 1]} speed={10}>
              <Bar w={0.96} d={0.96} color="valid" glow />
            </Anim>
            <Anim position={[0.9, usedH / 2, 0.9]} speed={10}>
              <Label tone="valid">
                {labels.busy} {f.pct(idle.used * 100)}
              </Label>
            </Anim>
            <Label position={[0, GAUGE_H + 0.5, 0]} tone="plain" minLevel="intermediate" show={!narrow}>
              {labels.allCapital}
            </Label>
          </group>
          <group position={[-1.6, 0, 3.4]} rotation={[0, 0.5, 0]}>
            <Person color="actor" />
          </group>
          <Mover path={IDLE_IN} duration={1.4} arc={0.8} playing={flat}>
            <Packet color="tokenB" size={0.28} />
          </Mover>
          <Mover path={IDLE_OUT} duration={1.4} delay={0.9} arc={0.8} playing={flat}>
            <Packet color="tokenA" size={0.28} />
          </Mover>
        </Anim>

        {/* The position's bounds. */}
        <Anim position={[xOf(lower), 0, DEPTH / 2 + 0.16]} show={interactive} speed={10}>
          <Box size={[0.07, isTicks ? 0.9 : 0.4, 0.07]} position={[0, isTicks ? 0.45 : 0.2, 0]} color="ink" radius={0.02} />
          <Label position={[-0.8, -0.35, 1.2]} tone="tokenB">
            {fmt(lower)}
          </Label>
        </Anim>
        <Anim position={[xOf(upper), 0, DEPTH / 2 + 0.16]} show={interactive} speed={10}>
          <Box size={[0.07, isTicks ? 0.9 : 0.4, 0.07]} position={[0, isTicks ? 0.45 : 0.2, 0]} color="ink" radius={0.02} />
          <Label position={[0.7, -0.35, 0]} tone="tokenA">
            {fmt(upper)}
          </Label>
        </Anim>

        {/* Last step: where the position was opened, and what it turned into once the price left. */}
        <Anim show={isEff} position={[xOf(ENTRY), 0, DEPTH / 2 + 0.6]}>
          <Box size={[0.07, 0.6, 0.07]} position={[0, 0.3, 0]} color="chain" radius={0.02} />
          <Label position={[0, -0.3, 1.3]} tone="plain" show={Math.abs(price - ENTRY) >= 60}>
            {labels.deposit} {fmt(ENTRY)}
          </Label>
        </Anim>
        <Anim show={isEff && !d.active} position={[xOf((lower + upper) / 2), h + 0.7, -0.4]} speed={10}>
          <Label tone="invalid">{pm.ethShare > 0.5 ? labels.allEth : labels.allUsdc}</Label>
        </Anim>

        {/* Step 3: the axis is a ruler of ticks. */}
        <Anim show={isTicks}>
          {Array.from({ length: 21 }, (_, i) => (
            <Box key={i} size={[0.05, i % 5 === 0 ? 0.36 : 0.2, 0.05]} position={[xOf(P_MIN + i * 100), i % 5 === 0 ? 0.18 : 0.1, DEPTH / 2 + 0.16]} color="chain" radius={0.01} />
          ))}
          <Label position={[-4.9, 2.7, 0]} maxLevel="beginner" tone="plain">
            {labels.ruler}
          </Label>
          <Label position={[-4.9, 2.7, 0]} minLevel="intermediate" maxLevel="intermediate">
            {labels.tickStep}
          </Label>
          <Label position={[-4.7, 3, 0]} minLevel="expert" tone="mono">
            p = 1.0001^tick
            <br />
            tickLower {d.tickLower}
            <br />
            tickUpper {d.tickUpper}
          </Label>
        </Anim>

        {/* Step 6: the capital each design needs for the same depth at the current price. */}
        <Anim show={isEff} position={[-6.3, 0, -2.7]}>
          <Platform size={[4, 2]} position={[0.9, 0, 0]} color="ground" height={0.25} />
          <Cyl radius={0.6} height={PILE} position={[1.9, PILE / 2, 0]} color="tokenB" />
          <Label position={[1.9, PILE + 0.6, 0]} tone="tokenB">
            {labels.v2Needs} {fmt(CAPITAL)}
          </Label>
          <group position={[0, 0, 0]}>
            <Anim scale={[1, d.active ? Math.max(0.02, 1 / d.efficiency) : 0.02, 1]} speed={8}>
              <mesh position={[0, PILE / 2, 0]} castShadow>
                <cylinderGeometry args={[0.6, 0.6, PILE, 28]} />
                <Mat color={d.active ? 'tokenB' : 'invalid'} glow={d.active} />
              </mesh>
            </Anim>
            <Anim position={[-0.2, -0.3, 1.5]} speed={8}>
              <Label maxLevel="intermediate" tone={d.active ? 'tokenB' : 'invalid'}>
                {d.active ? `${labels.v3Needs} ${fmt(v3Capital)}` : labels.noDepth}
              </Label>
              <Label minLevel="expert" tone="tokenB" show={d.active}>
                {labels.v3Needs} {fmt(v3Capital)}
                <br />
                L₃ / L₂ = {one(d.efficiency)}
              </Label>
              <Label minLevel="expert" tone="invalid" show={!d.active}>
                {labels.noDepth}
              </Label>
            </Anim>
          </group>
        </Anim>
      </Anim>

      <Anim show={stepId === 'crossing'}>
        <Crossing on={stepId === 'crossing'} labels={labels} lang={lang} />
      </Anim>

      <Anim show={stepId === 'fees-nft'}>
        <Tiers labels={labels} lang={lang} />
      </Anim>

      <Anim show={stepId === 'fee-day'}>
        <FeeDay on={stepId === 'fee-day'} labels={labels} lang={lang} />
      </Anim>
      </group>
    </>
  );
}

const IDLE_IN: Vec3[] = [
  [-1.6, 0.8, 3.2],
  [-0.4, 0.7, 0.6],
];
const IDLE_OUT: Vec3[] = [
  [0.4, 0.7, 0.6],
  [-1.2, 0.8, 3.6],
];

const NUM = { fontSize: '0.8rem' };
const SLIM = { height: 22 };

/** Tighter panels on phones, so the scene above them stays visible. */
const PHONE_CSS = `
.v3c { --v3-gap: 10px; }
@media (max-width: 639px) {
  .v3c .ctl-title { display: none; }
  .v3c .ctl-stat { font-size: 0.66rem; }
  .v3c .ctl-stat strong { font-size: 0.74rem !important; }
  .v3c .seg { padding: 2px; }
  .v3c .seg button { min-height: 28px; padding: 0 7px; font-size: 0.78rem; }
  .v3c .btn { min-height: 28px !important; padding: 0 6px; font-size: 0.8rem; }
  .v3c .ctl-field { font-size: 0.74rem; }
}`;
const Phone = () => <style>{PHONE_CSS}</style>;

function Stat({ name, tone, children }: { name: string; tone?: 'good' | 'bad'; children: ReactNode }) {
  return (
    <div className="ctl-stat">
      <span>{name}</span>
      <strong style={NUM} data-tone={tone}>
        {children}
      </strong>
    </div>
  );
}

function Seg<T extends string | number | boolean>({ label, value, options, onPick }: { label: string; value: T; options: { value: T; text: string }[]; onPick: (v: T) => void }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" aria-pressed={o.value === value} onClick={() => onPick(o.value)}>
          {o.text}
        </button>
      ))}
    </div>
  );
}

function IdleControls({ labels, lang }: SceneProps) {
  const move = useIdle((s) => s.move);
  const setMove = useIdle((s) => s.setMove);
  const f = formats(lang);
  const r = idleShare(move, MID);
  return (
    <div className="ctl v3c" style={{ width: 'min(480px, calc(100vw - 46px))', gap: '4px 12px' }}>
      <Phone />
      <div className="ctl-title">{labels.tryIdle}</div>
      <label className="ctl-field" style={{ flexBasis: '100%' }}>
        <span>
          {labels.move} ±{f.pct(move)}
        </span>
        <input type="range" style={SLIM} min={MOVE_MIN} max={MOVE_MAX} step={MOVE_STEP} value={move} onChange={(e) => setMove(+e.target.value)} />
      </label>
      <div className="ctl-stats" style={{ flexBasis: '100%', gap: '2px 12px' }}>
        <Stat name={labels.usedRange}>
          {f.int(r.lower)} – {f.int(r.upper)}
        </Stat>
        <Stat name={labels.usedShare} tone="good">
          {f.pct(r.used * 100)}
        </Stat>
        <Stat name={labels.idleShare} tone="bad">
          {f.pct(100 - r.used * 100)}
        </Stat>
        <Stat name={labels.v3Gain}>{f.dec(r.gain, 1)}×</Stat>
      </div>
    </div>
  );
}

function SwapControls({ labels, lang }: SceneProps) {
  const { size, buy, setSize, setBuy } = useSwapSim();
  const f = formats(lang);
  const { input, walk, v2 } = quoteSwap(size, buy);
  const [inUnit, outUnit] = buy ? ['USDC', 'ETH'] : ['ETH', 'USDC'];
  const amount = (n: number, unit: string) => `${unit === 'ETH' ? f.dec(n, 1) : f.int(n)} ${unit}`;
  return (
    <div className="ctl v3c" style={{ width: 'min(600px, calc(100vw - 46px))', gap: '4px 10px' }}>
      <Phone />
      <div className="ctl-title">{labels.trySwap}</div>
      <Seg
        label={labels.direction}
        value={buy}
        onPick={setBuy}
        options={[
          { value: true, text: labels.buyEth },
          { value: false, text: labels.sellEth },
        ]}
      />
      <label className="ctl-field" style={{ minWidth: 130 }}>
        <span>
          {labels.swapSize} {amount(input, inUnit)}
        </span>
        <input type="range" style={SLIM} min={0} max={SWAP_MAX} step={SWAP_STEP} value={size} onChange={(e) => setSize(+e.target.value)} />
      </label>
      <div className="ctl-stats" style={{ flexBasis: '100%', gap: '2px 10px' }}>
        <Stat name={labels.youGet}>{amount(walk.amountOut, outUnit)}</Stat>
        <Stat name={labels.priceMove}>
          {f.int(walk.priceStart)} → {f.int(walk.priceEnd)}
        </Stat>
        <Stat name={labels.crossed}>{walk.ticksCrossed}</Stat>
        <Stat name={labels.activeL}>{f.mil(walk.activeL)}</Stat>
        <Stat name={labels.avgV3} tone="good">
          {f.int(walk.avgPrice)}
        </Stat>
        <Stat name={labels.avgV2} tone={size > 0 ? 'bad' : undefined}>
          {f.int(v2.avgPrice)}
        </Stat>
      </div>
    </div>
  );
}

/** 0.05%, 0.30%, 1% */
const tierName = (lang: Lang, feeBps: number) => formats(lang).pct(feeBps / 100, feeBps % 100 === 0 ? 0 : 2);

function tierOptions(lang: Lang) {
  return TIER_MODELS.map((t, i) => ({ value: i, text: tierName(lang, t.feeBps) }));
}

function TierControls({ labels, lang }: SceneProps) {
  const tier = useFees((s) => s.tier);
  const setTier = useFees((s) => s.setTier);
  const f = formats(lang);
  const t = TIER_MODELS[tier];
  return (
    <div className="ctl v3c" style={{ width: 'min(440px, calc(100vw - 46px))', gap: '4px 12px' }}>
      <Phone />
      <div className="ctl-title">{labels.tryTier}</div>
      <Seg label={labels.tier} value={tier} onPick={setTier} options={tierOptions(lang)} />
      <div className="ctl-stats" style={{ gap: '2px 12px' }}>
        <Stat name={labels.spacing}>{t.spacing}</Stat>
        <Stat name={labels.boundStep}>{f.pct((1.0001 ** t.spacing - 1) * 100, 2)}</Stat>
        <Stat name={labels.feeOn}>{f.dec((CAPITAL * t.feeBps) / 10_000, 0)} USDC</Stat>
      </div>
    </div>
  );
}

function DayControls({ labels, lang }: SceneProps) {
  const { tier, width, path, setTier, setWidth, setPath } = useFees();
  const f = formats(lang);
  const model = TIER_MODELS[tier];
  const day = simulateDay(model, width, path);
  const wide = simulateDay(model, WIDTH_MAX, path);
  const names: Record<PathKind, string> = { calm: labels.pathCalm, trend: labels.pathTrend, volatile: labels.pathVolatile };
  return (
    <div className="ctl v3c" style={{ width: 'min(560px, calc(100vw - 46px))', gap: '4px 10px' }}>
      <Phone />
      <div className="ctl-title">{labels.tryDay}</div>
      <Seg label={labels.tier} value={tier} onPick={setTier} options={tierOptions(lang)} />
      <label className="ctl-field" style={{ minWidth: 120 }}>
        <span>
          {labels.width} ±{f.pct(width)}
        </span>
        <input type="range" style={SLIM} min={WIDTH_MIN} max={WIDTH_MAX} step={WIDTH_STEP} value={width} onChange={(e) => setWidth(+e.target.value)} />
      </label>
      <Seg label={labels.dayKind} value={path} onPick={setPath} options={PATH_KINDS.map((k) => ({ value: k, text: names[k] }))} />
      <div className="ctl-stats" style={{ flexBasis: '100%', gap: '2px 10px' }}>
        <Stat name={labels.timeIn} tone={day.timeInRange >= 0.995 ? 'good' : 'bad'}>
          {f.pct(day.timeInRange * 100, 0)}
        </Stat>
        <Stat name={labels.feesYou} tone="good">
          {f.dec(day.fees, 2)} USDC
        </Stat>
        <Stat name={labels.feesWide}>{f.dec(wide.fees, 2)} USDC</Stat>
        <Stat name={labels.lossHold} tone={day.loss < -0.005 ? 'bad' : undefined}>
          {f.dec(day.loss, 2)} USDC
        </Stat>
      </div>
    </div>
  );
}

function PositionControls({ stepId, labels, lang, reducedMotion }: SceneProps) {
  const { lower, upper, price, setLower, setUpper, setPrice } = usePosition();
  const raf = useRef(0);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const d = derive(lower, upper, price);
  const f = formats(lang);
  const int = f.int;
  const dec = f.dec;
  const field = { minWidth: 88 };
  const leaving = stepId === 'efficiency';
  const pm = positionMove(CAPITAL, ENTRY, lower, upper, price);

  /** Lets the price run to `to`, so the learner watches the position convert on the way. */
  const run = (to: number) => {
    cancelAnimationFrame(raf.current);
    const from = usePosition.getState().price;
    if (reducedMotion || from === to) {
      setPrice(to);
      return;
    }
    const t0 = performance.now();
    const frame = (now: number) => {
      const u = Math.min(1, (now - t0) / 2400);
      setPrice(from + (to - from) * u);
      if (u < 1) raf.current = requestAnimationFrame(frame);
    };
    raf.current = requestAnimationFrame(frame);
  };

  return (
    <div className="ctl v3c" style={{ width: 'min(520px, calc(100vw - 46px))', gap: '4px 10px' }}>
      <Phone />
      <label className="ctl-field" style={field}>
        <span>
          {labels.lower} {int(lower)}
        </span>
        <input type="range" style={SLIM} min={P_MIN} max={P_MAX - BIN} step={BIN} value={lower} onChange={(e) => setLower(+e.target.value)} />
      </label>
      <label className="ctl-field" style={field}>
        <span>
          {labels.price} {int(price)}
        </span>
        <input type="range" style={SLIM} min={P_MIN} max={P_MAX} step={PRICE_STEP} value={price} onChange={(e) => setPrice(+e.target.value)} />
      </label>
      <label className="ctl-field" style={field}>
        <span>
          {labels.upper} {int(upper)}
        </span>
        <input type="range" style={SLIM} min={P_MIN + BIN} max={P_MAX} step={BIN} value={upper} onChange={(e) => setUpper(+e.target.value)} />
      </label>
      {leaving && (
        <div style={{ display: 'flex', gap: 6, flexBasis: '100%' }}>
          <button type="button" className="btn" style={{ flex: 1, minHeight: 32 }} onClick={() => run(Math.max(P_MIN, lower - 200))}>
            ▼ {labels.crash}
          </button>
          <button type="button" className="btn" style={{ flex: 1, minHeight: 32 }} onClick={() => run(ENTRY)}>
            {labels.backTo}
          </button>
          <button type="button" className="btn" style={{ flex: 1, minHeight: 32 }} onClick={() => run(Math.min(P_MAX, upper + 200))}>
            ▲ {labels.rally}
          </button>
        </div>
      )}
      <div className="ctl-stats" style={{ flexBasis: '100%', gap: '2px 8px' }}>
        {!leaving && (
          <div className="ctl-stat">
            <span>{labels.status}</span>
            <strong style={{ ...NUM, color: d.active ? 'var(--c-valid)' : 'var(--c-invalid)' }}>{d.active ? labels.inRange : labels.outRange}</strong>
          </div>
        )}
        {stepId === 'ticks' ? (
          <Stat name={labels.ticks}>
            {d.tickLower} … {d.tickUpper}
          </Stat>
        ) : leaving ? (
          <Stat name={`${labels.holdsNow} · ${d.active ? labels.inRange : labels.outRange}`} tone={d.active ? 'good' : 'bad'}>
            {dec(pm.eth, 2)} ETH + {int(pm.usdc)} USDC
          </Stat>
        ) : (
          <Stat name={labels.holds}>
            {dec(d.eth, 2)} ETH + {int(d.usdc)} USDC
          </Stat>
        )}
        {leaving ? (
          <>
            <Stat name={labels.vsHold} tone={pm.il < -0.00005 ? 'bad' : undefined}>
              {f.pct(pm.il * 100, 2)}
            </Stat>
            <Stat name={labels.v2Same}>{f.pct(pm.v2il * 100, 2)}</Stat>
          </>
        ) : (
          <Stat name={labels.vsV2}>{d.active ? `${dec(d.efficiency, 1)}×` : '0×'}</Stat>
        )}
      </div>
    </div>
  );
}

export function Controls(props: SceneProps) {
  const { stepId } = props;
  if (stepId === 'idle') return <IdleControls {...props} />;
  if (stepId === 'crossing') return <SwapControls {...props} />;
  if (stepId === 'fees-nft') return <TierControls {...props} />;
  if (stepId === 'fee-day') return <DayControls {...props} />;
  if (INTERACTIVE.has(stepId)) return <PositionControls {...props} />;
  return null;
}
