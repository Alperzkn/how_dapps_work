import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Group } from 'three';
import {
  Anim,
  Block,
  Box,
  CoinStack,
  ContractMachine,
  Cyl,
  Label,
  Mat,
  Mover,
  Packet,
  Person,
  Platform,
  Screen,
  ShadowGround,
  ValidatorPillar,
  Wallet,
  useLoop,
  useScene,
  type LabelTone,
  type Vec3,
} from '../../scene/kit';
import type { SceneProps } from '../../scene/types';
import type { ColorKey } from '../../theme/tokens';
import type { Lang, Level } from '../../types';
import {
  annualBurn,
  annualIssuance,
  feeSplit,
  fillBlock,
  GWEI_PER_ETH,
  issuedBefore,
  LAST_HALVING,
  MAX_SUPPLY,
  opName,
  P2PKH,
  planPayment,
  SAT,
  subsidyAfter,
  transfer,
  TRANSFER_GAS,
  type ScriptItemKind,
} from './logic';
import { AMOUNT, BLOCK_SPACE, BURN_FEE, FEE_RATE, GAS_LIMIT, GAS_TARGET, HISTORY, LOW_GAS_LIMIT, MAX_FEE, MAX_PRIORITY, OTHER_TXS, PROGRAM, STAKED, toGwei, toSats, useChains, YOUR_VSIZE } from './state';

type Labels = Record<string, string>;

const U = Math.SQRT1_2;
/** Ground point given in screen terms: `sx` to the right, `d` toward the viewer. */
const at = (sx: number, d: number, y = 0): Vec3 => [(sx + d) * U, y, (d - sx) * U];
/** Label anchor given as an exact screen offset (right, up) from a side's centre. */
const scr = (sx: number, sy: number): Vec3 => [sx * U, sy / 0.816, -sx * U];

const BTC = at(-3.9, 0);
const ETH = at(3.9, 0);

const lines = (text: string) =>
  text.split('\n').map((l, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {l}
    </Fragment>
  ));

const locale = (lang: Lang) => (lang === 'tr' ? 'tr-TR' : 'en-US');
/** Formats a number with at most `max` decimals; anything that is not a finite number shows as 0. */
function fmt(n: number, max: number, lang: Lang, min = max): string {
  return (Number.isFinite(n) ? n : 0).toLocaleString(locale(lang), { minimumFractionDigits: Math.min(min, max), maximumFractionDigits: max });
}
/** Satoshis as bitcoins, e.g. 19000000 -> 0.19. */
const coin = (sats: number, lang: Lang) => fmt(sats / SAT, 8, lang, 1);
/** A yearly amount of ether in millions, e.g. 998000 -> 1.00M. */
const millions = (ethAmount: number, lang: Lang) => `${fmt(ethAmount / 1e6, 2, lang)}M`;
function signedPct(fraction: number, lang: Lang): string {
  const v = Number.isFinite(fraction) ? fraction * 100 : 0;
  return `${v < 0 ? '−' : '+'}${fmt(Math.abs(v), 2, lang, 0)}%`;
}

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

/** One caption whose text depends on the level. */
function ByLevel({ level, position, tone, b, i, e }: { level: Level; position: Vec3; tone?: LabelTone; b: string; i: string; e: string }) {
  const text = level === 'beginner' ? b : level === 'intermediate' ? i : e;
  return (
    <Label position={position} tone={level === 'expert' ? 'mono' : tone}>
      {lines(text)}
    </Label>
  );
}

/** A UTXO: one discrete coin of a fixed value. */
function Chip({ r = 0.42, color = 'tx', glow = false }: { r?: number; color?: ColorKey; glow?: boolean }) {
  return (
    <group>
      <Cyl radius={r} height={0.16} position={[0, 0.08, 0]} color={color} glow={glow} />
      <Cyl radius={r * 0.6} height={0.03} position={[0, 0.17, 0]} color="platform" />
    </group>
  );
}

/** An account: a named slot whose balance column grows and shrinks in place. */
function Account({ balance, glow = false, pending = 0 }: { balance: number; glow?: boolean; pending?: number }) {
  const b = Math.max(0.01, balance);
  const p = Math.min(Math.max(0, pending), b);
  return (
    <group>
      <Box size={[1.4, 0.3, 1.4]} position={[0, 0.15, 0]} color="neutral" radius={0.08} />
      <Anim position={[0, 0.3, 0]} scale={[1, b, 1]} speed={4}>
        <Box size={[0.9, 1, 0.9]} position={[0, 0.5, 0]} color="tokenB" glow={glow} radius={0.06} />
      </Anim>
      {/* The part of the balance the next transfer will move. */}
      <Anim position={[0, 0.3 + b - p, 0]} scale={[1, Math.max(0.01, p), 1]} show={p > 0} speed={4}>
        <Box size={[0.96, 1, 0.96]} position={[0, 0.5, 0]} color="tx" opacity={0.7} radius={0.06} />
      </Anim>
    </group>
  );
}

function Padlock({ open }: { open: boolean }) {
  return (
    <group>
      <Box size={[0.56, 0.44, 0.3]} position={[0, 0.22, 0]} color={open ? 'valid' : 'chain'} glow={open} radius={0.06} />
      <Anim position={[open ? 0.14 : 0, open ? 0.62 : 0.46, 0]} rotation={[0, 0, open ? -0.7 : 0]}>
        <mesh castShadow>
          <torusGeometry args={[0.17, 0.05, 8, 20]} />
          <Mat color="platform" />
        </mesh>
      </Anim>
    </group>
  );
}

/** Where burned fees go: a pit with a flickering flame. */
function BurnPit({ active }: { active: boolean }) {
  const flame = useRef<Group>(null);
  useLoop((t) => {
    if (!flame.current) return;
    const s = 1 + Math.sin(t * 6) * 0.15;
    flame.current.scale.set(s, 1 + Math.sin(t * 9) * 0.25, s);
  }, active);
  return (
    <group>
      <Cyl radius={0.72} height={0.3} position={[0, 0.15, 0]} color="chain" />
      <Cyl radius={0.54} height={0.32} position={[0, 0.16, 0]} color="invalid" glow />
      <group ref={flame} position={[0, 0.32, 0]}>
        <mesh position={[0, 0.25, 0]}>
          <coneGeometry args={[0.26, 0.5, 10]} />
          <Mat color="invalid" glow />
        </mesh>
      </group>
    </group>
  );
}

