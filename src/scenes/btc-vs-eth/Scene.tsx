import { Fragment, useRef, useState, type ReactNode } from 'react';
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
import type { Level } from '../../types';

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
function Account({ balance, glow = false }: { balance: number; glow?: boolean }) {
  return (
    <group>
      <Box size={[1.4, 0.3, 1.4]} position={[0, 0.15, 0]} color="neutral" radius={0.08} />
      <Anim position={[0, 0.3, 0]} scale={[1, balance, 1]} speed={4}>
        <Box size={[0.9, 1, 0.9]} position={[0, 0.5, 0]} color="tokenB" glow={glow} radius={0.06} />
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
function SupplyTank({ active }: { active: boolean }) {
  const liquid = useRef<Group>(null);
  useLoop((t) => {
    if (liquid.current) liquid.current.scale.y = 1 + Math.sin(t * 1.3) * 0.1;
  }, active);
  return (
    <group>
      <Box size={[1.7, 0.14, 1.5]} position={[0, 0.07, 0]} color="neutral" radius={0.05} />
      <group ref={liquid} position={[0, 0.14, 0]}>
        <Box size={[1.5, 1, 1.3]} position={[0, 0.5, 0]} color="tokenB" radius={0.06} />
      </group>
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

function Ledger({ on, level, labels }: StepProps) {
  const phase = useCycle([1.8, 1.1, 0.9, 2.8], on);
  const inMid = phase >= 1;
  const done = phase >= 2;
  const out = phase >= 3;
  const plate = at(0, 0, 0.1);
  const lv = level !== 'beginner';
  const alice = at(-1.4, -1.1);
  const bob = at(1.4, 1.1);
  const top = (p: Vec3, h: number): Vec3 => [p[0], 0.45 + h, p[2]];
  return (
    <Anim show={on}>
      <group position={BTC}>
        <Box size={[1.7, 0.1, 1.7]} position={at(0, 0, 0.05)} color="platform" radius={0.05} />
        <group position={at(-2.5, 0.2)}>
          <Person />
          <Label position={[0, 1.75, 0]} tone="actor">
            {labels.alice}
          </Label>
        </group>
        <group position={at(2.6, 0.3)}>
          <Person />
          <Label position={[0, -0.6, 0.4]} tone="actor">
            {labels.bob}
          </Label>
        </group>

        {/* Inputs: whole chips go in and are used up. */}
        <Anim position={inMid ? at(-0.3, -0.3, 0.1) : at(-1.2, -1.5)} show={!done} speed={5}>
          <Chip r={0.5} />
          <Label position={[0, 1.55, 0]} show={lv && !inMid} tone="tx">
            {level === 'expert' ? 'vin[0] · 0.5' : '0.5 BTC'}
          </Label>
        </Anim>
        <Anim position={inMid ? at(0.3, 0.35, 0.1) : at(-1.3, 1.3)} show={!done} speed={5}>
          <Chip r={0.4} />
          <Label position={[0, -0.55, 0.3]} show={lv && !inMid} tone="tx">
            {level === 'expert' ? 'vin[1] · 0.3' : '0.3 BTC'}
          </Label>
        </Anim>

        {/* Outputs: brand-new chips come out. */}
        <Anim position={out ? at(1.4, -1.2) : plate} show={done} speed={4}>
          <Chip r={0.54} color="valid" glow />
          <Label position={[0, 0.8, 0]} show={lv && out} tone="valid">
            {level === 'expert' ? 'vout[0] · 0.6' : `0.6 → ${labels.bob}`}
          </Label>
        </Anim>
        <Anim position={out ? at(-1.3, 1.5) : plate} show={done} speed={4}>
          <Chip r={0.32} color="valid" glow />
          <Label position={[0, -0.5, 0.3]} show={lv && out} tone="valid">
            {level === 'expert' ? 'vout[1] · 0.19' : `0.19 · ${labels.change}`}
          </Label>
        </Anim>
        <Anim position={out ? at(0.2, -2.8) : plate} show={done} speed={4}>
          <Chip r={0.16} />
          <Label position={[0, 1.0, 0]} show={lv && out} tone="plain">
            0.01 · {labels.fee}
          </Label>
        </Anim>

        <Label position={scr(0, -2.75)} tone="tx">
          {lines(done ? labels.utxoOut : labels.utxoIn)}
        </Label>
        <Label position={scr(0, -3.8)} minLevel="expert" tone="mono">
          Σ in − Σ out = fee
        </Label>
      </group>

      <group position={ETH}>
        <group position={alice}>
          <Account balance={done ? 1.4 : 2} />
          <Label position={[0, done ? 2.35 : 2.95, 0]} tone="actor">
            {labels.alice}
            {lv && ` · ${done ? '1.4' : '2.0'} ETH`}
            {level === 'expert' && (
              <>
                <br />
                nonce {done ? 8 : 7}
              </>
            )}
          </Label>
        </group>
        <group position={bob}>
          <Account balance={done ? 1.6 : 1} glow={done} />
          <Label position={[0, -0.75, 0.6]} tone="actor">
            {labels.bob}
            {lv && ` · ${done ? '1.6' : '1.0'} ETH`}
            {level === 'expert' && (
              <>
                <br />
                nonce 3
              </>
            )}
          </Label>
        </group>
        <Anim position={inMid ? top(bob, 1.3) : top(alice, 2.1)} show={phase === 1} speed={3.2}>
          <Packet size={0.34} />
        </Anim>
        <Label position={scr(0, -2.75)} tone="block">
          {lines(labels.inPlace)}
        </Label>
        <Label position={scr(0, -3.8)} minLevel="expert" tone="mono">
          balance −= value + fee
        </Label>
      </group>
    </Anim>
  );
}

/* ---------- Step 3: Script checks vs EVM execution ---------- */

type Item = 'sig' | 'pk' | 'h' | 'ok';
const ITEM_COLOR: Record<Item, ColorKey> = { sig: 'actor', pk: 'block', h: 'contract', ok: 'valid' };
const STACKS: Item[][] = [['sig', 'pk'], ['sig', 'pk', 'pk'], ['sig', 'pk', 'h', 'h'], ['sig', 'pk'], ['ok']];
const SCRIPT_OPS = ['<sig> <pubKey>', 'OP_DUP', 'OP_HASH160 <pkh>', 'OP_EQUALVERIFY', 'OP_CHECKSIG'];
const EVM_OPS = ['tx', 'SLOAD', 'ADD', 'SSTORE', 'RETURN'];
const EVM_COST = ['21,000', '2,100', '3', '2,900', '0'];
const GAS_LEFT = ['39,000', '36,900', '36,897', '33,997', '33,997'];
const GAS_FILL = [0.82, 0.68, 0.66, 0.46, 0.46];

function Programs({ on, level, labels }: StepProps) {
  const phase = useCycle([1.5, 1.2, 1.2, 1.2, 2.6], on);
  const open = phase === 4;
  const stack = STACKS[phase];
  const machine = at(-0.6, -1.0);
  return (
    <Anim show={on}>
      <group position={BTC}>
        <group position={at(-1.7, 0.9)}>
          <Chip r={0.55} glow={open} color={open ? 'valid' : 'tx'} />
          <group position={[0, 0.2, 0]} scale={1.6}>
            <Padlock open={open} />
          </group>
          <Label position={[0, -0.8, 0.3]} tone={open ? 'valid' : 'default'}>
            {open ? labels.unlocked : labels.locked}
          </Label>
        </group>
        <group position={at(1.0, -0.7)}>
          <Box size={[1.5, 0.14, 1.5]} position={[0, 0.07, 0]} color="neutral" radius={0.05} />
          {[0, 1, 2, 3].map((i) => (
            <Anim key={i} position={[0, 0.31 + i * 0.36, 0]} show={i < stack.length} speed={9}>
              <Box size={[1.15, 0.3, 1.15]} color={ITEM_COLOR[stack[i] ?? 'sig']} glow={stack[i] === 'ok'} radius={0.06} />
            </Anim>
          ))}
          <Label position={[0, 2.3, 0]} maxLevel="beginner">
            {labels.stack}
          </Label>
          <Label position={[0, 2.3, 0]} minLevel="intermediate" tone="mono">
            {SCRIPT_OPS[phase]}
          </Label>
        </group>
        <Label position={scr(0, -2.75)} tone="tx">
          {lines(labels.btcProg)}
        </Label>
        <Label position={scr(0, -3.8)} minLevel="expert" tone="mono">
          {'no loops · no shared state'}
        </Label>
      </group>

      <group position={ETH}>
        <group position={machine}>
          <ContractMachine size={1.15} active={on} glow={phase > 0 && phase < 4} />
          <Label position={[-0.7, 2.6, 0.7]} maxLevel="beginner">
            {labels.contract}
          </Label>
          <Label position={[-0.7, 2.6, 0.7]} minLevel="intermediate" tone="mono">
            {EVM_OPS[phase]}
            {level === 'expert' && ` · ${EVM_COST[phase]}`}
          </Label>
        </group>
        <Anim position={phase === 0 ? at(-0.9, -1.0, 2.1) : at(-2.6, 0.6, 0.4)} show={phase === 0} speed={3.5}>
          <Packet size={0.34} />
        </Anim>
        {/* Storage: the contract's own persistent slots. */}
        {[0, 1, 2, 3].map((i) => {
          const hit = i === 1 && phase >= 3;
          return (
            <group key={i} position={at(-1.5 + i * 0.85, 1.55 - Math.abs(i - 1.5) * 0.25)}>
              <Box size={[0.62, 0.3, 0.62]} position={[0, 0.15, 0]} color="neutral" radius={0.05} />
              <Anim position={[0, 0.3, 0]} scale={[1, i === 1 ? (hit ? 1.3 : 0.5) : 0.3 + i * 0.15, 1]} speed={5}>
                <Box size={[0.44, 0.6, 0.44]} position={[0, 0.3, 0]} color={hit ? 'valid' : 'tokenB'} glow={hit} radius={0.04} />
              </Anim>
            </group>
          );
        })}
        <Label position={at(-0.2, 2.6, -0.2)} tone="plain">
          {labels.storage}
        </Label>
        {/* Gas: every operation drains the meter. */}
        <group position={at(2.15, -0.3)}>
          <Box size={[0.62, 0.12, 0.62]} position={[0, 0.06, 0]} color="neutral" radius={0.04} />
          <Anim position={[0, 0.12, 0]} scale={[1, GAS_FILL[phase], 1]} speed={5}>
            <Box size={[0.4, 2.2, 0.4]} position={[0, 1.1, 0]} color="tx" glow radius={0.05} />
          </Anim>
          <Box size={[0.56, 2.3, 0.56]} position={[0, 1.27, 0]} color="neutral" opacity={0.28} radius={0.06} />
          <Label position={[0, 2.95, 0]} tone="tx">
            {labels.gas}
            {level !== 'beginner' && ` ${GAS_LEFT[phase]}`}
          </Label>
        </group>
        <Label position={scr(0, -2.75)} tone="block">
          {lines(labels.ethProg)}
        </Label>
        <Label position={scr(0, -3.8)} minLevel="expert" tone="mono">
          {'256-bit words · halts at gas 0'}
        </Label>
      </group>
    </Anim>
  );
}

/* ---------- Step 4: fee market vs gas with a burned base fee ---------- */

const RATES = [12, 40, 2, 25, 5];
const COINS = [3, 5, 1, 4, 2];
const PICK_SLOT: (number | null)[] = [2, 0, null, 1, null];

function Fees({ on, level, labels }: StepProps) {
  const phase = useCycle([1.6, 1.1, 0.9, 1.3, 2.4], on);
  const picked = phase >= 1;
  const sealed = phase >= 3;
  const wallet = at(-2.2, 0.5);
  const block = at(-0.2, -0.9);
  const pit = at(1.4, 1.0);
  const val = at(2.1, -1.0);
  const onBlock = (dx: number, dz: number): Vec3 => [block[0] + dx, 1.2, block[2] + dz];
  const lv = level !== 'beginner';
  return (
    <Anim show={on}>
      <group position={BTC}>
        {/* The next block: limited room. */}
        <group position={at(0.5, -1.5)}>
          <Box size={[3, 0.3, 1.25]} position={[0, 0.15, 0]} color="block" glow={sealed} radius={0.08} />
          <Label position={[0, 2.0, 0]} tone="block">
            {sealed ? labels.blockFull : labels.nextBlock}
            {level === 'expert' && (
              <>
                <br />≤ 4,000,000 WU
              </>
            )}
          </Label>
        </group>
        {RATES.map((rate, i) => {
          const slot = PICK_SLOT[i];
          const home = at(-0.4, 1.3);
          const wait: Vec3 = [home[0] - 1.8 + i * 0.9, 0, home[2]];
          const tray = at(0.5, -1.5);
          const inBlock: Vec3 = slot === null ? wait : [tray[0] - 0.95 + slot * 0.95, 0.3, tray[2]];
          return (
            <Anim key={i} position={picked ? inBlock : wait} speed={3 + i * 0.4}>
              <Packet size={0.5} glow={slot !== null} />
              <group position={[0, 0.5, 0]}>
                <CoinStack count={COINS[i]} radius={0.15} color={slot === null ? 'neutral' : 'valid'} />
              </group>
              <Label position={[0, -0.6, 0.45]} show={lv && (i === 1 || i === 2) && !picked} tone={i === 1 ? 'valid' : 'plain'}>
                {rate} sat/vB
              </Label>
              <Label position={[0, -0.6, 0.45]} show={i === 2 && picked} tone="invalid">
                {labels.waiting}
              </Label>
            </Anim>
          );
        })}
        <Label position={scr(0, -2.75)} tone="tx">
          {lines(labels.btcFee)}
        </Label>
        <Label position={scr(0, -3.8)} minLevel="expert" tone="mono">
          fee = vsize × feerate
        </Label>
      </group>

      <group position={ETH}>
        <group position={wallet} scale={0.7}>
          <Wallet />
        </group>
        <group position={block}>
          <Block size={1.1} glow={phase >= 1} />
        </group>
        <group position={pit}>
          <BurnPit active={on} />
          <Label position={[0, -0.7, 0.5]} tone="invalid">
            {lv ? labels.baseBurn : labels.burned}
          </Label>
        </group>
        <group position={val} scale={0.75}>
          <ValidatorPillar stake={2} />
        </group>
        <Label position={at(1.3, -1.0, 2.45)} tone="actor">
          {lines(lv ? labels.tipTo : labels.tip)}
        </Label>
        <Anim position={phase >= 1 ? onBlock(0, 0) : [wallet[0], 0.8, wallet[2]]} show={phase <= 1} speed={3.5}>
          <Packet size={0.36} />
        </Anim>
        {[-0.3, 0, 0.3].map((dx, i) => (
          <Anim key={dx} position={phase >= 3 ? [pit[0], 0.55 + i * 0.2, pit[2]] : onBlock(dx, 0.2)} show={phase === 2 || phase === 3} speed={3.2}>
            <Chip r={0.2} color="invalid" glow />
          </Anim>
        ))}
        <Anim position={phase >= 3 ? [val[0], 1.45, val[2]] : onBlock(0.1, -0.3)} show={phase >= 2} speed={3.2}>
          <Chip r={0.2} color="valid" glow />
        </Anim>
        <Label position={scr(0, -2.75)} tone="block">
          {lines(labels.ethFee)}
        </Label>
        <Label position={scr(0, -4.25)} minLevel="expert" tone="mono">
          fee = gasUsed ×
          <br />
          (baseFee + priorityFee)
        </Label>
      </group>
    </Anim>
  );
}

/* ---------- Step 5: block rhythm and money supply ---------- */

function Supply({ on, level, labels }: StepProps) {
  const phase = useCycle([0.6, 0.6, 0.6, 0.6, 0.6, 3.2], on);
  const pit: Vec3 = [1.75, 0, 1.3];
  return (
    <Anim show={on}>
      <group position={BTC}>
        <group position={[0, 0, -1.55]}>
          <Conveyor speed={0.3} gap={2.2} count={2} active={on} />
          <Label position={[1.3, 1.5, 0]} tone="block">
            {level === 'beginner' ? labels.btcPace : labels.btcTime}
          </Label>
        </group>
        <group position={[0, 0, 1.25]}>
          <HalvingStairs shown={phase + 1} />
          <Label position={[0.8, 5.1, 0]} show={level !== 'expert'} tone="tx">
            {lines(level === 'beginner' ? labels.halves : labels.halvesNum)}
          </Label>
          <Label position={[0.8, 5.1, 0]} minLevel="expert" tone="mono">
            subsidy =
            <br />
            {'50 BTC >> ⌊h / 210,000⌋'}
          </Label>
        </group>
        <Label position={scr(0, -2.75)} tone="tx">
          {lines(labels.btcCap)}
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
          <SupplyTank active={on} />
          <Mover path={[[-0.3, 3.6, 0], [-0.3, 1.5, 0]]} duration={1.3} playing={on}>
            <Chip r={0.2} color="valid" glow />
          </Mover>
          <Mover path={[[0.3, 3.6, 0.2], [0.3, 1.5, 0.2]]} duration={1.3} delay={0.85} playing={on}>
            <Chip r={0.2} color="valid" glow />
          </Mover>
          <Label position={[-0.6, 3.9, 0]} tone="valid">
            {labels.issuance}
          </Label>
        </group>
        <group position={pit}>
          <BurnPit active={on} />
          <Label position={[0, 1.5, 0]} tone="invalid">
            {labels.burn}
          </Label>
        </group>
        <Mover path={[[0.3, 1.3, 1.25], pit]} duration={1.5} arc={0.9} playing={on}>
          <Chip r={0.18} color="invalid" glow />
        </Mover>
        <Label position={scr(0, -2.75)} tone="block">
          {lines(labels.ethCap)}
        </Label>
        <Label position={scr(0, -3.8)} minLevel="expert" tone="mono">
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
              <SupplyTank active={on} />
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

function Side({ position, name, tone, children }: { position: Vec3; name: string; tone: LabelTone; children?: ReactNode }) {
  return (
    <group position={position}>
      <Platform size={[5, 5]} color="ground" height={0.3} />
      <Label position={scr(0, 4.6)} tone={tone}>
        {name}
      </Label>
      {children}
    </group>
  );
}

export default function Scene({ stepId, level, labels }: SceneProps) {
  const step = (id: string): StepProps => ({ on: stepId === id, level, labels });
  return (
    <>
      <ShadowGround />
      <Side position={BTC} name="Bitcoin" tone="tx" />
      <Side position={ETH} name="Ethereum" tone="block" />
      <Goals {...step('goals')} />
      <Ledger {...step('ledger')} />
      <Programs {...step('programs')} />
      <Fees {...step('fees')} />
      <Supply {...step('supply')} />
      <Summary {...step('summary')} />
    </>
  );
}
