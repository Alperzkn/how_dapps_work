import { useRef, useState, type ReactNode } from 'react';
import type { Group } from 'three';
import { Anim, Ball, Box, Cyl, FlowLine, Label, Mat, Mover, Packet, Person, Platform, ShadowGround, useLoop, type Vec3 } from '../../scene/kit';
import type { SceneProps } from '../../scene/types';
import { capitalEfficiency } from '../../sim/ammV3';
import type { ColorKey } from '../../theme/tokens';
import { BIN, CAPITAL, derive, P_MAX, P_MIN, PRICE_STEP, usePosition, xOf } from './state';

const INTERACTIVE = new Set(['concentrated', 'ticks', 'efficiency']);
const BINS = Array.from({ length: (P_MAX - P_MIN) / BIN }, (_, i) => P_MIN + i * BIN);
const BIN_W = xOf(P_MIN + BIN) - xOf(P_MIN);
const DEPTH = 1.6;
/** Height of a full-range (v2) position of the same value. */
const V2_H = 0.45;
const PILE = 2.3;
/** Price band around the market price where v2's trades actually happen in step 1. */
const BUSY = 150;
const MID = (P_MIN + P_MAX) / 2;
/** The whole stage is turned a little toward the viewer so the price axis reads left to right. */
const TURN = Math.PI / 8;

/** Bar height for a liquidity ratio. A power scale keeps a 150x range on screen. */
const heightOf = (ratio: number) => Math.min(4.6, V2_H * Math.max(1, ratio) ** 0.45);

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

const PROFILE = [0.5, 0.5, 0.9, 0.9, 1.6, 2.4, 3, 3, 2.2, 2.2, 1.4, 1.4, 0.9, 0.5, 0.5, 0.5];
const CW = 0.6;
const C0 = -(PROFILE.length * CW) / 2;
const FROM_BIN = 5;
const TO_BIN = 11;
const START_X = C0 + FROM_BIN * CW + 0.05;
const END_X = C0 + (TO_BIN + 1) * CW - 0.05;
const TICK0 = 75600;
const binAt = (x: number) => Math.min(PROFILE.length - 1, Math.max(0, Math.floor((x - C0) / CW)));