/** Blocks coming off a belt along x at a steady pace. */
function Conveyor({ speed, gap, size = 0.7, count, active }: { speed: number; gap: number; size?: number; count: number; active: boolean }) {
  const refs = useRef<(Group | null)[]>([]);
  const total = count * gap;
  useLoop((t) => {
    refs.current.forEach((g, i) => {
      if (!g) return;
      const x = (t * speed + (i + 0.5) * gap) % total;
      g.position.x = x - total / 2;
      g.scale.setScalar(Math.max(0.001, Math.min(1, Math.min(x, total - x) / 0.45)));
    });
  }, active);
  return (
    <group>
      <Box size={[total, 0.12, size + 0.4]} position={[0, 0.06, 0]} color="platform" radius={0.05} />
      {Array.from({ length: count }, (_, i) => (
        <group
          key={i}
          ref={(g) => {
            refs.current[i] = g;
          }}
          position={[(i + 0.5) * gap - total / 2, 0.12, 0]}
        >
          <Block size={size} />
        </group>
      ))}
    </group>
  );
}

/** Total supply as a tank whose level drifts with issuance and burn. */
function SupplyTank({ level = 1 }: { level?: number }) {
  return (
    <group>
      <Box size={[1.7, 0.14, 1.5]} position={[0, 0.07, 0]} color="neutral" radius={0.05} />
      <Anim position={[0, 0.14, 0]} scale={[1, level, 1]} speed={3}>
        <Box size={[1.5, 1, 1.3]} position={[0, 0.5, 0]} color="tokenB" radius={0.06} />
      </Anim>
      <Box size={[1.66, 1.7, 1.46]} position={[0, 0.99, 0]} color="neutral" opacity={0.28} radius={0.06} />
    </group>
  );
}

const HALVINGS = [2.4, 1.2, 0.6, 0.3, 0.15];

function HalvingStairs({ shown = 5 }: { shown?: number }) {
  return (
    <group>
      <Box size={[4.6, 0.1, 1.2]} position={[0, 0.05, 0]} color="platform" radius={0.04} />
      {HALVINGS.map((h, i) => (
        <Anim key={i} position={[-1.8 + i * 0.9, 0.1, 0]} show={i < shown} speed={7}>
          <Box size={[0.72, h, 0.9]} position={[0, h / 2, 0]} color="tx" glow={i === HALVINGS.length - 1} radius={0.05} />
        </Anim>
      ))}
    </group>
  );
}

interface StepProps {
  on: boolean;
  level: Level;
  labels: Labels;
  lang: Lang;
}

/* ---------- Step 1: what each chain is for ---------- */

function Goals({ on, labels }: StepProps) {
  const a = at(-1.9, 1.0);
  const b = at(1.4, 1.7);
  const s1 = at(-1.9, 0.8);
  const s2 = at(1.5, 1.7);
  const intake = at(-0.5, -1.2, 2.3);
  return (
    <Anim show={on}>
      <group position={BTC}>
        <group position={at(0, -1.4)}>
          <Box size={[2, 1.5, 1.3]} position={[0, 0.75, 0]} color="neutral" radius={0.1} />
          <Cyl radius={0.44} height={0.1} position={[0, 0.78, 0.67]} rotation={[Math.PI / 2, 0, 0]} color="chain" />
          <Box size={[0.5, 0.09, 0.08]} position={[0, 0.78, 0.74]} color="platform" radius={0.02} />
          <group position={[0.55, 1.5, 0]}>
            <CoinStack count={3} radius={0.26} />
          </group>
          <group position={[-0.4, 1.5, 0.1]}>
            <CoinStack count={5} radius={0.26} />
          </group>
        </group>
        <group position={a}>
          <Person />
        </group>
        <group position={b}>
          <Person />
        </group>
        <Mover path={[[a[0], 1.1, a[2]], [b[0], 1.1, b[2]]]} duration={2.2} arc={1} playing={on}>
          <Chip r={0.3} glow />
        </Mover>
        <Label position={scr(0, -2.75)} tone="tx">
          {lines(labels.btcGoal)}
        </Label>
        <Label position={scr(0, 3.45)} minLevel="intermediate" maxLevel="intermediate" tone="plain">
          {lines(labels.btcSince)}
        </Label>
        <Label position={scr(0, 3.3)} minLevel="expert" tone="mono">
          Nakamoto PoW
          <br />
          state = UTXO set
        </Label>
      </group>

      <group position={ETH}>
        <group position={at(0, -1.2)}>
          <ContractMachine size={1.25} active={on} glow />
        </group>
        <group position={s1} scale={0.62}>
          <Screen />
        </group>
        <group position={s2} scale={0.62}>
          <Screen face="tokenA" />
        </group>
        <Mover path={[[s1[0], 1, s1[2]], intake]} duration={1.6} arc={0.9} playing={on}>
          <Packet size={0.28} />
        </Mover>
        <Mover path={[[s2[0], 1, s2[2]], intake]} duration={1.6} delay={1} arc={0.9} playing={on}>
          <Packet size={0.28} />
        </Mover>
        <Label position={scr(0, -2.75)} tone="block">
          {lines(labels.ethGoal)}
        </Label>
        <Label position={scr(0, 3.45)} minLevel="intermediate" maxLevel="intermediate" tone="plain">
          {lines(labels.ethSince)}
        </Label>
        <Label position={scr(0, 3.3)} minLevel="expert" tone="mono">
          PoS (Gasper)
          <br />
          state = account trie
        </Label>
      </group>
    </Anim>
  );
}

/* ---------- Step 2: UTXO chips vs account balances ---------- */

const CENTER = at(0, 0);
const chipR = (sats: number) => 0.14 + 0.22 * Math.sqrt(Math.max(0, sats) / SAT);
const ALICE_SLOT = (i: number): Vec3 => at(i < 2 ? -1.9 : -0.85, i % 2 === 0 ? -0.7 : 0.55);
const BOB_COLS = 3;
const BOB_SHOWN = 12;
const BOB_SLOT = (i: number): Vec3 => at(0.75 + (i % BOB_COLS) * 0.68, -1.1 + Math.floor(i / BOB_COLS) * 0.7);

/** Children arrive from `from` and settle at `position`: a coin coming out of a transaction. */
function Spawn({ from, position, children }: { from: Vec3; position: Vec3; children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);
  return (
    <Anim position={ready ? position : from} speed={4}>
      {children}
    </Anim>
  );
}

