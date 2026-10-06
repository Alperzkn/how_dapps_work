import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Group } from 'three';
import { Anim, Ball, Box, Cyl, FlowLine, Label, NodeTower, Packet, Person, Platform, PoolBasin, Screen, ShadowGround, ValidatorPillar, useLevel, useLoop, useScene, type Vec3 } from '../../scene/kit';
import type { SceneProps } from '../../scene/types';
import type { Lang } from '../../types';
import { blockAuction, optimalArb, runOrder, sandwich, splitTrade, type Reserves } from './logic';
import { BLOCK_VALUE, DEPTHS, GAME_POOL, GAME_TXS, GAS, MARKET, OTHER_TIPS, PARTS, PRICE, sandwichInput, TIP, TOL, TRADE, useMev } from './state';

/* The stage is turned to face the camera: local x runs left to right, z toward the viewer. */
const TURN = Math.PI / 4;
const YOU: Vec3 = [-7.2, 0, 1.7];
const TRAY: Vec3 = [-4.5, 0, 0.3];
const BOT: Vec3 = [-4.5, 0, -2.7];
const BLOCK: Vec3 = [0.3, 0, 0];
const POOL: Vec3 = [5, 0, 0];
const GAUGE: Vec3 = [4.6, 0, 0];
const MARKET_AT: Vec3 = [8.2, 0, 0];
const SLOT_X = [-1.45, 0, 1.45];
/** Fill height of a pool side at its starting reserve, and how much changes are magnified. */
const LEVEL = 0.7;
const MAGNIFY = 8;
/** World height of one percent on the slippage gauge. */
const PCT_H = 0.4;
const GAUGE_TOP = 1.1 + TOL.max * PCT_H;