function Crossing({ on, labels }: { on: boolean; labels: Record<string, string> }) {
  const marker = useRef<Group>(null);
  const x = useRef(START_X);
  const rest = useRef(0);
  const shown = useRef(FROM_BIN);
  const [active, setActive] = useState(FROM_BIN);

  useLoop((_, dt) => {
    if (x.current >= END_X) {
      rest.current += dt;
      if (rest.current > 1.8) {
        rest.current = 0;
        x.current = START_X;
      }
    } else {
      // Deeper liquidity means the same trade moves the price less.
      x.current = Math.min(END_X, x.current + (dt * 1.5) / PROFILE[binAt(x.current)]);
    }
    if (marker.current) marker.current.position.x = x.current;
    const i = binAt(x.current);
    if (i !== shown.current) {
      shown.current = i;
      setActive(i);
    }
  }, on);

  const L = Math.round(PROFILE[active] * 1000);
  const tick = TICK0 + active * 60;

  return (
    <>
      <Platform size={[PROFILE.length * CW + 0.6, 2.4]} color="ground" height={0.25} />
      {PROFILE.map((h, i) => (
        <group key={i} position={[C0 + (i + 0.5) * CW, 0, 0]}>
          <Anim scale={[1, h, 1]} speed={5}>
            <Bar w={CW - 0.05} d={DEPTH} color={i < active ? 'tokenB' : 'tokenA'} glow={i === active} />
          </Anim>
          {/* Initialized ticks: boundaries where some position starts or ends. */}
          {i > 0 && PROFILE[i - 1] !== h && <Box size={[0.07, 0.5, 0.07]} position={[-CW / 2, 0.25, DEPTH / 2 + 0.16]} color="ink" radius={0.02} />}
        </group>
      ))}
      <Anim position={[C0 + (active + 0.5) * CW, PROFILE[active] + 0.04, 0]} speed={14}>
        <Box size={[CW - 0.05, 0.08, DEPTH]} color="valid" glow radius={0.02} />
      </Anim>

      <group ref={marker} position={[START_X, 0, DEPTH / 2 + 0.16]}>
        <Box size={[0.08, 4, 0.08]} position={[0, 2, 0]} color="ink" radius={0.02} />
        <Ball radius={0.17} position={[0, 4.1, 0]} color="valid" glow />
        <Label position={[0, 4.7, 0]} maxLevel="beginner">
          {labels.priceNow}
        </Label>
        <Label position={[0, 4.7, 0]} minLevel="intermediate" maxLevel="intermediate">
          {labels.activeRange} · L {L}
        </Label>
        <Label position={[0, 4.75, 0]} minLevel="expert" tone="mono">
          tick ≥ {tick}
          <br />
          liquidity = {L}
        </Label>
      </group>

      <Label position={[C0 + 2 * CW, 1.5, 0]} tone="tokenB">
        {labels.usdcSide}
      </Label>
      <Label position={[C0 + 14.4 * CW, 1.3, 0]} tone="tokenA">
        {labels.ethSide}
      </Label>
      <Label position={[C0 + 8 * CW, -0.2, 2]} minLevel="intermediate" maxLevel="intermediate" tone="plain">
        {labels.tickBoundary}
      </Label>
      <Label position={[C0 + 8 * CW, -0.3, 2.2]} minLevel="expert" tone="mono">
        L ← L + ticks[t].liquidityNet
      </Label>

      {/* The trader pays USDC in and takes ETH out; that is what pushes the price up. */}
      <group position={[-3.2, 0, 3.4]} rotation={[0, 0.6, 0]}>
        <Person color="actor" />
      </group>
      <Label position={[-3.2, 1.75, 3.4]} tone="actor">
        {labels.trader}
      </Label>
      <Mover path={SWAP_IN} duration={1.5} arc={0.9} playing={on}>
        <Packet color="tokenB" size={0.3} />
      </Mover>
      <Mover path={SWAP_OUT} duration={1.5} delay={0.95} arc={0.9} playing={on}>
        <Packet color="tokenA" size={0.3} />
      </Mover>
    </>
  );
}