function Ledger({ on, level, labels, lang }: StepProps) {
  const amount = useChains((s) => s.amount);
  const utxos = useChains((s) => s.utxos);
  const accounts = useChains((s) => s.accounts);
  const lastPlan = useChains((s) => s.lastPlan);
  const sent = useChains((s) => s.sent);
  const lv = level !== 'beginner';
  const expert = level === 'expert';
  const mine = utxos.filter((c) => c.owner === 'alice');
  const bobs = utxos.filter((c) => c.owner === 'bob');
  const plan = planPayment(mine, toSats(amount));
  const pay = transfer(accounts, toGwei(amount));
  const pending = pay.ok ? amount / 100 : 0;
  const aliceEth = accounts.alice / GWEI_PER_ETH;
  const bobEth = accounts.bob / GWEI_PER_ETH;
  const alice = at(-1.4, -1.1);
  const bob = at(1.4, 1.1);
  return (
    <Anim show={on}>
      <group position={BTC}>
        <Box size={[1, 0.08, 1]} position={at(0, 0, 0.04)} color="platform" radius={0.04} />
        <group position={at(-2.7, 0.8)}>
          <Person />
          <Label position={[0, -0.55, 0.4]} tone="actor">
            {labels.alice}
          </Label>
        </group>
        <group position={at(2.95, -0.1)}>
          <Person />
          <Label position={[0, -0.55, 0.4]} tone="actor">
            {labels.bob}
          </Label>
        </group>

        {/* Every unspent coin. The ones the next payment will consume are lifted and lit. */}
        {mine.map((c, i) => {
          const input = plan.inputs.findIndex((x) => x.id === c.id);
          const fresh = sent > 0 && c.id === `tx${sent}:1`;
          const p = ALICE_SLOT(i);
          return (
            <Spawn key={c.id} from={c.id.startsWith('tx') ? CENTER : p} position={input >= 0 ? [p[0], 0.35, p[2]] : p}>
              <Chip r={chipR(c.value)} glow={input >= 0} color={fresh && input < 0 ? 'valid' : 'tx'} />
              <Label position={[0, 0.75, 0]} show={lv && input >= 0} tone="tx">
                {expert ? `vin[${input}] · ` : ''}
                {coin(c.value, lang)}
              </Label>
              <Label position={[0, -0.45, 0.45]} show={lv && fresh && input < 0} tone="valid">
                {expert ? 'vout[1] · ' : ''}
                {coin(c.value, lang)} · {labels.change}
              </Label>
            </Spawn>
          );
        })}
        {bobs.slice(-BOB_SHOWN).map((c, i) => {
          const fresh = c.id === `tx${sent}:0`;
          return (
            <Spawn key={c.id} from={CENTER} position={BOB_SLOT(i)}>
              <Chip r={Math.min(0.33, chipR(c.value))} color="valid" glow={fresh} />
              <Label position={[0, 0.75, 0]} show={lv && fresh} tone="valid">
                {expert ? 'vout[0] · ' : ''}
                {coin(c.value, lang)}
              </Label>
            </Spawn>
          );
        })}
        <Anim position={at(0.1, 2.7)} show={lastPlan !== null} speed={4}>
          <Chip r={0.16} />
          <Label position={[0, -0.5, 0.4]} show={lv} tone="plain">
            {coin(lastPlan?.fee ?? 0, lang)} · {labels.fee}
          </Label>
        </Anim>
        <Label position={scr(0, -2.75)} minLevel="expert" tone="mono">
          Σ in − Σ out = fee
        </Label>
      </group>

      <group position={ETH}>
        <group position={alice}>
          <Account balance={aliceEth} pending={pending} />
          <Label position={[0, aliceEth + 0.95, 0]} tone="actor">
            {labels.alice}
            {lv && ` · ${fmt(aliceEth, expert ? 4 : 2, lang)} ETH`}
            {expert && (
              <>
                <br />
                nonce {accounts.aliceNonce}
              </>
            )}
          </Label>
        </group>
        <group position={bob}>
          <Account balance={bobEth} glow={sent > 0} />
          <Label position={[0, -0.75, 0.6]} tone="actor">
            {labels.bob}
            {lv && ` · ${fmt(bobEth, 2, lang)} ETH`}
            {expert && (
              <>
                <br />
                nonce 3
              </>
            )}
          </Label>
        </group>
        <Label position={scr(0, -2.75)} minLevel="expert" tone="mono">
          balance −= value + fee
        </Label>
      </group>
    </Anim>
  );
}

/* ---------- Step 3: Script checks vs EVM execution ---------- */

const ITEM_COLOR: Record<ScriptItemKind, ColorKey> = { sig: 'actor', pubKey: 'block', hash: 'contract', true: 'valid', false: 'invalid' };
const ITEM_NAME: Record<ScriptItemKind, string> = { sig: 'sig', pubKey: 'pubKey', hash: 'hash', true: 'true', false: 'false' };