const locale = (lang: Lang) => (lang === 'tr' ? 'tr-TR' : 'en-US');
function num(n: number, digits: number, lang: Lang): string {
  const v = Number.isFinite(n) ? n : 0;
  const shown = Math.abs(v) < 0.5 / 10 ** digits ? 0 : v;
  return shown.toLocaleString(locale(lang), { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
const usd = (n: number, lang: Lang) => num(n, 0, lang);
const eth = (n: number, lang: Lang) => num(n, Math.abs(n) >= 100 ? 2 : 3, lang);
const pct = (fraction: number, digits: number, lang: Lang) => (lang === 'tr' ? `%${num(fraction * 100, digits, lang)}` : `${num(fraction * 100, digits, lang)}%`);
const signed = (fraction: number, lang: Lang) => `${fraction > 0.00005 ? '+' : fraction < -0.00005 ? '−' : ''}${pct(Math.abs(fraction), 2, lang)}`;
const depthText = (usdc: number, lang: Lang) => `${num(usdc / 1e6, usdc < 1e6 ? 1 : 0, lang)}M`;

/** A number that glides to its target, so pool levels rise and fall instead of jumping. */
function useEased(target: number): number {
  const { reducedMotion } = useScene();
  const cur = useRef(target);
  const [value, setValue] = useState(target);
  useLoop((_, dt) => {
    const d = target - cur.current;
    if (d === 0) return;
    cur.current = Math.abs(d) < 0.003 ? target : cur.current + d * (1 - Math.exp(-dt * 7));
    setValue(cur.current);
  });
  return reducedMotion ? target : value;
}

const levelOf = (now: number, start: number) => Math.min(1.35, Math.max(0.12, LEVEL * (1 + MAGNIFY * (start > 0 ? now / start - 1 : 0))));

function Pool({ ethNow, ethStart, usdcNow, usdcStart }: { ethNow: number; ethStart: number; usdcNow: number; usdcStart: number }) {
  const a = useEased(levelOf(ethNow, ethStart));
  const b = useEased(levelOf(usdcNow, usdcStart));
  return <PoolBasin width={3} depth={1.9} wall={1.5} a={a} b={b} />;
}

function Bob({ children, amount = 0.08, speed = 2.2, phase = 0 }: { children: ReactNode; amount?: number; speed?: number; phase?: number }) {
  const ref = useRef<Group>(null);
  useLoop((t) => {
    if (ref.current) ref.current.position.y = Math.sin(t * speed + phase) * amount;
  });
  return <group ref={ref}>{children}</group>;
}

/** A searcher's bot: a box on legs with one eye that lights up when it has found something. */
function Bot({ alert }: { alert: boolean }) {
  return (
    <group>
      <Box size={[0.9, 0.8, 0.7]} position={[0, 0.65, 0]} color="contract" radius={0.12} />
      <Box size={[0.2, 0.3, 0.2]} position={[-0.25, 0.15, 0]} color="chain" radius={0.04} />
      <Box size={[0.2, 0.3, 0.2]} position={[0.25, 0.15, 0]} color="chain" radius={0.04} />
      <Box size={[0.6, 0.42, 0.5]} position={[0, 1.27, 0]} color="contract" radius={0.1} />
      <Ball key={alert ? 'on' : 'off'} radius={0.13} position={[0, 1.27, 0.27]} color={alert ? 'invalid' : 'platform'} glow={alert} />
      <Cyl radius={0.025} height={0.3} position={[0.18, 1.62, 0]} color="chain" segments={8} />
      <Ball radius={0.06} position={[0.18, 1.8, 0]} color={alert ? 'invalid' : 'chain'} />
    </group>
  );
}

const TRAY_BITS: [number, number][] = [
  [-1.1, -0.55],
  [0.9, -0.6],
  [1.15, 0.5],
  [-0.2, -0.75],
];

/** The gauge on the slippage step: the gap between the quote and the minimum, and how much of it is taken. */
function Gauge({ tol, loss, attacked, labels, lang, clean, minOut }: { tol: number; loss: number; attacked: boolean; labels: Record<string, string>; lang: Lang; clean: number; minOut: number }) {
  const nums = useLevel().atLeast('intermediate');
  const { compact } = useScene();
  const got = GAUGE_TOP - loss * 100 * PCT_H;
  const line = GAUGE_TOP - tol * PCT_H;
  const cut = Math.max(GAUGE_TOP - got, 0.001);
  return (
    <group>
      <Platform size={[1.6, 1.4]} color="ground" height={0.2} />
      <Anim scale={[1, got, 1]} speed={10}>
        <Box size={[0.8, 1, 0.8]} position={[0, 0.5, 0]} color="tokenA" radius={0.02} />
      </Anim>
      <Anim position={[0, got, 0]} scale={[1, cut, 1]} show={attacked} speed={10}>
        <Box size={[0.8, 1, 0.8]} position={[0, 0.5, 0]} color="invalid" glow opacity={0.8} radius={0.01} />
      </Anim>
      {/* The floor of the gap: amountOutMin. */}
      <Anim position={[0, line, 0]} speed={10}>
        <Box size={[1.25, 0.07, 1.25]} color="ink" radius={0.02} />
        <Label position={[2.3, -0.3, 0]} show={!compact} maxLevel="intermediate" tone="plain">
          {labels.minLine}
        </Label>
        <Label position={[2.3, -0.3, 0]} show={!compact} minLevel="expert" tone="mono">
          amountOutMin {eth(minOut, lang)}
        </Label>
      </Anim>
      <Box size={[1.25, 0.05, 1.25]} position={[0, GAUGE_TOP, 0]} color="chain" radius={0.02} />
      <Label position={[0, GAUGE_TOP + 0.6, 0]} tone="tokenA">
        {labels.quote}
        {nums && (<> {eth(clean, lang)} ETH</>)}
      </Label>
    </group>
  );
}

/* ---------- The last step: who builds the block ---------- */

/** Builders stand in a row; index 0, the winner, is nearest the relay. */
const B_X = [0.4, -1.2, -2.8, -4.4];
const RELAY: Vec3 = [3.2, 0, 0];
const PROPOSER: Vec3 = [6.4, 0, 0];
const FLOW: Vec3[] = [
  [-5.5, 0.6, 0.9],
  [-5.05, 0.6, 0.9],
];
const WIN_PATH: Vec3[] = [
  [B_X[0] + 0.7, 0.6, 0.4],
  [RELAY[0] - 0.9, 0.6, 0.4],
];
const OUT_PATH: Vec3[] = [
  [RELAY[0] + 0.9, 0.6, 0.4],
  [PROPOSER[0] - 0.8, 0.6, 0.4],
];
const LOCAL_PATH: Vec3[] = [
  [-6.3, 0.5, 1.2],
  [PROPOSER[0] - 0.8, 0.5, 1.2],
];

function Supply({ labels, lang, on }: { labels: Record<string, string>; lang: Lang; on: boolean }) {
  const { blockValue, builders, boost } = useMev();
  const nums = useLevel().atLeast('intermediate');
  const { compact } = useScene();
  const a = blockAuction(blockValue, builders, boost);
  const bar = (v: number) => Math.max(0.05, v * 2.4);
  return (
    <>
      <Platform size={[15.4, 3.4]} position={[-0.2, 0, 0]} color="ground" height={0.2} />
      {/* Order flow: users and searchers. */}
      <group position={[-6.9, 0, -0.4]}>
        <Bot alert={on} />
      </group>
      <group position={[-5.9, 0, 0.9]}>
        <Person color="actor" />
      </group>
      <Label position={[-6.4, 2.5, -0.4]} tone="plain">
        {labels.searchers}
      </Label>
      <Label position={[-6.3, -0.5, 1.6]} tone="actor">
        {labels.users}
      </Label>
      <Anim show={boost}>
        <FlowLine points={FLOW} color="chain" dashed width={2} />
      </Anim>

      {B_X.map((x, i) => {
        const active = boost && i < builders;
        const h = bar(a.bids[i] ?? 0);
        return (
          <Anim key={i} position={[x, 0, 0]} show={active} speed={7}>
            <NodeTower units={2} color={i === 0 ? 'block' : 'neutral'} glow={i === 0} />
            <Anim position={[0, 0.92, 0]} scale={[1, h, 1]} speed={9}>
              <Box size={[0.5, 1, 0.5]} position={[0, 0.5, 0]} color={i === 0 ? 'valid' : 'chain'} radius={0.02} />
            </Anim>
            <Anim position={[0, 0.92 + h, 0]} speed={9}>
              <Label position={[0, 0.45, 0]} minLevel="intermediate" tone={i === 0 ? 'valid' : 'plain'}>
                {num(a.bids[i] ?? 0, 3, lang)}
              </Label>
            </Anim>
          </Anim>
        );
      })}
      <Label position={[-1.6, -0.5, 1.6]} show={boost} tone="block">
        {labels.builders}
        {nums && !compact && ' (ETH)'}
      </Label>

      <Anim position={RELAY} show={boost}>
        <Cyl radius={0.7} height={0.9} position={[0, 0.45, 0]} color="contract" />
        <Cyl radius={0.5} height={0.2} position={[0, 1, 0]} color="platform" />
        <Bob amount={0.06}>
          <group position={[0, 1.15, 0]}>
            <Packet color="block" size={0.42} />
          </group>
        </Bob>
        <Label position={[0, -0.5, 1.6]} tone="plain">
          {labels.relay}
        </Label>
        <Label position={[0, 2.5, 0]} show={!compact} minLevel="expert" tone="mono">
          getHeader → signed
          <br />
          blinded block → payload
        </Label>
      </Anim>
      <Anim show={boost}>
        <FlowLine points={WIN_PATH} color="valid" width={3} />
        <FlowLine points={OUT_PATH} color="valid" width={3} />
      </Anim>
      <Anim show={!boost}>
        <FlowLine points={LOCAL_PATH} color="tx" dashed width={2.5} />
        <Label position={[-1, 1.5, 1.2]} tone="tx">
          {labels.localBuild}
        </Label>
      </Anim>

      <group position={PROPOSER}>
        <ValidatorPillar stake={Math.min(8, Math.max(1, Math.round(a.proposer * 8)))} glow />
        <Label position={[0, -0.5, 1.6]} tone="actor">
          {labels.proposer}
        </Label>
        <Label position={[0, 3.1, 0]} minLevel="intermediate" tone="valid">
          +{num(a.proposer, 3, lang)} ETH
        </Label>
      </group>
    </>
  );
}

/* ---------- The scene ---------- */

export default function Scene({ stepId, labels, lang }: SceneProps) {
  const s = useMev();
  const { compact } = useScene();
  const nums = useLevel().atLeast('intermediate');
  const isMempool = stepId === 'mempool';
  const isOrder = stepId === 'ordering';
  const isArb = stepId === 'backrun';
  const isSandwich = stepId === 'sandwich';
  const isSlip = stepId === 'slippage';
  const isDef = stepId === 'defences';
  const isPbs = stepId === 'pbs';
  const attackSteps = isSandwich || isSlip || isDef;

  const input = sandwichInput(s);
  const sw = useMemo(() => sandwich(input), [input.rIn, input.victimIn, input.tolerance, input.gas]);
  const split = useMemo(() => splitTrade(input, s.parts, s.isPrivate), [input.rIn, input.victimIn, input.tolerance, input.gas, s.parts, s.isPrivate]);
  const part = useMemo(() => sandwich({ ...input, victimIn: input.victimIn / s.parts }), [input.rIn, input.victimIn, input.tolerance, input.gas, s.parts]);
  const game = useMemo(() => runOrder(GAME_POOL.eth, GAME_POOL.usdc, GAME_TXS, s.order), [s.order]);
  const arb = useMemo(() => optimalArb(GAME_POOL.eth, GAME_POOL.usdc, s.market), [s.market]);

  // What the pool holds in this step. Reserves are (USDC, ETH) as (rIn, rOut).
  const base: Reserves = { rIn: input.rIn, rOut: input.rOut };
  const gameBase: Reserves = { rIn: GAME_POOL.usdc, rOut: GAME_POOL.eth };
  let start = base;
  let now = base;
  if (isOrder) {
    start = gameBase;
    now = { rIn: game.usdc, rOut: game.eth };
  } else if (isArb) {
    start = gameBase;
    now = s.arbDone ? { rIn: arb.usdc, rOut: arb.eth } : gameBase;
  } else if (isSandwich) {
    now = sw.stages[s.stage] ?? base;
  } else if (isSlip) {
    now = sw.stages[3];
  } else if (isDef) {
    const hit = split.attacks > 0;
    now = hit ? part.stages[3] : sandwich({ ...input, victimIn: input.victimIn / s.parts, tolerance: 0 }).stages[3];
  }
  const poolPrice = now.rOut > 0 ? now.rIn / now.rOut : 0;

  const attacked = isDef ? split.attacks > 0 : sw.attacked;
  const txVisible = isMempool || ((isSandwich || isSlip) && true) || (isDef && !s.isPrivate);
  const botAlert = isMempool ? sw.attacked : isArb ? arb.dir !== 'none' && !s.arbDone : attackSteps ? attacked : false;
  const txSize = 0.3 + 0.3 * Math.sqrt(s.trade / TRADE.max) * (isDef ? 1 / Math.sqrt(s.parts) : 1);
  const eye = useMemo<Vec3[]>(() => [[BOT[0], 1.27, BOT[2] + 0.3], [TRAY[0] + 0.1, 0.5, TRAY[2] + 0.1]], []);
  const tunnel = useMemo<Vec3[]>(() => [[YOU[0] + 0.5, 0.7, YOU[2] + 0.4], [-3, 0.7, 3.1], [BLOCK[0] - 0.4, 0.7, 1.3]], []);
  const names = [labels.nameYou, labels.nameB, labels.nameC];
  const tips = [s.tip, ...OTHER_TIPS];
  const lossFrac = sw.cleanOut > 0 ? sw.victimLoss / sw.cleanOut : 0;
  const stageSlot = isSandwich && s.stage > 0 ? s.stage - 1 : -1;

  return (
    <>
      <ShadowGround />
      <group rotation={[0, TURN, 0]}>
        <Anim show={!isPbs}>
          {/* You and the public mempool. */}
          <Anim position={YOU} show={!isOrder && !isArb}>
            <Person color="actor" glow />
            <Label position={[0, 1.9, 0]} tone="actor">
              {labels.nameYou}
            </Label>
          </Anim>
          <Anim position={TRAY} show={!isOrder && !isArb}>
            <Platform size={[3.6, 2.5]} position={[0, 0.2, 0]} color="ground" height={0.2} />
            <Box size={[3.6, 0.3, 0.12]} position={[0, 0.35, -1.25]} color="neutral" radius={0.04} />
            <Box size={[0.12, 0.3, 2.5]} position={[-1.8, 0.35, 0]} color="neutral" radius={0.04} />
            <Box size={[0.12, 0.3, 2.5]} position={[1.8, 0.35, 0]} color="neutral" radius={0.04} />
            {TRAY_BITS.map(([x, z], i) => (
              <Box key={i} size={[0.26, 0.26, 0.26]} position={[x, 0.33, z]} color="neutral" radius={0.06} />
            ))}
            <Anim position={[0.1, 0.2, 0.1]} show={txVisible} scale={txSize / 0.4} speed={9}>
              <Bob>
                <Packet color="tx" size={0.4} />
              </Bob>
              <Label position={[0, 1.15, 0]} tone="tx" show={isMempool}>
                {labels.pending}
              </Label>
            </Anim>
            <Label position={[0, -0.25, 2]} tone="plain">
              {labels.mempool}
            </Label>
            <Anim show={isDef && s.isPrivate}>
              <Label position={[0.3, 1.5, 0]} tone="valid">
                {labels.hidden}
              </Label>
            </Anim>
          </Anim>

          {/* The searcher's bot watches the mempool. */}
          <Anim position={isArb ? [-3.6, 0, 0] : BOT} show={!isOrder}>
            <Bot alert={botAlert} />
            <Label position={[0, 2.35, 0]} tone={botAlert ? 'invalid' : 'plain'}>
              {labels.bot}
            </Label>
          </Anim>
          <Anim show={!isOrder && !isArb && txVisible}>
            <FlowLine key={botAlert ? 'a' : 'b'} points={eye} color={botAlert ? 'invalid' : 'chain'} dashed width={2} />
            <Label position={[-5.6, 1.3, -1.3]} show={isMempool} minLevel="expert" tone="mono">
              eth_subscribe("newPendingTransactions")
            </Label>
          </Anim>

          {/* Step 6: a private route skips the mempool. */}
          <Anim show={isDef && s.isPrivate}>
            <FlowLine points={tunnel} color="valid" curved width={5} />
            <Label position={[-3, 0.1, 3.9]} tone="valid">
              {labels.tunnel}
            </Label>
          </Anim>

          {/* The block being built: three slots, filled left to right. */}
          <group position={BLOCK}>
            <Box size={[4.7, 0.3, 1.9]} position={[0, 0.15, 0]} color="block" radius={0.1} />
            {SLOT_X.map((x, i) => (
              <group key={i} position={[x, 0.3, 0]}>
                <Box size={[1.2, 0.08, 1.4]} position={[0, 0.04, 0]} color={i === stageSlot ? 'valid' : 'platform'} glow={i === stageSlot} radius={0.03} />
              </group>
            ))}
            <Label position={[0, -0.35, 1.7]} tone="block" show={!isOrder}>
              {isMempool ? labels.nextBlock : labels.block}
            </Label>
            <Label position={[SLOT_X[0], -0.3, 1.5]} tone="plain" show={isOrder}>
              {labels.first}
            </Label>
            <Label position={[SLOT_X[2], -0.3, 1.5]} tone="plain" show={isOrder}>
              {labels.last}
            </Label>

            {/* Step 2: the three pending swaps, in the order chosen. */}
            {GAME_TXS.map((tx, i) => {
              const at = Math.max(0, s.order.indexOf(i));
              const fill = game.fills[i];
              return (
                <Anim key={i} position={[SLOT_X[at], 0.38, 0]} show={isOrder} speed={8}>
                  <Packet color={i === 0 ? 'tx' : 'neutral'} size={i === 0 ? 0.6 : 0.5} glow={i === 0} />
                  <Label position={[0, at === 1 ? 2.55 : 1.4, 0]} tone={i === 0 ? 'tx' : 'plain'}>
                    {names[i]}
                    <br />
                    {tx.kind === 'buy' ? `${eth(fill.out, lang)} ETH` : `${usd(fill.out, lang)} USDC`}
                    {s.byTip && (
                      <span>
                        <br />
                        {num(tips[i], 1, lang)} gwei
                      </span>
                    )}
                  </Label>
                </Anim>
              );
            })}

            {/* Step 3: a big swap, then the back-run right behind it. */}
            <Anim position={[SLOT_X[0], 0.38, 0]} show={isArb}>
              <Packet color="tx" size={0.6} glow={false} />
              <Label position={[0, 1.2, 0]} tone="tx">
                {labels.bigSwap}
              </Label>
            </Anim>
            <Anim position={[SLOT_X[1], 0.38, 0]} show={isArb && s.arbDone}>
              <Packet color="valid" size={0.5} />
              <Label position={[0, 1.2, 0]} tone="valid">
                {labels.back}
              </Label>
            </Anim>

            {/* Steps 4 to 6: front-run, your swap, back-run. */}
            <Anim position={[SLOT_X[0], 0.38, 0]} show={attackSteps && attacked}>
              <Packet color="invalid" size={0.5} />
              <Label position={[0, 1.2, 0]} tone="invalid">
                {labels.front}
              </Label>
            </Anim>
            <Anim position={[SLOT_X[1], 0.38, 0]} show={attackSteps} scale={txSize / 0.4} speed={9}>
              <Packet color="tx" size={0.4} />
            </Anim>
            <Anim position={[SLOT_X[1], 0.38, 0]} show={attackSteps}>
              <Label position={[0, 2.35, 0]} tone="tx">
                {isDef && s.parts > 1 ? `${labels.yourSwap} 1/${s.parts}` : labels.yourSwap}
              </Label>
            </Anim>
            <Anim position={[SLOT_X[2], 0.38, 0]} show={attackSteps && attacked}>
              <Packet color="invalid" size={0.5} />
              <Label position={[0, 1.2, 0]} tone="invalid">
                {labels.back}
              </Label>
            </Anim>
            <Label position={[0, 3.3, 0]} tone="valid" show={attackSteps && !attacked && !(isDef && s.isPrivate)}>
              {labels.noAttack}
            </Label>
            <Label position={[0, -1.1, 2.6]} show={(isSandwich || isSlip) && !compact} minLevel="expert" tone="mono">
              bundle: [front-run, victim tx, back-run]
            </Label>
          </group>

          {/* The pool. Its two levels are the reserves, with changes magnified. */}
          <Anim position={POOL} scale={isOrder || isArb ? 1 : 0.8 + 0.08 * s.depthIndex} show={!isSlip} speed={8}>
            <Platform size={[4, 2.9]} color="ground" height={0.2} />
            <Pool ethNow={now.rOut} ethStart={start.rOut} usdcNow={now.rIn} usdcStart={start.rIn} />
          </Anim>
          <Anim position={POOL} show={!isSlip}>
            <Label position={[-1.2, 2.5, 0]} tone="tokenA">
              ETH
              {nums && !compact && ` ${num(now.rOut, 1, lang)}`}
            </Label>
            <Label position={[1.5, 2.2, 0]} tone="tokenB">
              USDC
              {nums && !compact && ` ${usd(now.rIn, lang)}`}
            </Label>
            <Label position={[0, -0.45, 1.9]} tone={Math.abs(poolPrice - PRICE) > 0.5 ? 'invalid' : 'default'}>
              {labels.poolPrice} {usd(poolPrice, lang)}
            </Label>
            <Label position={[0, -1.1, 1.9]} show={!isMempool && !compact} minLevel="intermediate" maxLevel="intermediate" tone="plain">
              {labels.magnified}
            </Label>
          </Anim>

          {/* Step 3: the outside market the pool is compared with. */}
          <Anim position={MARKET_AT} show={isArb}>
            <Screen face={arb.dir === 'none' || s.arbDone ? 'valid' : 'tx'} glow />
            <Label position={[0.3, 3, 0]} tone="plain">
              {labels.market} {usd(s.market, lang)}
            </Label>
          </Anim>
          <Label position={[1.2, 3.4, 0]} show={isArb} minLevel="expert" tone="mono">
            Δx = (√(γ·x·y / P) − x) / γ
          </Label>

          {/* Step 5: the gap you leave open. */}
          <Anim position={GAUGE} show={isSlip}>
            <Gauge tol={s.tol} loss={lossFrac} attacked={sw.attacked} labels={labels} lang={lang} clean={sw.cleanOut} minOut={sw.minOut} />
          </Anim>
        </Anim>

        <Anim show={isPbs}>
          <Supply labels={labels} lang={lang} on={isPbs} />
        </Anim>
      </group>
    </>
  );
}

/* ---------- Controls ---------- */

/** True on a phone-width screen, where the panel has to stay low so the scene remains visible. */
function useCompact(): boolean {
  const query = '(max-width: 639px)';
  const [compact, setCompact] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setCompact(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return compact;
}

function Stat({ name, tone, children }: { name: string; tone?: 'good' | 'bad'; children: ReactNode }) {
  return (
    <div className="ctl-stat" style={{ display: 'flex', alignItems: 'baseline', gap: 5, whiteSpace: 'nowrap' }}>
      <span>{name}</span>
      <strong data-tone={tone} style={{ fontSize: '0.82rem' }}>
        {children}
      </strong>
    </div>
  );
}

function Slider({ id, name, value, min, max, step, onChange }: { id: string; name: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="ctl-field" style={{ minWidth: 118, gap: 0 }}>
      <span style={{ whiteSpace: 'nowrap' }}>{name}</span>
      <input id={id} type="range" style={{ height: 22 }} min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

const STATS = { flexBasis: '100%', gap: '1px 12px' } as const;
const CHECK = { minHeight: 28, fontSize: '0.8rem', gap: 6 } as const;
const SMALL_BTN = { minHeight: 28, padding: '0 7px' } as const;

export function Controls({ stepId, labels, lang }: SceneProps) {
  const s = useMev();
  const compact = useCompact();
  const input = sandwichInput(s);
  const sw = sandwich(input);
  const impact = sw.cleanOut > 0 ? 1 - sw.cleanOut / (input.victimIn / PRICE) : 0;
  const panel = { gap: compact ? '2px 10px' : '4px 12px', width: 'min(560px, calc(100vw - 42px))' };
  // The prompt line is dropped on a phone: the step text says the same and the scene needs the room.
  const title = (text: string) => (compact ? null : <div className="ctl-title">{text}</div>);

  const tradeSlider = <Slider id="mev-trade" name={`${labels.cTrade}: ${usd(s.trade, lang)} USDC`} value={s.trade} {...TRADE} onChange={(v) => s.set({ trade: v })} />;

  if (stepId === 'mempool') {
    return (
      <div className="ctl" style={panel}>
        {title(labels.tMempool)}
        {tradeSlider}
        <div className="ctl-stats" style={STATS}>
          {!compact && (
            <Stat name={labels.cReads}>
              {usd(s.trade, lang)} USDC → ETH
            </Stat>
          )}
          <Stat name={labels.cMinOut}>{eth(sw.minOut, lang)} ETH</Stat>
          <Stat name={labels.cImpact}>{pct(impact, 2, lang)}</Stat>
          <Stat name={labels.cWorth} tone={sw.attacked ? 'bad' : 'good'}>
            {sw.attacked ? `${labels.yes} (≈ ${usd(sw.net, lang)} USDC)` : labels.no}
          </Stat>
        </div>
      </div>
    );
  }

  if (stepId === 'ordering') {
    const game = runOrder(GAME_POOL.eth, GAME_POOL.usdc, GAME_TXS, s.order);
    const first = runOrder(GAME_POOL.eth, GAME_POOL.usdc, GAME_TXS, [0]).fills[0].out;
    const mine = game.fills[0].out;
    const diff = first > 0 ? mine / first - 1 : 0;
    const names = [labels.nameYou, labels.nameB, labels.nameC];
    return (
      <div className="ctl" style={panel}>
        {title(labels.tOrder)}
        <div style={{ display: 'flex', gap: compact ? 4 : 8, flexBasis: '100%' }}>
          {s.order.map((i, at) => (
            <div key={i} data-slot={at} style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: compact ? '0.72rem' : '0.8rem', fontWeight: 600, flex: 1, whiteSpace: 'nowrap', minWidth: 0 }}>
              <button type="button" className="btn" style={SMALL_BTN} disabled={s.byTip || at === 0} aria-label={`${names[i]}: ${labels.cEarlier}`} title={labels.cEarlier} onClick={() => s.moveTx(at, -1)}>
                ↑
              </button>
              <button type="button" className="btn" style={SMALL_BTN} disabled={s.byTip || at === s.order.length - 1} aria-label={`${names[i]}: ${labels.cLater}`} title={labels.cLater} onClick={() => s.moveTx(at, 1)}>
                ↓
              </button>
              <span style={{ marginLeft: 3, color: i === 0 ? 'var(--accent)' : undefined }}>
                {at + 1}. {names[i]}
              </span>
            </div>
          ))}
        </div>
        <label className="ctl-check" style={CHECK}>
          <input id="mev-bytip" type="checkbox" checked={s.byTip} onChange={(e) => s.setByTip(e.target.checked)} />
          {labels.cByTip}
        </label>
        <Slider id="mev-tip" name={`${labels.cTip}: ${num(s.tip, 1, lang)} gwei`} value={s.tip} {...TIP} onChange={s.setTip} />
        <div className="ctl-stats" style={STATS}>
          <Stat name={labels.cYouGet}>{eth(mine, lang)} ETH</Stat>
          <Stat name={labels.cVsFirst} tone={diff < -0.00005 ? 'bad' : 'good'}>
            {signed(diff, lang)}
          </Stat>
          {!compact && <Stat name={labels.cYourSlot}>{s.order.indexOf(0) + 1} / 3</Stat>}
        </div>
      </div>
    );
  }

  if (stepId === 'backrun') {
    const arb = optimalArb(GAME_POOL.eth, GAME_POOL.usdc, s.market);
    const price = s.arbDone ? arb.price : PRICE;
    const none = arb.dir === 'none';
    return (
      <div className="ctl" style={panel}>
        {title(labels.tArb)}
        <Slider id="mev-market" name={`${labels.cMarket}: ${usd(s.market, lang)}`} value={s.market} {...MARKET} onChange={(v) => s.set({ market: v, arbDone: false })} />
        <button id="mev-backrun" type="button" className="btn btn-primary" style={{ minHeight: 32 }} disabled={none || s.arbDone} onClick={() => s.set({ arbDone: true })}>
          {labels.cBackrun}
        </button>
        <button id="mev-arb-reset" type="button" className="btn" style={{ minHeight: 32 }} disabled={!s.arbDone} onClick={() => s.set({ arbDone: false })}>
          {labels.cReset}
        </button>
        <div className="ctl-stats" style={STATS}>
          <Stat name={labels.cPoolPrice}>{usd(price, lang)}</Stat>
          <Stat name={labels.cGap}>{signed(s.market > 0 ? price / s.market - 1 : 0, lang)}</Stat>
          {!compact && (
            <Stat name={labels.cArbTrade}>
              {none ? '—' : arb.dir === 'buyEth' ? `${usd(arb.amountIn, lang)} USDC → ${eth(arb.amountOut, lang)} ETH` : `${eth(arb.amountIn, lang)} ETH → ${usd(arb.amountOut, lang)} USDC`}
            </Stat>
          )}
          <Stat name={s.arbDone ? labels.cProfitTaken : labels.cProfitOpen} tone={none ? undefined : 'good'}>
            {none ? labels.inBand : `${usd(arb.profit, lang)} USDC`}
          </Stat>
        </div>
      </div>
    );
  }

  const status = !sw.possible ? labels.sImpossible : sw.attacked ? labels.sAttacked : labels.sUnprofitable;

  if (stepId === 'sandwich') {
    const stages = [labels.cStage0, labels.front, labels.cStageYou, labels.back];
    const at = sw.stages[s.stage] ?? sw.stages[0];
    const stagePrice = at.rOut > 0 ? at.rIn / at.rOut : 0;
    return (
      <div className="ctl" style={panel}>
        {title(labels.tSandwich)}
        {tradeSlider}
        <Slider id="mev-depth" name={`${labels.cDepth}: ${depthText(DEPTHS[s.depthIndex] * 2, lang)} USDC`} value={s.depthIndex} min={0} max={DEPTHS.length - 1} step={1} onChange={(v) => s.set({ depthIndex: v })} />
        <div className="seg" role="group" aria-label={labels.cStage} style={{ flexBasis: '100%' }}>
          {stages.map((name, i) => (
            <button key={i} type="button" aria-pressed={s.stage === i} onClick={() => s.set({ stage: i })} style={{ flex: 1, minHeight: 28, padding: '0 4px', fontSize: compact ? '0.7rem' : '0.78rem', whiteSpace: 'nowrap' }}>
              {i > 0 ? `${i}. ` : ''}
              {name}
            </button>
          ))}
        </div>
        <div className="ctl-stats" style={STATS}>
          {!compact && <Stat name={labels.cAlone}>{eth(sw.cleanOut, lang)} ETH</Stat>}
          <Stat name={labels.cYouGet} tone={sw.attacked ? 'bad' : 'good'}>
            {eth(sw.victimOut, lang)} ETH
          </Stat>
          {!compact && (
            <Stat name={labels.cYouLose} tone={sw.attacked ? 'bad' : 'good'}>
              {eth(sw.victimLoss, lang)} ETH
            </Stat>
          )}
          <Stat name={labels.cAttacker} tone={sw.attacked ? 'bad' : 'good'}>
            {sw.attacked ? `+${usd(sw.net, lang)} USDC` : status}
          </Stat>
          <Stat name={labels.cPoolPrice}>{usd(stagePrice, lang)}</Stat>
        </div>
      </div>
    );
  }

  if (stepId === 'slippage') {
    return (
      <div className="ctl" style={panel}>
        {title(labels.tSlip)}
        <Slider id="mev-tol" name={`${labels.cTol}: ${pct(s.tol / 100, 1, lang)}`} value={s.tol} {...TOL} onChange={(v) => s.set({ tol: v })} />
        <Slider id="mev-gas" name={`${labels.cGas}: ${usd(s.gas, lang)} USDC`} value={s.gas} {...GAS} onChange={(v) => s.set({ gas: v })} />
        <div className="ctl-stats" style={STATS}>
          {!compact && <Stat name={labels.cMinOut}>{eth(sw.minOut, lang)} ETH</Stat>}
          {!compact && <Stat name={labels.cFront}>{usd(sw.attacked ? sw.frontIn : 0, lang)} USDC</Stat>}
          <Stat name={labels.cYouLose} tone={sw.attacked ? 'bad' : 'good'}>
            {eth(sw.victimLoss, lang)} ETH
          </Stat>
          <Stat name={labels.cAttacker} tone={sw.attacked ? 'bad' : 'good'}>
            {sw.possible ? `${sw.net > 0.5 ? '+' : sw.net < -0.5 ? '−' : ''}${usd(Math.abs(sw.net), lang)} USDC` : '0 USDC'}
          </Stat>
          <Stat name={labels.cStatus} tone={sw.attacked ? 'bad' : 'good'}>
            {status}
          </Stat>
        </div>
      </div>
    );
  }

  if (stepId === 'defences') {
    const sp = splitTrade(input, s.parts, s.isPrivate);
    const hit = sp.attacks > 0;
    return (
      <div className="ctl" style={panel}>
        {title(labels.tDef)}
        <label className="ctl-check" style={CHECK}>
          <input id="mev-private" type="checkbox" checked={s.isPrivate} onChange={(e) => s.set({ isPrivate: e.target.checked })} />
          {labels.cPrivate}
        </label>
        <Slider id="mev-parts" name={`${labels.cParts}: ${s.parts}`} value={s.parts} {...PARTS} step={1} onChange={(v) => s.set({ parts: v })} />
        <div className="ctl-stats" style={STATS}>
          <Stat name={labels.cYouGet} tone={hit ? 'bad' : 'good'}>
            {eth(sp.victimOut, lang)} ETH
          </Stat>
          {!compact && (
            <Stat name={labels.cYouLose} tone={hit ? 'bad' : 'good'}>
              {eth(sp.victimLoss, lang)} ETH
            </Stat>
          )}
          <Stat name={labels.cAttacker} tone={hit ? 'bad' : 'good'}>
            {hit ? `+${usd(sp.attackerNet, lang)} USDC` : '0 USDC'}
          </Stat>
          <Stat name={labels.cStatus} tone={hit ? 'bad' : 'good'}>
            {s.isPrivate ? labels.sPrivate : hit ? `${labels.sAttacked} ×${sp.attacks}` : labels.sUnprofitable}
          </Stat>
        </div>
      </div>
    );
  }

  if (stepId === 'pbs') {
    const a = blockAuction(s.blockValue, s.builders, s.boost);
    return (
      <div className="ctl" style={panel}>
        {title(labels.tPbs)}
        <label className="ctl-check" style={CHECK}>
          <input id="mev-boost" type="checkbox" checked={s.boost} onChange={(e) => s.set({ boost: e.target.checked })} />
          {labels.cBoost}
        </label>
        <Slider id="mev-builders" name={`${labels.cBuilders}: ${s.boost ? s.builders : 0}`} value={s.builders} min={1} max={4} step={1} onChange={(v) => s.set({ builders: v })} />
        <Slider id="mev-value" name={`${labels.cValue}: ${num(s.blockValue, 2, lang)} ETH`} value={s.blockValue} {...BLOCK_VALUE} onChange={(v) => s.set({ blockValue: v })} />
        <div className="ctl-stats" style={STATS}>
          <Stat name={labels.cProposerGets} tone="good">
            {num(a.proposer, 3, lang)} ETH
          </Stat>
          <Stat name={labels.cBuilderKeeps}>{num(a.builder, 3, lang)} ETH</Stat>
          {!compact && <Stat name={labels.cShare}>{pct(s.blockValue > 0 ? a.proposer / s.blockValue : 0, 0, lang)}</Stat>}
        </div>
      </div>
    );
  }

  return null;
}