const SWAP_IN: Vec3[] = [
  [-3.2, 0.8, 3.2],
  [-0.6, 1.2, 0.9],
];
const SWAP_OUT: Vec3[] = [
  [0.4, 1.2, 0.9],
  [-2.8, 0.8, 3.6],
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

function Tiers({ labels }: { labels: Record<string, string> }) {
  return (
    <>
      {TIERS.map((t, ti) => {
        const w = TIER_W / t.bins.length;
        const at = (i: number) => -TIER_W / 2 + (i + 0.5) * w;
        return (
          <group key={t.fee} position={[t.x, 0, 0]}>
            <Platform size={[TIER_W + 0.6, 2.6]} color="ground" height={0.25} />
            {t.bins.map((h, i) => (
              <group key={i} position={[at(i), 0, -0.3]} scale={[1, h, 1]}>
                <Bar w={w - 0.04} d={1.2} color={i < t.bins.length / 2 ? 'tokenB' : 'tokenA'} />
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
            <Label position={[0, -0.3, 1.9]} maxLevel="beginner">
              {t.fee}
              <br />
              {labels[t.use]}
            </Label>
            <Label position={[0, -0.4, 1.9]} minLevel="intermediate">
              {t.fee} · {labels[t.use]}
              <br />
              tickSpacing {t.spacing}
            </Label>
          </group>
        );
      })}
      <Label position={[0, 4.6, 0]} maxLevel="beginner" tone="actor">
        {labels.nftCaption}
      </Label>
      <Label position={[0.3, 4.5, 0.6]} minLevel="expert" tone="mono">
        NonfungiblePositionManager
        <br />
        ERC-721 · positions[tokenId] →
        <br />
        (tickLower, tickUpper, liquidity)
      </Label>
    </>
  );
}

/* ---------- The scene ---------- */

export default function Scene({ stepId, labels, lang }: SceneProps) {
  const pos = usePosition();
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
  const busyShare = 100 / capitalEfficiency(MID, MID - BUSY, MID + BUSY);
  const v3Capital = d.efficiency > 0 ? CAPITAL / d.efficiency : 0;
  const locale = lang === 'tr' ? 'tr-TR' : 'en-US';
  const fmt = (n: number) => Math.round(n).toLocaleString(locale);
  const one = (n: number) => n.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <>
      <ShadowGround />
      <group rotation={[0, TURN, 0]}>
      {/* Steps 1, 2, 3, 6: one price axis, liquidity drawn as bins standing on it. */}
      <Anim show={showRow}>
        <Platform size={[12.7, 2.5]} color="ground" height={0.25} />
        {BINS.map((lo) => {
          const mid = lo + BIN / 2;
          const on = flat || (lo >= lower && lo < upper);
          const busy = !flat || Math.abs(mid - price) <= BUSY;
          const here = price >= lo && price < lo + BIN;
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
        <Label position={[-3.8, V2_H + 0.6, 0]} show={flat}>
          {labels.idle}
        </Label>
        <Label position={[3.8, V2_H + 0.6, 0]} show={flat}>
          {labels.idle}
        </Label>
        <Label position={[1.2, -0.3, 2.2]} show={flat} minLevel="intermediate" tone="valid">
          {labels.busy} {lang === 'tr' ? `%${one(busyShare)}` : `${one(busyShare)}%`}
        </Label>
        <Label position={[-3.4, 2.4, -1]} show={flat} minLevel="expert" tone="mono">
          x · y = k &nbsp; p ∈ (0, ∞)
        </Label>
        <Anim show={flat} position={[0, 0, 0]}>
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
        <Crossing on={stepId === 'crossing'} labels={labels} />
      </Anim>

      <Anim show={stepId === 'fees-nft'}>
        <Tiers labels={labels} />
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

export function Controls({ stepId, labels, lang }: SceneProps) {
  const { lower, upper, price, setLower, setUpper, setPrice } = usePosition();
  if (!INTERACTIVE.has(stepId)) return null;
  const d = derive(lower, upper, price);
  const locale = lang === 'tr' ? 'tr-TR' : 'en-US';
  const int = (n: number) => Math.round(n).toLocaleString(locale);
  const dec = (n: number, digits: number) => n.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const field = { minWidth: 88 };
  const num = { fontSize: '0.8rem' };
  const slim = { height: 22 };
  return (
    <div className="ctl" style={{ width: 'min(520px, calc(100vw - 46px))', gap: '4px 10px' }}>
      <label className="ctl-field" style={field}>
        <span>
          {labels.lower} {int(lower)}
        </span>
        <input type="range" style={slim} min={P_MIN} max={P_MAX - BIN} step={BIN} value={lower} onChange={(e) => setLower(+e.target.value)} />
      </label>
      <label className="ctl-field" style={field}>
        <span>
          {labels.price} {int(price)}
        </span>
        <input type="range" style={slim} min={P_MIN} max={P_MAX} step={PRICE_STEP} value={price} onChange={(e) => setPrice(+e.target.value)} />
      </label>
      <label className="ctl-field" style={field}>
        <span>
          {labels.upper} {int(upper)}
        </span>
        <input type="range" style={slim} min={P_MIN + BIN} max={P_MAX} step={BIN} value={upper} onChange={(e) => setUpper(+e.target.value)} />
      </label>
      <div className="ctl-stats" style={{ flexBasis: '100%', gap: '2px 8px' }}>
        <div className="ctl-stat">
          <span>{labels.status}</span>
          <strong style={{ ...num, color: d.active ? 'var(--c-valid)' : 'var(--c-invalid)' }}>{d.active ? labels.inRange : labels.outRange}</strong>
        </div>
        {stepId === 'ticks' ? (
          <div className="ctl-stat">
            <span>{labels.ticks}</span>
            <strong style={num}>
              {d.tickLower} … {d.tickUpper}
            </strong>
          </div>
        ) : (
          <div className="ctl-stat">
            <span>{labels.holds}</span>
            <strong style={num}>
              {dec(d.eth, 2)} ETH + {int(d.usdc)} USDC
            </strong>
          </div>
        )}
        <div className="ctl-stat">
          <span>{labels.vsV2}</span>
          <strong style={num}>{d.active ? `${dec(d.efficiency, 1)}×` : '0×'}</strong>
        </div>
      </div>
    </div>
  );
}