function Programs({ on, level, labels, lang }: StepProps) {
  const script = useChains((s) => s.script);
  const evm = useChains((s) => s.evm);
  const tick = useChains((s) => s.autoTick);
  // Until a control is touched, both programs step along by themselves.
  const clock = useRef(0);
  useLoop((_, dt) => {
    clock.current += dt;
    if (clock.current < 1.15) return;
    clock.current = 0;
    tick();
  }, on);
  const open = script.status === 'valid';
  const rejected = script.status === 'invalid';
  const machine = at(-0.6, -1.0);
  const lv = level !== 'beginner';
  const evmOp = evm.pc > 0 ? opName(PROGRAM[evm.pc - 1]) : 'tx';
  const out = evm.status === 'out-of-gas';
  const changed = evm.slot !== evm.original;
  return (
    <Anim show={on}>
      <group position={BTC}>
        <group position={at(-1.7, 0.9)}>
          <Chip r={0.55} glow={open || rejected} color={open ? 'valid' : rejected ? 'invalid' : 'tx'} />
          <group position={[0, 0.2, 0]} scale={1.6}>
            <Padlock open={open} />
          </group>
          <Label position={[0, -0.8, 0.3]} tone={open ? 'valid' : rejected ? 'invalid' : 'default'}>
            {open ? labels.unlocked : rejected ? labels.rejected : labels.locked}
          </Label>
        </group>
        <group position={at(1.0, -0.7)}>
          <Box size={[1.5, 0.14, 1.5]} position={[0, 0.07, 0]} color="neutral" radius={0.05} />
          {[0, 1, 2, 3].map((i) => (
            <Anim key={i} position={[0, 0.31 + i * 0.36, 0]} show={i < script.stack.length} speed={9}>
              <Box size={[1.15, 0.3, 1.15]} color={ITEM_COLOR[script.stack[i]?.kind ?? 'sig']} glow={script.stack[i]?.kind === 'true' || script.stack[i]?.kind === 'false'} radius={0.06} />
            </Anim>
          ))}
          <Label position={[0, 2.3, 0]} maxLevel="beginner">
            {labels.stack}
          </Label>
          <Label position={[0, 2.3, 0]} minLevel="intermediate" tone="mono">
            {script.pc > 0 ? P2PKH[script.pc - 1] : labels.ready}
            <br />[{script.stack.map((i) => ITEM_NAME[i.kind]).join(' ')}]
          </Label>
        </group>
        <Label position={scr(0, -2.75)} minLevel="expert" tone="mono">
          {'no loops · no shared state'}
        </Label>
      </group>

      <group position={ETH}>
        <group position={machine}>
          <ContractMachine size={1.15} active={on && evm.status === 'running'} glow={evm.status === 'running' && evm.pc > 0} />
          <Label position={[-0.7, 2.6, 0.7]} maxLevel="beginner" tone={out ? 'invalid' : 'default'}>
            {out ? labels.outOfGas : labels.contract}
          </Label>
          <Label position={[-0.7, 2.6, 0.7]} minLevel="intermediate" tone={out ? 'invalid' : 'mono'}>
            {out ? `${evmOp} · ${labels.outOfGas}` : `${evmOp} · ${fmt(evm.lastCost, 0, lang)} gas`}
            {!out && (
              <>
                <br />[{evm.stack.map((v) => v.toString()).join(' ')}]
              </>
            )}
          </Label>
        </group>
        {/* Storage: the contract's own persistent slots. The first one is `count`. */}
        {[0, 1, 2, 3].map((i) => {
          const hit = i === 0 && changed;
          return (
            <group key={i} position={at(-1.5 + i * 0.85, 1.55 - Math.abs(i - 1.5) * 0.25)}>
              <Box size={[0.62, 0.3, 0.62]} position={[0, 0.15, 0]} color="neutral" radius={0.05} />
              <Anim position={[0, 0.3, 0]} scale={[1, i === 0 ? Math.min(2, Number(evm.slot) / 6) : 0.3 + i * 0.15, 1]} speed={5}>
                <Box size={[0.44, 0.6, 0.44]} position={[0, 0.3, 0]} color={hit ? 'valid' : 'tokenB'} glow={hit} radius={0.04} />
              </Anim>
            </group>
          );
        })}
        <Label position={at(-0.2, 2.6, -0.2)} tone={changed ? 'valid' : 'plain'}>
          {lv ? `slot 0 = ${evm.slot.toString()}` : labels.storage}
        </Label>
        {/* Gas: every operation drains the meter. */}
        <group position={at(2.15, -0.3)}>
          <Box size={[0.62, 0.12, 0.62]} position={[0, 0.06, 0]} color="neutral" radius={0.04} />
          <Anim position={[0, 0.12, 0]} scale={[1, Math.max(0.01, evm.gasLeft / GAS_LIMIT), 1]} speed={5}>
            <Box size={[0.4, 2.2, 0.4]} position={[0, 1.1, 0]} color="tx" glow radius={0.05} />
          </Anim>
          <Box size={[0.56, 2.3, 0.56]} position={[0, 1.27, 0]} color="neutral" opacity={0.28} radius={0.06} />
          <Label position={[0, 2.95, 0]} tone={out ? 'invalid' : 'tx'}>
            {labels.gas}
            {lv && ` ${fmt(evm.gasLeft, 0, lang)}`}
          </Label>
        </group>
        <Label position={scr(0, -2.75)} minLevel="expert" tone="mono">
          {'256-bit words · halts at gas 0'}
        </Label>
      </group>
    </Anim>
  );
}

/* ---------- Step 4: fee market vs gas with a burned base fee ---------- */

const stackFor = (rate: number) => Math.min(7, Math.max(1, Math.round(rate / 8)));
const gwei = (wei: bigint) => Number(wei) / 1e9;

function Fees({ on, level, labels, lang }: StepProps) {
  const feeRate = useChains((s) => s.feeRate);
  const fullness = useChains((s) => s.fullness);
  const baseFees = useChains((s) => s.baseFees);
  const blockNumber = useChains((s) => s.blockNumber);
  const phase = useCycle([1.6, 1.1, 0.9, 1.3, 2.4], on);
  const lv = level !== 'beginner';

  const ranked = fillBlock([...OTHER_TXS, { id: 'you', feeRate, vsize: YOUR_VSIZE }], BLOCK_SPACE);
  // The last transaction that still fits: the one to beat.
  const cutoff = ranked.filter((t) => t.included).sort((a, b) => b.rank - a.rank)[0];
  const tray = at(0.5, -1.5);
  const home = at(-0.4, 1.3);

  const base = baseFees[baseFees.length - 1];
  const prev = baseFees.length > 1 ? baseFees[baseFees.length - 2] : base;
  const split = feeSplit(BigInt(TRANSFER_GAS), base, MAX_FEE, MAX_PRIORITY);
  const wallet = at(-2.3, 0.9);
  const block = at(-0.5, -1.2);
  const pit = at(1.5, 0.6);
  const val = at(2.1, -1.2);
  const onBlock = (dx: number, dz: number): Vec3 => [block[0] + dx, 1.9, block[2] + dz];
  const top = Math.max(...baseFees.map(gwei), 1);
  return (
    <Anim show={on}>
      <group position={BTC}>
        {/* The next block: limited room. */}
        <group position={tray}>
          <Box size={[3, 0.3, 1.25]} position={[0, 0.15, 0]} color="block" glow radius={0.08} />
          <Label position={[1.9, 0.3, -1]} tone="block">
            {labels.nextBlock}
            {level === 'expert' && (
              <>
                <br />≤ 4,000,000 WU
              </>
            )}
          </Label>
        </group>
        {ranked.map((t, i) => {
          const mine = t.id === 'you';
          const slot = ranked.filter((o) => o.included && o.rank < t.rank).length;
          const waitIndex = ranked.filter((o) => !o.included && o.rank < t.rank).length;
          const wait: Vec3 = [home[0] - 0.9 + waitIndex * 0.9, 0, home[2]];
          const inBlock: Vec3 = [tray[0] - 0.95 + slot * 0.95, 0.3, tray[2]];
          return (
            <Anim key={t.id} position={t.included ? inBlock : wait} speed={4 + i * 0.3}>
              <Packet size={0.5} glow={t.included} color={mine ? 'actor' : 'tx'} />
              <group position={[0, 0.5, 0]}>
                <CoinStack count={stackFor(t.feeRate)} radius={0.15} color={t.included ? 'valid' : 'neutral'} />
              </group>
              <Label position={t.included ? [0, 0.6 + stackFor(t.feeRate) * 0.14 + 0.45, 0] : [0, -0.7, 0.5]} show={mine} tone={t.included ? 'valid' : 'invalid'}>
                {labels.you}
                {lv && ` · ${fmt(t.feeRate, 0, lang)} sat/vB`}
                {!t.included && (
                  <>
                    <br />
                    {labels.waiting}
                  </>
                )}
              </Label>
              <Label position={[0, 0.6 + stackFor(t.feeRate) * 0.14 + 0.45, 0]} show={lv && !mine && t.id === cutoff?.id} tone="plain">
                {fmt(t.feeRate, 0, lang)} sat/vB
              </Label>
            </Anim>
          );
        })}
        <Label position={scr(0, -2.75)} minLevel="expert" tone="mono">
          fee = vsize × feerate
        </Label>
      </group>

      <group position={ETH}>
        <group position={wallet} scale={0.7}>
          <Wallet />
        </group>
        {/* The block as a tank of gas: the mark is the target, half of the limit. */}
        <group position={block}>
          <Box size={[1.2, 0.12, 1.2]} position={[0, 0.06, 0]} color="platform" radius={0.04} />
          <Anim position={[0, 0.12, 0]} scale={[1, Math.max(0.01, fullness / 200), 1]} speed={5}>
            <Box size={[0.96, 1.6, 0.96]} position={[0, 0.8, 0]} color="block" glow={fullness > 100} radius={0.05} />
          </Anim>
          <Box size={[1.08, 1.66, 1.08]} position={[0, 0.95, 0]} color="neutral" opacity={0.26} radius={0.06} />
          <Box size={[1.2, 0.05, 1.2]} position={[0, 0.92, 0]} color="ink" radius={0.02} />
          <Label position={[0, 2.5, 0]} tone="block">
            {lv ? `block ${fmt(blockNumber, 0, lang)} · ${fmt(fullness, 0, lang)}%` : labels.nextBlock}
          </Label>
        </group>
        {/* Base fee of the latest blocks. */}
        <group position={at(-0.8, 1.5)}>
          {Array.from({ length: HISTORY }, (_, i) => {
            const fee = baseFees[i];
            const latest = i === baseFees.length - 1;
            return (
              <Anim key={i} position={[-0.9 + i * 0.36, 0, 0]} scale={[1, fee === undefined ? 0.01 : Math.max(0.03, gwei(fee) / top), 1]} show={fee !== undefined} speed={6}>
                <Box size={[0.26, 1.3, 0.4]} position={[0, 0.65, 0]} color={latest ? 'tx' : 'neutral'} glow={latest} radius={0.04} />
              </Anim>
            );
          })}
          <Label position={[0.2, -0.5, 0.5]} tone="tx">
            {lv ? `base fee ${fmt(gwei(base), 2, lang)} gwei` : labels.price}
            {lv && base !== prev && (
              <>
                <br />
                {signedPct(gwei(base) / gwei(prev) - 1, lang)}
              </>
            )}
          </Label>
        </group>
        <group position={pit}>
          <BurnPit active={on} />
          <Label position={[0.9, 0.5, -0.9]} tone="invalid">
            {lv ? labels.baseBurn : labels.burned}
          </Label>
        </group>
        <group position={val} scale={0.75}>
          <ValidatorPillar stake={2} />
        </group>
        <Label position={at(2.9, -1.4, 1.7)} tone="actor">
          {lines(lv ? labels.tipTo : labels.tip)}
        </Label>
        <Anim position={phase >= 1 ? onBlock(0, 0) : [wallet[0], 0.8, wallet[2]]} show={phase <= 1 && split.included} speed={3.5}>
          <Packet size={0.36} />
        </Anim>
        {[-0.3, 0, 0.3].map((dx, i) => (
          <Anim key={dx} position={phase >= 3 ? [pit[0], 0.55 + i * 0.2, pit[2]] : onBlock(dx, 0.2)} show={(phase === 2 || phase === 3) && split.included} speed={3.2}>
            <Chip r={0.2} color="invalid" glow />
          </Anim>
        ))}
        <Anim position={phase >= 3 ? [val[0], 1.45, val[2]] : onBlock(0.1, -0.3)} show={phase >= 2 && split.included && split.tipPerGas > 0n} speed={3.2}>
          <Chip r={0.2} color="valid" glow />
        </Anim>
        <Label position={scr(0, -2.75)} minLevel="expert" tone="mono">
          fee = gasUsed ×
          <br />
          (baseFee + priorityFee)
        </Label>
      </group>
    </Anim>
  );
}

/* ---------- Step 5: block rhythm and money supply ---------- */

const ERAS = 8;
const ERA_HEIGHT = (i: number) => Math.max(0.05, 2.4 / 2 ** i);

function Supply({ on, level, labels, lang }: StepProps) {
  const halvings = useChains((s) => s.halvings);
  const staked = useChains((s) => s.staked);
  const burnFee = useChains((s) => s.burnFee);
  const lv = level !== 'beginner';
  const pit: Vec3 = [1.75, 0, 1.3];
  const issuedShare = issuedBefore(halvings) / MAX_SUPPLY;
  const issuance = annualIssuance(staked * 1e6);
  const burn = annualBurn(burnFee, Number(GAS_TARGET));
  const net = issuance - burn;
  const level01 = 1 + Math.max(-0.55, Math.min(0.55, net / 2_000_000));
  return (
    <Anim show={on}>
      <group position={BTC}>
        <group position={[0, 0, -1.55]}>
          <Conveyor speed={0.3} gap={2.2} count={2} active={on} />
          <Label position={[-1.5, 1.5, 0]} tone="block">
            {level === 'beginner' ? labels.btcPace : labels.btcTime}
          </Label>
        </group>
        <group position={[0, 0, 1.25]}>
          {/* One bar per halving era; the lit one is the era the slider points at. */}
          <Box size={[3.5, 0.1, 1.2]} position={[-0.65, 0.05, 0]} color="platform" radius={0.04} />
          {Array.from({ length: ERAS }, (_, i) => (
            <group key={i} position={[-2.15 + i * 0.43, 0.1, 0]}>
              <Box size={[0.34, ERA_HEIGHT(i), 0.9]} position={[0, ERA_HEIGHT(i) / 2, 0]} color={i < halvings ? 'neutral' : 'tx'} glow={i === halvings} opacity={i > halvings ? 0.4 : 1} radius={0.04} />
            </group>
          ))}
          <Label position={[-2.15 + Math.min(halvings, ERAS - 1) * 0.43, -0.4, 0.9]} tone="tx">
            {lv ? `${fmt(subsidyAfter(halvings) / SAT, 8, lang, 0)} BTC` : labels.newCoins}
          </Label>
          {/* Everything issued so far, against the cap. */}
          <group position={[1.85, 0, 0]}>
            <Box size={[0.8, 0.1, 0.8]} position={[0, 0.05, 0]} color="platform" radius={0.04} />
            <Anim position={[0, 0.1, 0]} scale={[1, Math.max(0.01, issuedShare), 1]} speed={5}>
              <Box size={[0.5, 2.4, 0.5]} position={[0, 1.2, 0]} color="tx" glow radius={0.05} />
            </Anim>
            <Box size={[0.6, 2.46, 0.6]} position={[0, 1.33, 0]} color="neutral" opacity={0.26} radius={0.06} />
            <Box size={[0.8, 0.05, 0.8]} position={[0, 2.5, 0]} color="ink" radius={0.02} />
            <Label position={[0, 3.2, 0]} tone="tx">
              {lv ? `${fmt(issuedShare * 100, 2, lang)}% / 21M` : labels.btcCapShort}
            </Label>
          </group>
        </group>
        <Label position={scr(0, -2.75)} minLevel="expert" tone="mono">
          {'50 BTC >> ⌊h / 210,000⌋'}
        </Label>
      </group>

      <group position={ETH}>
        <group position={[0, 0, -1.55]}>
          <Conveyor speed={2.2} gap={1.1} count={4} active={on} />
          <Label position={[1.3, 1.5, 0]} tone="block">
            {level === 'beginner' ? labels.ethPace : labels.ethTime}
          </Label>
        </group>
        <group position={[-0.5, 0, 1.25]}>
          <SupplyTank level={level01} />
          <Mover path={[[-0.3, 3.6, 0], [-0.3, 1.5, 0]]} duration={1.3} playing={on}>
            <Chip r={0.2} color="valid" glow />
          </Mover>
          <Mover path={[[0.3, 3.6, 0.2], [0.3, 1.5, 0.2]]} duration={1.3} delay={0.85} playing={on}>
            <Chip r={0.2} color="valid" glow />
          </Mover>
          <Label position={[-0.6, 3.9, 0]} tone="valid">
            {labels.issuance}
            {lv && ` ${millions(issuance, lang)}`}
          </Label>
          <Label position={[0.4, -0.5, 1.3]} tone={net >= 0 ? 'valid' : 'invalid'}>
            {net >= 0 ? labels.grows : labels.shrinks}
          </Label>
        </group>
        <group position={pit}>
          <Anim scale={0.45 + Math.min(1, burn / 1_500_000) * 0.8} speed={5}>
            <BurnPit active={on} />
          </Anim>
          <Label position={[0, 1.7, 0]} tone="invalid">
            {labels.burn}
            {lv && ` ${millions(burn, lang)}`}
          </Label>
        </group>
        {on && burn > 0 && (
          <Mover path={[[0.3, 1.3, 1.25], pit]} duration={1.5} arc={0.9}>
            <Chip r={0.18} color="invalid" glow />
          </Mover>
        )}
        <Label position={scr(0, -2.75)} minLevel="expert" tone="mono">
          Δsupply = issuance − burn
        </Label>
      </group>
    </Anim>
  );
}

/* ---------- Step 6: both models side by side ---------- */

/** A three-tier shelf: one row per topic, so both sides read like a table. */
const TIERS = [4, 2, 0];
const SHELF = at(-1.5, 0.6);

function Shelf({ children }: { children: ReactNode[] }) {
  return (
    <group position={SHELF}>
      {[
        [-0.92, -0.92],
        [-0.92, 0.92],
        [0.92, -0.92],
      ].map(([x, z]) => (
        <Cyl key={`${x}${z}`} radius={0.06} height={4} position={[x, 2, z]} color="chain" segments={10} />
      ))}
      {TIERS.map((y, i) => (
        <group key={y} position={[0, y, 0]}>
          <Box size={[2.1, 0.12, 2.1]} position={[0, 0.06, 0]} color="platform" radius={0.05} />
          <group position={[0, 0.12, 0]}>{children[i]}</group>
        </group>
      ))}
    </group>
  );
}

function Summary({ on, level, labels }: StepProps) {
  const tag = (i: number): Vec3 => at(1.45, 0.6, TIERS[i] + 0.75);
  const row = (i: number, side: 'btc' | 'eth', tone: LabelTone) => (
    <ByLevel key={i} level={level} position={tag(i)} tone={tone} b={labels[`${side}${i}b`]} i={labels[`${side}${i}i`]} e={labels[`${side}${i}e`]} />
  );
  return (
    <Anim show={on}>
      <group position={BTC}>
        <Shelf>
          <group>
            <group position={[-0.4, 0, 0.1]}>
              <Chip r={0.46} />
            </group>
            <group position={[0.45, 0, -0.35]}>
              <Chip r={0.34} />
            </group>
            <group position={[0.4, 0, 0.5]}>
              <Chip r={0.24} />
            </group>
          </group>
          <group>
            <Box size={[1.2, 0.3, 1.2]} position={[0, 0.15, 0]} color="actor" radius={0.06} />
            <group position={[0, 0.3, 0]} scale={1.2}>
              <Padlock open={false} />
            </group>
          </group>
          <group scale={0.42}>
            <HalvingStairs />
          </group>
        </Shelf>
        {[0, 1, 2].map((i) => row(i, 'btc', 'tx'))}
      </group>

      <group position={ETH}>
        <Shelf>
          <group scale={0.65}>
            <Account balance={1.1} />
          </group>
          <ContractMachine size={0.62} active={on} />
          <group scale={0.48}>
            <group position={[-0.9, 0, 0]}>
              <SupplyTank />
            </group>
            <group position={[1.1, 0, 0.5]}>
              <BurnPit active={on} />
            </group>
          </group>
        </Shelf>
        {[0, 1, 2].map((i) => row(i, 'eth', 'block'))}
      </group>
    </Anim>
  );
}

function Side({ position, name, tone, caption, children }: { position: Vec3; name: string; tone: LabelTone; caption?: string; children?: ReactNode }) {
  return (
    <group position={position}>
      <Platform size={[5, 5]} color="ground" height={0.3} />
      <Label position={scr(0, caption ? 4.9 : 4.6)} tone={tone}>
        {name}
        {caption && (
          <>
            <br />
            {caption}
          </>
        )}
      </Label>
      {children}
    </group>
  );
}

/** One-line summary of each side on the steps with controls, shown under the chain's name. */
const CAPTIONS: Record<string, [string, string]> = {
  ledger: ['utxoIn', 'inPlace'],
  programs: ['btcProg', 'ethProg'],
  fees: ['btcFee', 'ethFee'],
  supply: ['btcCap', 'ethCap'],
};

export default function Scene({ stepId, level, labels, lang }: SceneProps) {
  const step = (id: string): StepProps => ({ on: stepId === id, level, labels, lang });
  const sent = useChains((s) => s.sent);
  const caption = CAPTIONS[stepId];
  return (
    <>
      <ShadowGround />
      <Side position={BTC} name="Bitcoin" tone="tx" caption={caption && labels[stepId === 'ledger' && sent > 0 ? 'utxoOut' : caption[0]]} />
      <Side position={ETH} name="Ethereum" tone="block" caption={caption && labels[caption[1]]} />
      <Goals {...step('goals')} />
      <Ledger {...step('ledger')} />
      <Programs {...step('programs')} />
      <Fees {...step('fees')} />
      <Supply {...step('supply')} />
      <Summary {...step('summary')} />
    </>
  );
}

/* ---------- Controls ---------- */

function Stat({ name, tone, children }: { name: string; tone?: 'good' | 'bad'; children: ReactNode }) {
  return (
    <div className="ctl-stat">
      <span>{name}</span>
      <strong data-tone={tone}>{children}</strong>
    </div>
  );
}

const row = { display: 'flex', alignItems: 'center', gap: '4px 8px', flexBasis: '100%', flexWrap: 'wrap' } as const;
const sliderRow = { display: 'flex', alignItems: 'center', gap: 10, flexBasis: '100%' } as const;
const tight = { gap: '2px 14px' } as const;

/** Chooses which chain the rest of the panel drives, so the panel stays small on a phone. */
function SideSwitch({ labels }: { labels: Labels }) {
  const side = useChains((s) => s.side);
  const setSide = useChains((s) => s.setSide);
  return (
    <div className="seg" role="group" aria-label={labels.chain}>
      <button type="button" data-side="btc" aria-pressed={side === 'btc'} onClick={() => setSide('btc')} style={{ padding: '0 7px' }}>
        Bitcoin
      </button>
      <button type="button" data-side="eth" aria-pressed={side === 'eth'} onClick={() => setSide('eth')} style={{ padding: '0 7px' }}>
        Ethereum
      </button>
    </div>
  );
}

function ResetButton({ labels, onClick, disabled }: { labels: Labels; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="btn" data-act="reset" onClick={onClick} disabled={disabled} aria-label={labels.reset} title={labels.reset} style={{ padding: '0 10px' }}>
      ↺
    </button>
  );
}

function LedgerControls({ labels, lang }: { labels: Labels; lang: Lang }) {
  const s = useChains();
  const mine = s.utxos.filter((c) => c.owner === 'alice');
  const plan = planPayment(mine, toSats(s.amount));
  const pay = transfer(s.accounts, toGwei(s.amount));
  const ethOf = (g: number) => fmt(g / GWEI_PER_ETH, 4, lang, 2);
  return (
    <div className="ctl" style={{ ...tight, maxWidth: 600 }}>
      <label className="ctl-field" style={sliderRow}>
        <span style={{ whiteSpace: 'nowrap', minWidth: '7.5em' }}>
          {labels.payBob}: {fmt(s.amount / 100, 2, lang)}
        </span>
        <input id="chain-amount" type="range" min={AMOUNT.min} max={AMOUNT.max} step={AMOUNT.step} value={s.amount} onChange={(e) => s.setAmount(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
        <button type="button" className="btn btn-primary" data-act="send" onClick={s.send} disabled={!plan.ok && !pay.ok}>
          {s.sent > 0 ? labels.sendAgain : labels.send}
        </button>
        <ResetButton labels={labels} onClick={s.resetLedger} disabled={s.sent === 0} />
      </label>
      <div className="ctl-stats" style={tight}>
        <Stat name={labels.btcInOut} tone={plan.ok ? undefined : 'bad'}>
          {plan.ok ? `${plan.inputs.map((c) => coin(c.value, lang)).join(' + ')} → ${[plan.payment, plan.change, plan.fee].filter((v) => v > 0).map((v) => coin(v, lang)).join(' + ')}` : labels.notEnough}
        </Stat>
        <Stat name={labels.coinCount}>
          {mine.length} · {s.utxos.length - mine.length}
        </Stat>
        <Stat name={labels.ethBalance} tone={pay.ok ? undefined : 'bad'}>
          {pay.ok ? `${ethOf(s.accounts.alice)} → ${ethOf(pay.next.alice)} · ${s.accounts.aliceNonce} → ${pay.next.aliceNonce}` : labels.notEnough}
        </Stat>
      </div>
    </div>
  );
}

function ProgramControls({ labels, lang }: { labels: Labels; lang: Lang }) {
  const s = useChains();
  const btc = s.side === 'btc';
  const over = btc ? s.script.status !== 'running' : s.evm.status !== 'running';
  const idle = !s.auto && over;
  const top = s.script.stack[s.script.stack.length - 1];
  const scriptResult = s.script.status === 'valid' ? labels.unlocked : s.script.status === 'invalid' ? labels.rejected : labels.running;
  const evmResult = s.evm.status === 'done' ? labels.done : s.evm.status === 'out-of-gas' ? labels.outOfGas : labels.running;
  return (
    <div className="ctl" style={{ ...tight, maxWidth: 600 }}>
      <div style={row}>
        <SideSwitch labels={labels} />
        <button type="button" className="btn btn-primary" data-act="step" onClick={s.stepProgram} disabled={idle} style={{ padding: '0 10px' }}>
          {labels.step}
        </button>
        <button type="button" className="btn" data-act="run" onClick={s.runProgram} style={{ padding: '0 10px' }}>
          {labels.run}
        </button>
        <ResetButton labels={labels} onClick={s.resetProgram} />
      </div>
      <label className="ctl-check">
        {btc ? <input id="chain-wrong-sig" type="checkbox" checked={s.wrongSig} onChange={(e) => s.setWrongSig(e.target.checked)} /> : <input id="chain-low-gas" type="checkbox" checked={s.lowGas} onChange={(e) => s.setLowGas(e.target.checked)} />}
        {btc ? labels.wrongSig : `${labels.lowGas} (${fmt(LOW_GAS_LIMIT, 0, lang)})`}
      </label>
      {btc ? (
        <div className="ctl-stats" style={tight}>
          <Stat name={`${labels.stepN} ${s.script.pc}/${P2PKH.length}`}>{s.script.pc > 0 ? P2PKH[s.script.pc - 1] : '—'}</Stat>
          <Stat name={labels.stackTop}>{top ? `${ITEM_NAME[top.kind]}${top.hex.length > 2 ? ` ${top.hex.slice(0, 6)}…` : ''}` : '—'}</Stat>
          <Stat name={labels.result} tone={s.script.status === 'valid' ? 'good' : s.script.status === 'invalid' ? 'bad' : undefined}>
            {scriptResult}
          </Stat>
        </div>
      ) : (
        <div className="ctl-stats" style={tight}>
          <Stat name={`${labels.stepN} ${s.evm.pc}/${PROGRAM.length}`}>{s.evm.pc > 0 ? opName(PROGRAM[s.evm.pc - 1]) : 'tx'}</Stat>
          <Stat name={labels.gasStep}>
            {fmt(s.evm.lastCost, 0, lang)} · {fmt(s.evm.gasLeft, 0, lang)}
          </Stat>
          <Stat name={labels.result} tone={s.evm.status === 'done' ? 'good' : s.evm.status === 'out-of-gas' ? 'bad' : undefined}>
            {evmResult}
          </Stat>
        </div>
      )}
    </div>
  );
}

function FeeControls({ labels, lang }: { labels: Labels; lang: Lang }) {
  const s = useChains();
  const btc = s.side === 'btc';
  const ranked = fillBlock([...OTHER_TXS, { id: 'you', feeRate: s.feeRate, vsize: YOUR_VSIZE }], BLOCK_SPACE);
  const you = ranked[ranked.length - 1];
  const base = s.baseFees[s.baseFees.length - 1];
  const prev = s.baseFees.length > 1 ? s.baseFees[s.baseFees.length - 2] : base;
  const split = feeSplit(BigInt(TRANSFER_GAS), base, MAX_FEE, MAX_PRIORITY);
  return (
    <div className="ctl" style={{ ...tight, maxWidth: 600 }}>
      <div style={row}>
        <SideSwitch labels={labels} />
        {!btc && (
          <>
            <button type="button" className="btn btn-primary" data-act="next-block" onClick={s.nextBlock}>
              {labels.nextBlockBtn}
            </button>
            <ResetButton labels={labels} onClick={s.resetFees} disabled={s.baseFees.length < 2} />
          </>
        )}
      </div>
      {btc ? (
        <label className="ctl-field" style={sliderRow}>
          <span style={{ whiteSpace: 'nowrap', minWidth: '11em' }}>
            {labels.yourRate}: {fmt(s.feeRate, 0, lang)} sat/vB
          </span>
          <input id="chain-fee-rate" type="range" min={FEE_RATE.min} max={FEE_RATE.max} step={1} value={s.feeRate} onChange={(e) => s.setFeeRate(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
        </label>
      ) : (
        <label className="ctl-field" style={sliderRow}>
          <span style={{ whiteSpace: 'nowrap', minWidth: '11em' }}>
            {labels.fullness}: {fmt(s.fullness, 0, lang)}%
          </span>
          <input id="chain-fullness" type="range" min={0} max={200} step={5} value={s.fullness} onChange={(e) => s.setFullness(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
        </label>
      )}
      {btc ? (
        <div className="ctl-stats" style={tight}>
          <Stat name={labels.yourFee}>{fmt(you.fee, 0, lang)} sat</Stat>
          <Stat name={labels.queue}>
            {you.rank} / {ranked.length}
          </Stat>
          <Stat name={labels.nextBlock} tone={you.included ? 'good' : 'bad'}>
            {you.included ? labels.included : labels.waiting}
          </Stat>
        </div>
      ) : (
        <div className="ctl-stats" style={tight}>
          <Stat name="base fee">
            {fmt(gwei(base), 2, lang)} gwei{base !== prev && ` (${signedPct(gwei(base) / gwei(prev) - 1, lang)})`}
          </Stat>
          <Stat name={labels.burnedTipped} tone={split.included ? undefined : 'bad'}>
            {split.included ? `${fmt(gwei(split.burned), 0, lang)} · ${fmt(gwei(split.tipped), 0, lang)}` : labels.waiting}
          </Stat>
        </div>
      )}
    </div>
  );
}

function SupplyControls({ labels, lang }: { labels: Labels; lang: Lang }) {
  const s = useChains();
  const btc = s.side === 'btc';
  const issued = issuedBefore(s.halvings);
  const issuance = annualIssuance(s.staked * 1e6);
  const burn = annualBurn(s.burnFee, Number(GAS_TARGET));
  const net = issuance - burn;
  const year = s.halvings === 0 ? 2009 : 2008 + 4 * s.halvings;
  const field = { minWidth: 140 } as const;
  return (
    <div className="ctl" style={{ ...tight, maxWidth: 600 }}>
      <div style={row}>
        <SideSwitch labels={labels} />
        {btc && (
          <label className="ctl-field" style={{ ...sliderRow, flex: 1, flexBasis: 200 }}>
            <span style={{ whiteSpace: 'nowrap', minWidth: '9.5em' }}>
              {labels.halvingN}: {s.halvings} · ≈ {year}
            </span>
            <input id="chain-halvings" type="range" min={0} max={LAST_HALVING} step={1} value={s.halvings} onChange={(e) => s.setHalvings(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
          </label>
        )}
      </div>
      {btc ? (
        <div className="ctl-stats" style={tight}>
          <Stat name={labels.subsidy}>{fmt(subsidyAfter(s.halvings) / SAT, 8, lang, 0)} BTC</Stat>
          <Stat name={labels.issued}>{fmt(issued / SAT, 4, lang, 0)} BTC</Stat>
          <Stat name={labels.ofCap}>{fmt((issued / MAX_SUPPLY) * 100, 4, lang, 2)}%</Stat>
        </div>
      ) : (
        <>
          <div style={row}>
            <label className="ctl-field" style={field}>
              <span>
                {labels.staked}: {fmt(s.staked, 0, lang)}M ETH
              </span>
              <input id="chain-staked" type="range" min={STAKED.min} max={STAKED.max} step={1} value={s.staked} onChange={(e) => s.setStaked(Number(e.target.value))} />
            </label>
            <label className="ctl-field" style={field}>
              <span>
                {labels.avgBaseFee}: {fmt(s.burnFee, 1, lang)} gwei
              </span>
              <input id="chain-burn-fee" type="range" min={BURN_FEE.min} max={BURN_FEE.max} step={BURN_FEE.step} value={s.burnFee} onChange={(e) => s.setBurnFee(Number(e.target.value))} />
            </label>
          </div>
          <div className="ctl-stats" style={tight}>
            <Stat name={labels.issuanceYear}>≈ +{millions(issuance, lang)}</Stat>
            <Stat name={labels.burnYear}>≈ −{millions(burn, lang)}</Stat>
            <Stat name={net >= 0 ? labels.grows : labels.shrinks} tone={net >= 0 ? undefined : 'bad'}>
              {net >= 0 ? '+' : '−'}
              {millions(Math.abs(net), lang)}
            </Stat>
          </div>
        </>
      )}
    </div>
  );
}

export function Controls({ stepId, labels, lang }: SceneProps) {
  if (stepId === 'ledger') return <LedgerControls labels={labels} lang={lang} />;
  if (stepId === 'programs') return <ProgramControls labels={labels} lang={lang} />;
  if (stepId === 'fees') return <FeeControls labels={labels} lang={lang} />;
  if (stepId === 'supply') return <SupplyControls labels={labels} lang={lang} />;
  return null;
}
