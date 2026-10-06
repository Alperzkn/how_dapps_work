import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Vector3, type Group } from 'three';
import { Anim, Box, CoinStack, ContractMachine, Cyl, FlowLine, Label, Mat, Mover, NodeTower, Packet, Person, Platform, ShadowGround, useLevel, useLoop, useScene, type Vec3 } from '../../scene/kit';
import type { ColorKey } from '../../theme/tokens';
import type { SceneProps } from '../../scene/types';
import type { Lang } from '../../types';
import {
  ALICE,
  BALANCES_SLOT,
  EMPTY_CODE_HASH,
  EMPTY_TRIE_ROOT,
  GAS,
  INCREMENT_CODE,
  WEI,
  createAddress,
  createPreimage,
  keccakHex,
  mappingSlot,
  nextCost,
  sendTx,
  shortCalldata,
  shortHex,
  simulateAttack,
  singleSlotStorageRoot,
  type Instr,
} from './logic';
import { GAS_LIMIT_STEP, GAS_PRICE_GWEI, KEY_ADDRESS, KEY_IDS, MAX_GAS_LIMIT, MAX_NONCE, MAX_OTHERS, MIN_GAS_LIMIT, PROGRAM, useContracts, type KeyId } from './state';

// The camera looks along the diagonal, so the scene is laid out in screen
// terms: `u` runs to the right of the screen, `v` towards the viewer.
const R = Math.SQRT1_2;
const at = (u: number, v = 0, y = 0): Vec3 => [(u + v) * R, y, (v - u) * R];
/** Rotation that turns a board to face the camera; its local x then runs along `u`. */
const FACE: Vec3 = [0, Math.PI / 4, 0];

const locale = (lang: Lang) => (lang === 'tr' ? 'tr-TR' : 'en-US');
const num = (n: number, lang: Lang, digits = 0) => (Number.isFinite(n) ? n : 0).toLocaleString(locale(lang), { minimumFractionDigits: digits, maximumFractionDigits: digits });
/** Whole and fractional ETH from wei, exact to three decimals. */
const eth = (wei: bigint, lang: Lang) => num(Number(wei / (WEI / 1000n)) / 1000, lang, wei % WEI === 0n ? 0 : 3);
const word = (v: bigint) => (v < 1_000_000n ? v.toString() : shortHex(`0x${v.toString(16)}`));

/** Position along the hash rail (0–1) for a slot hash: its first two bytes as a fraction of the whole range. */
const railPos = (hash: string) => parseInt(hash.slice(2, 6), 16) / 0xffff;

// ---------------------------------------------------------------- small pieces

/** A parcel that flies along `path` once, every time `trigger` changes. */
function OneShot({ trigger, path, duration = 0.9, arc = 0.9, children }: { trigger: number; path: Vec3[]; duration?: number; arc?: number; children: ReactNode }) {
  const ref = useRef<Group>(null);
  const start = useRef<number | null>(null);
  const seen = useRef(trigger);
  const [playing, setPlaying] = useState(false);
  const pts = useMemo(() => path.map((p) => new Vector3(...p)), [path]);
  useEffect(() => {
    if (trigger === seen.current) return;
    seen.current = trigger;
    start.current = null;
    setPlaying(trigger > 0);
  }, [trigger]);
  useLoop((time) => {
    const g = ref.current;
    if (!g) return;
    start.current ??= time;
    const t = (time - start.current) / duration;
    if (t >= 1) {
      g.visible = false;
      setPlaying(false);
      return;
    }
    g.visible = true;
    const e = t * t * (3 - 2 * t);
    g.position.lerpVectors(pts[0], pts[pts.length - 1], e);
    g.position.y += Math.sin(e * Math.PI) * arc;
  }, playing);
  return (
    <group ref={ref} visible={false}>
      {children}
    </group>
  );
}

/** One storage slot: a drawer. A zero slot is not stored at all, so it is drawn faint. */
function Drawer({ filled, glow = false, color = 'block', width = 1.5 }: { filled: boolean; glow?: boolean; color?: ColorKey; width?: number }) {
  return (
    <group>
      <Box size={[width, 0.56, 0.7]} position={[0, 0.28, 0]} color="neutral" radius={0.06} opacity={filled ? 1 : 0.45} />
      <Box size={[width - 0.2, 0.36, 0.06]} position={[0, 0.28, 0.36]} color={filled ? color : 'platform'} glow={glow} radius={0.04} opacity={filled ? 1 : 0.5} />
      <Cyl radius={0.06} height={0.08} position={[0, 0.28, 0.42]} rotation={[Math.PI / 2, 0, 0]} color="chain" segments={10} />
    </group>
  );
}

/** A private key. */
function Key() {
  return (
    <group rotation={[0, Math.PI / 4, 0]}>
      <mesh rotation={[0, 0, 0]} position={[-0.28, 0, 0]} castShadow>
        <torusGeometry args={[0.16, 0.06, 10, 20]} />
        <Mat color="tx" glow />
      </mesh>
      <Box size={[0.5, 0.08, 0.08]} position={[0.12, 0, 0]} color="tx" glow radius={0.03} />
      <Box size={[0.08, 0.16, 0.08]} position={[0.3, -0.1, 0]} color="tx" glow radius={0.02} />
      <Box size={[0.08, 0.12, 0.08]} position={[0.16, -0.08, 0]} color="tx" glow radius={0.02} />
    </group>
  );
}

/** A sheet of source code facing the camera. */
function SourceCard() {
  return (
    <group rotation={FACE}>
      <Box size={[1.7, 2.1, 0.12]} position={[0, 1.15, 0]} color="platform" radius={0.06} />
      {[1.3, 0.9, 1.1, 0.6, 1.0].map((w, i) => (
        <Box key={i} size={[w, 0.12, 0.05]} position={[-0.65 + w / 2, 1.9 - i * 0.34, 0.08]} color={i === 0 ? 'actor' : 'chain'} radius={0.02} />
      ))}
    </group>
  );
}

/** A row of small cubes: bytes of code. */
function Bytes({ count, color = 'block', gap = 0.42 }: { count: number; color?: ColorKey; gap?: number }) {
  return (
    <group rotation={FACE}>
      {Array.from({ length: count }, (_, i) => (
        <Box key={i} size={[0.34, 0.34, 0.34]} position={[(i - (count - 1) / 2) * gap, 0.17, 0]} color={color} radius={0.05} />
      ))}
    </group>
  );
}

const TAPE_GAP = 1.25;
const TAPE_U0 = -5.4;
const tapeU = (i: number) => TAPE_U0 + i * TAPE_GAP;

const instrText = (i: Instr) => (i.arg !== undefined ? `${i.name} ${i.arg.toString()}` : i.name);

/** The program as a row of instruction blocks with a pointer over the current one. */
function Tape({ program, ip, done, failed, caption, showAll }: { program: Instr[]; ip: number; done: number; failed: boolean; caption: string; showAll: boolean }) {
  const cur = Math.min(ip, program.length - 1);
  return (
    <group>
      {program.map((ins, i) => {
        const here = i === cur;
        const color: ColorKey = here && failed ? 'invalid' : here ? 'tx' : i < done ? 'valid' : 'neutral';
        return (
          <Anim key={i} position={at(tapeU(i), 0, here ? 0.25 : 0)} speed={10}>
            <Box size={[0.9, 0.9, 0.9]} position={[0, 0.45, 0]} color={color} glow={here} radius={0.1} />
            <Label position={at(0, i % 2 ? 1.75 : 1.05, -0.25)} tone="mono" show={showAll && !here}>
              {instrText(ins)}
            </Label>
          </Anim>
        );
      })}
      <Anim position={at(tapeU(cur), 0, 1.75)} speed={10}>
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.2, 0.4, 14]} />
          <Mat color={failed ? 'invalid' : 'tx'} glow />
        </mesh>
        <Label position={[0, 0.75, 0]} tone={failed ? 'invalid' : 'tx'}>
          {caption}
        </Label>
      </Anim>
    </group>
  );
}

/** A horizontal bar split into coloured parts; lengths are in world units. */
function Bar({ parts, height = 0.36 }: { parts: { len: number; color: ColorKey; glow?: boolean }[]; height?: number }) {
  let x = 0;
  return (
    <group rotation={FACE}>
      {parts.map((p, i) => {
        const len = Math.max(p.len, 0);
        const x0 = x;
        x += len;
        return (
          <Anim key={i} position={[x0, 0, 0]} scale={[Math.max(len, 0.0001), 1, 1]} show={len > 0.001} speed={12}>
            <Box size={[1, height, 0.5]} position={[0.5, height / 2, 0]} color={p.color} glow={p.glow} radius={0.02} />
          </Anim>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------- the scene

export default function Scene({ stepId, labels, lang }: SceneProps) {
  const s = useContracts();
  const { compact } = useScene();
  const { atLeast } = useLevel();
  const expert = atLeast('expert');

  const account = stepId === 'account';
  const deploy = stepId === 'deploy';
  const call = stepId === 'call';
  const storage = stepId === 'storage';
  const evm = stepId === 'evm';
  const gas = stepId === 'gas';
  const reentrancy = stepId === 'reentrancy';

  // --- deploy
  const address = useMemo(() => createAddress(ALICE, s.nonce), [s.nonce]);

  // --- call / storage
  const aliceBal = s.bank.balances[ALICE] ?? 0n;
  const failed = call && s.last !== null && !s.last.ok;
  const slots = useMemo(() => KEY_IDS.map((k) => ({ id: k, hash: mappingSlot(KEY_ADDRESS[k], BALANCES_SLOT) })), []);
  const callPath = useMemo(() => [at(-4.4, 0.4, 1.3), at(-0.6, 0, 1.6)], []);
  const deployPath = useMemo(() => [at(-5.2, 0.9, 1.2), at(-0.2, 0.6, 0.6), at(3.6, 0.2, 1.4)], []);

  // --- evm stepper
  const e = s.evm;
  const peek = nextCost(PROGRAM, e);
  const stepCaption =
    e.status === 'running'
      ? `${instrText(PROGRAM[e.ip])} · ${peek === null ? '?' : num(peek, lang)} gas`
      : e.status === 'stopped'
        ? labels.finished
        : labels.outOfGas;

  // --- gas
  const tx = useMemo(() => sendTx(PROGRAM, s.gasLimit, s.nonZero ? { '0': 1n } : {}, GAS_PRICE_GWEI), [s.gasLimit, s.nonZero]);
  const BAR = 8.2;
  // On a phone the instruction names are hidden, so the gas bar can sit right under the blocks.
  const barV = compact ? 2 : 3.5;
  const perGas = BAR / MAX_GAS_LIMIT;
  const slotBefore = s.nonZero ? 1n : 0n;
  const slotAfter = tx.storage['0'] ?? 0n;

  // --- reentrancy
  const attack = useMemo(() => simulateAttack({ others: s.others, deposit: 1, effectsFirst: s.effectsFirst }), [s.others, s.effectsFirst]);
  const ai = Math.min(s.attackStep, attack.events.length - 1);
  const ev = attack.events[ai];
  const finished = ai === attack.events.length - 1 && ai > 0;

  const machineAt: Vec3 = account ? at(2.4, 0) : deploy ? at(4, 0) : call ? at(-0.4, 0) : reentrancy ? at(-2.6, 0) : at(-0.4, 0);
  const showMachine = account || deploy || call || reentrancy;
  const pickContract = account && s.inspect === 'contract';
  const pickEoa = account && s.inspect === 'eoa';

  return (
    <>
      <ShadowGround />

      {/* The contract: a machine at an address. */}
      <Anim show={showMachine} position={machineAt}>
        <Platform size={[2.6, 2.6]} position={[0, 0, 0]} color="ground" height={0.16} />
        <ContractMachine size={1.3} color={failed ? 'invalid' : 'contract'} glow={pickContract || failed} />
      </Anim>

      {/* ------------------------------------------------ 1. two kinds of account */}
      <Anim show={account}>
        <group position={at(-3.2, 0)}>
          <Platform size={[2.2, 2.2]} position={[0, 0, 0]} color="ground" height={0.16} />
          <Person color="actor" glow={pickEoa} />
          <Anim position={[0, pickEoa ? 2.15 : 1.9, 0]}>
            <Key />
          </Anim>
        </group>
        <group position={at(-1.9, 0.7)}>
          <CoinStack count={3} radius={0.24} />
        </group>
        <group position={at(4, 0.6)}>
          <CoinStack count={3} radius={0.24} />
        </group>
        {/* The contract's code and storage float above it. */}
        <Anim position={at(2.4, 0, pickContract ? 2.75 : 2.5)}>
          <Bytes count={5} />
        </Anim>
        <group position={at(4.3, -1.3)} rotation={FACE}>
          <Drawer filled glow={pickContract} width={1.2} />
        </group>
        <Label position={at(-3.2, 1.5, -0.3)} tone="actor">
          {labels.eoa}
        </Label>
        <Label position={at(-3.2, 2.15, -0.3)} tone="plain">
          {labels.eoaCaption}
        </Label>
        <Label position={at(2.6, 1.5, -0.3)} tone="block">
          {labels.contractAccount}
        </Label>
        <Label position={at(2.6, 2.15, -0.3)} tone="plain">
          {labels.contractCaption}
        </Label>
        <Label position={at(-3.2, 0, 3.05)} minLevel="intermediate" tone="tx" show={pickEoa}>
          {labels.privateKey}
        </Label>
        <Label position={at(2.4, 0, 3.55)} minLevel="intermediate" tone="block" show={pickContract}>
          {labels.code}
        </Label>
        <Label position={at(5.3, -1.3, 1.2)} minLevel="intermediate" tone="block" show={pickContract}>
          {labels.storage}
        </Label>
      </Anim>

      {/* ------------------------------------------------ 2. deployment */}
      <Anim show={deploy}>
        <group position={at(-5.6, 0.9)}>
          <Person color="actor" />
        </group>
        {/* One slab per transaction the sender has already sent: the nonce. */}
        <group position={at(-4.6, 1.5)}>
          {Array.from({ length: s.nonce }, (_, i) => (
            <Box key={i} size={[0.5, 0.09, 0.5]} position={[0, 0.05 + i * 0.11, 0]} color="tx" radius={0.02} />
          ))}
          <Box size={[0.62, 0.05, 0.62]} position={[0, 0.02, 0]} color="neutral" radius={0.02} />
        </group>
        <Label position={at(-5.2, 2.2, -0.3)} tone="actor">
          {labels.alice} · nonce {s.nonce}
        </Label>
        <group position={at(-3.3, -0.9)}>
          <SourceCard />
        </group>
        <Label position={at(-3.3, -0.9, 2.75)}>{expert ? 'Counter.sol' : labels.source}</Label>
        <FlowLine points={[at(-2.3, -0.9, 1.1), at(-1.5, -0.9, 1.1)]} color="chain" />
        <group position={at(-0.2, -0.9, 0.9)}>
          <Bytes count={6} />
        </group>
        <Label position={at(-0.2, -0.9, 1.85)} tone="block">
          {expert ? '0x6080…' : labels.bytecode}
        </Label>
        <Label position={at(-1.9, -0.9, 0.45)} minLevel="intermediate" tone="plain">
          {labels.compile}
        </Label>
        <FlowLine points={[at(1.2, -0.9, 1.1), at(2.6, -0.5, 1.1)]} color="tx" />
        <Mover path={deployPath} duration={2.6} arc={0.5} playing={deploy}>
          <Packet />
        </Mover>
        <Label position={at(1.9, 0.6, -0.35)} minLevel="intermediate" tone="tx">
          {labels.creationTx}
        </Label>
        <Label position={at(4, 0, 2.6)} tone="valid">
          {shortHex(address)}
        </Label>
        <Label position={at(3.2, 0, 3.3)} minLevel="expert" tone="mono" show={!compact}>
          keccak256(rlp([sender, nonce]))[12:]
        </Label>
        <Label position={at(4, 1.6, -0.3)} maxLevel="intermediate" tone="plain">
          {labels.newAddress}
        </Label>
      </Anim>

      {/* ------------------------------------------------ 3. calling a function */}
      <Anim show={call}>
        <group position={at(-4.6, 0.4)}>
          <Person color="actor" />
        </group>
        <group position={at(-5.5, -0.5)}>
          <CoinStack count={Number((s.bank.wallets[ALICE] ?? 0n) / WEI)} radius={0.24} />
        </group>
        <Label position={at(-4.9, 1.6, -0.3)} tone="actor">
          {labels.alice} · {eth(s.bank.wallets[ALICE] ?? 0n, lang)} ETH
        </Label>
        <OneShot trigger={s.seq} path={callPath}>
          <Packet color={failed ? 'invalid' : 'tx'} />
        </OneShot>
        <Label position={at(-2.5, 0.2, 2.75)} tone={failed ? 'invalid' : 'tx'} show={s.last !== null}>
          {s.last ? (expert ? shortCalldata(s.last.calldata) : s.last.signature) : ''}
          {s.last && s.last.value > 0n ? ` + ${eth(s.last.value, lang)} ETH` : ''}
        </Label>
        <Label position={at(-0.4, 0, 2.6)} tone="invalid" show={failed}>
          revert
        </Label>
        {/* The contract's own ETH. */}
        <group position={at(1.1, 1)}>
          <CoinStack count={Number(s.bank.eth / WEI)} radius={0.24} />
        </group>
        <Label position={at(0.2, 1.8, -0.3)} tone="tx">
          {labels.contractHolds} {eth(s.bank.eth, lang)} ETH
        </Label>
        {/* Storage: slot 0 and Alice's entry in the mapping. */}
        <group position={at(4.3, 0.5)} rotation={FACE}>
          <Box size={[2, 1.75, 0.5]} position={[0, 0.88, -0.3]} color="platform" radius={0.06} />
          <group position={[0, 0.95, 0]}>
            <Drawer filled={s.bank.count > 0n} glow={s.last?.ok === true && s.last.fn === 'increment'} width={1.7} />
          </group>
          <group position={[0, 0.2, 0]}>
            <Drawer filled={aliceBal > 0n} color="tokenA" glow={s.last?.ok === true && s.last.fn !== 'increment'} width={1.7} />
          </group>
        </group>
        <Label position={at(4.3, 0.5, 2.2)} tone="block">
          {expert ? `slot 0: count = ${s.bank.count}` : `count = ${s.bank.count}`}
        </Label>
        <Label position={at(4.3, 1.6, -0.3)} tone="tokenA">
          {compact ? `[Alice] = ${eth(aliceBal, lang)}` : `balances[Alice] = ${eth(aliceBal, lang)} ETH`}
        </Label>
        {/* Every node executes the same call. */}
        {[-3.4, -0.4, 2.6].map((u, i) => (
          <group key={i} position={at(u, -3)} scale={0.62}>
            <NodeTower units={2} light={failed ? 'invalid' : 'valid'} />
          </group>
        ))}
        <Label position={at(-0.4, -3, 1.15)} tone="plain">
          {labels.everyNode}
        </Label>
      </Anim>

      {/* ------------------------------------------------ 4. storage */}
      <Anim show={storage}>
        {/* The numbered slots a compiler hands out in order. */}
        <group position={at(-3.3, -0.4)} rotation={FACE}>
          <group position={[0, 0.7, 0]}>
            <Drawer filled={s.bank.count > 0n} width={1.5} />
          </group>
          <group position={[0, 0, 0]}>
            <Drawer filled={false} color="tokenA" width={1.5} />
          </group>
        </group>
        <Label position={at(-3.3, -0.4, 1.75)} tone="block">
          {expert ? `slot 0: count = ${s.bank.count}` : `0: count = ${s.bank.count}`}
        </Label>
        <Label position={at(-3.3, 0.9, -0.35)} tone="tokenA">
          {expert ? 'slot 1: balances' : '1: balances'}
        </Label>
        {/* The rest of the 2^256 slots: mapping entries land wherever their hash points. */}
        <group position={at(-1.2, -0.4)} rotation={FACE}>
          <Box size={[6.6, 0.12, 0.9]} position={[3.3, 0.06, 0]} color="platform" radius={0.04} />
        </group>
        {slots.map(({ id, hash }) => {
          const value = s.bank.balances[KEY_ADDRESS[id]] ?? 0n;
          const picked = s.key === id;
          return (
            <Anim key={id} position={at(-0.6 + railPos(hash) * 5.4, -0.4, picked ? 0.75 : 0.12)} speed={8}>
              <group rotation={FACE}>
                <Drawer filled={value > 0n} color="tokenA" glow={picked} width={0.95} />
              </group>
              <Label position={[0, 1.2, 0]} tone={picked ? 'tokenA' : 'plain'} show={picked || !compact}>
                {picked ? `${shortHex(hash, 6, 3)} = ${eth(value, lang)} ETH` : labels[id]}
              </Label>
            </Anim>
          );
        })}
        <Label position={at(2.2, 0.9, -0.35)} maxLevel="intermediate" tone="plain">
          {labels.hashSpace}
        </Label>
        <Label position={at(2.2, 0.9, -0.35)} minLevel="expert" tone="mono">
          keccak256(pad32(key) ‖ pad32(1))
        </Label>
      </Anim>

      {/* ------------------------------------------------ 5. the EVM, one opcode at a time */}
      <Anim show={evm || gas}>
        <Tape
          program={PROGRAM}
          ip={evm ? e.ip : tx.haltedAt}
          done={evm ? (e.status === 'running' ? e.ip : e.status === 'stopped' ? PROGRAM.length : e.ip) : tx.ok ? PROGRAM.length : tx.haltedAt}
          failed={evm ? e.status === 'out-of-gas' || e.status === 'invalid' : !tx.ok}
          caption={evm ? stepCaption : tx.ok ? labels.finished : `${labels.outOfGas}: ${PROGRAM[Math.min(tx.haltedAt, PROGRAM.length - 1)].name}`}
          showAll={!compact}
        />
      </Anim>
      <Anim show={evm}>
        {/* The stack: last in, first out. */}
        <group position={at(4.4, 0)}>
          <Platform size={[1.7, 1.3]} position={[0, 0.1, 0]} color="ground" height={0.1} />
          {[0, 1, 2].map((i) => (
            <Anim key={i} show={i < e.stack.length} position={[0, 0.1 + i * 0.5, 0]} speed={12}>
              <Box size={[1.3, 0.42, 0.9]} position={[0, 0.21, 0]} color="actor" glow={i === e.stack.length - 1} radius={0.06} />
            </Anim>
          ))}
        </group>
        {[0, 1, 2].map((i) => (
          <Label key={i} position={at(5.6, 0.2, 0.35 + i * 0.5)} tone="mono" show={i < e.stack.length && (!compact || i === e.stack.length - 1)}>
            {i < e.stack.length ? word(e.stack[i]) : ''}
          </Label>
        ))}
        <Label position={at(4.4, 1.2, -0.3)} tone="actor">
          {labels.stack}
        </Label>
        <group position={at(7, -0.6)} rotation={FACE}>
          <Drawer filled={(e.storage['0'] ?? 0n) > 0n} glow={e.lastOp === 'SSTORE' || e.lastOp === 'SLOAD'} width={1.4} />
        </group>
        <Label position={at(7, -0.6, 1.2)} tone="block">
          {expert ? `slot 0 = ${e.storage['0'] ?? 0n}` : `count = ${e.storage['0'] ?? 0n}`}
        </Label>
        {/* Gas left: the bar shrinks with every step. */}
        <group position={at(TAPE_U0 - 0.45, barV)}>
          <Bar
            parts={[
              { len: (e.gasLeft / e.gasStart) * BAR, color: 'valid', glow: true },
              { len: (1 - e.gasLeft / e.gasStart) * BAR, color: 'neutral' },
            ]}
          />
        </group>
        <Label position={at(TAPE_U0 + 1.2, barV + 0.8, -0.2)} tone="valid">
          {labels.gasLeft}: {num(e.gasLeft, lang)}
        </Label>
      </Anim>

      {/* ------------------------------------------------ 6. gas limit, out of gas, revert */}
      <Anim show={gas}>
        <group position={at(TAPE_U0 - 0.45, barV)}>
          <Bar
            parts={
              tx.ok
                ? [
                    { len: GAS.TX * perGas, color: 'chain' },
                    { len: (tx.gasUsed - GAS.TX) * perGas, color: 'tx', glow: true },
                    { len: tx.gasUnused * perGas, color: 'valid' },
                  ]
                : [
                    { len: GAS.TX * perGas, color: 'chain' },
                    { len: (tx.gasUsed - GAS.TX) * perGas, color: 'invalid', glow: true },
                  ]
            }
          />
          {/* A post where the gas this call needs ends. */}
          <group rotation={FACE}>
            <Anim position={[tx.gasNeeded * perGas, 0, 0]} speed={12}>
              <Box size={[0.07, 0.95, 0.6]} position={[0, 0.47, 0]} color="ink" radius={0.02} />
            </Anim>
          </group>
        </group>
        <Label position={at(TAPE_U0 + 0.6, barV + 0.8, -0.2)} tone="plain" show={!compact}>
          {labels.intrinsic} {num(GAS.TX, lang)}
        </Label>
        <Label position={at(TAPE_U0 - 0.45 + tx.gasLimit * perGas + (compact ? 0.9 : 1.1), barV, 0.2)} tone={tx.ok ? 'valid' : 'invalid'}>
          {compact ? num(tx.gasLimit, lang) : `${labels.limitShort} ${num(tx.gasLimit, lang)}`}
        </Label>
        <Label position={at(TAPE_U0 - 0.45 + tx.gasNeeded * perGas + 1.3, barV + 0.8, -0.2)} minLevel="intermediate" tone="mono">
          {labels.needs} {num(tx.gasNeeded, lang)}
        </Label>
        <group position={at(5.2, 0)} rotation={FACE}>
          <Drawer filled={slotAfter > 0n} glow={tx.ok} color={tx.ok ? 'block' : 'neutral'} width={1.5} />
        </group>
        <Label position={at(5.2, 0, 1.25)} tone={tx.ok ? 'valid' : 'invalid'}>
          {expert ? 'slot 0' : 'count'}: {tx.ok ? `${slotBefore} → ${slotAfter}` : `${slotAfter} (${labels.rolledBack})`}
        </Label>
        {/* The fee is paid either way. */}
        <group position={at(6.9, 0.4)}>
          <CoinStack count={Math.round(tx.gasUsed / 5000)} radius={0.22} glow />
        </group>
        <Label position={at(6.6, 1.3, -0.2)} tone="tx">
          {compact ? '' : `${labels.fee}: `}
          {num(tx.feeGwei / 1e9, lang, 6)} ETH
        </Label>
      </Anim>

      {/* ------------------------------------------------ 7. reentrancy */}
      <Anim show={reentrancy}>
        <group position={at(-4.3, 0.7)}>
          <CoinStack count={ev.vault} radius={0.26} />
        </group>
        <Label position={at(-3.4, 1.6, -0.3)} tone={finished && !attack.reverted && attack.stolen > 0 ? 'invalid' : 'block'}>
          {labels.vault}: {ev.vault} ETH
        </Label>
        <group position={at(2.8, 0)}>
          <Platform size={[2.4, 2.4]} position={[0, 0, 0]} color="ground" height={0.16} />
          <ContractMachine size={1.15} color="invalid" glow={ev.kind === 'send'} />
        </group>
        <group position={at(4.4, 0.7)}>
          <CoinStack count={ev.attacker} radius={0.26} />
        </group>
        <Label position={at(3.4, 1.6, -0.3)} tone="invalid">
          {labels.attacker}: {ev.attacker} ETH
        </Label>
        {/* One slab per nested withdraw() that has not returned yet. */}
        <group position={at(0.1, -0.6)}>
          <Platform size={[1.5, 1.5]} position={[0, 0.08, 0]} color="ground" height={0.08} />
          {Array.from({ length: Math.min(ev.depth, 14) }, (_, i) => (
            <Box key={i} size={[1.1, 0.15, 1.1]} position={[0, 0.17 + i * 0.19, 0]} color={ev.kind === 'revert' ? 'invalid' : 'tx'} glow={i === ev.depth - 1} radius={0.03} />
          ))}
        </group>
        <Label position={at(0.1, -0.6, 0.5 + Math.min(ev.depth, 14) * 0.19 + 0.5)} tone={ev.kind === 'revert' ? 'invalid' : 'tx'}>
          {ev.kind === 'revert' ? 'revert' : `${labels.depth} ${ev.depth}`}
        </Label>
        <FlowLine points={[at(1.9, 0.2, 1.5), at(0.1, -0.2, 2.2), at(-1.7, 0.2, 1.5)]} color="invalid" curved />
        <FlowLine points={[at(-1.6, 0.9, 0.5), at(1.8, 0.9, 0.5)]} color="tx" dashed />
        <Label position={at(-2.6, 0, 2.55)} minLevel="intermediate" tone="mono">
          {compact ? `[atk] = ${ev.recorded}` : `balances[attacker] = ${ev.recorded}`}
        </Label>
        <Label position={at(2.8, 0, 2.3)} minLevel="expert" tone="mono" show={!compact}>
          receive() → withdraw()
        </Label>
      </Anim>
    </>
  );
}

// ---------------------------------------------------------------- controls

/** One figure in the control panel: name and value on one line, so the panel stays low on a phone. */
function Stat({ name, tone, children }: { name: string; tone?: 'good' | 'bad'; children: ReactNode }) {
  return (
    <div className="ctl-stat" style={{ display: 'flex', alignItems: 'baseline', gap: 6, whiteSpace: 'nowrap' }}>
      <span>{name}</span>
      <strong data-tone={tone} style={{ fontSize: '0.82rem' }}>
        {children}
      </strong>
    </div>
  );
}

const panel = { gap: '6px 12px', maxWidth: 600 } as const;
const stats = { gap: '2px 14px', flexBasis: '100%' } as const;
const row = { display: 'flex', flexWrap: 'wrap', gap: 6, flexBasis: '100%' } as const;
const field = { display: 'flex', alignItems: 'center', gap: 10, flexBasis: '100%' } as const;

export function Controls({ stepId, labels, lang, level }: SceneProps) {
  const s = useContracts();
  const expert = level === 'expert';

  if (stepId === 'account') {
    const isEoa = s.inspect === 'eoa';
    const code = isEoa ? EMPTY_CODE_HASH : keccakHex(INCREMENT_CODE);
    const root = isEoa ? EMPTY_TRIE_ROOT : singleSlotStorageRoot(0n, 1n);
    return (
      <div className="ctl" style={panel}>
        <div className="ctl-title">{labels.tryInspect}</div>
        <div className="seg" role="group" aria-label={labels.tryInspect}>
          <button type="button" data-sc="eoa" aria-pressed={isEoa} onClick={() => s.setInspect('eoa')}>
            {labels.alice} (EOA)
          </button>
          <button type="button" data-sc="contract" aria-pressed={!isEoa} onClick={() => s.setInspect('contract')}>
            {labels.contractShort}
          </button>
        </div>
        <div className="ctl-stats" style={stats}>
          <Stat name="nonce">{isEoa ? 7 : 1}</Stat>
          <Stat name={labels.balance}>{isEoa ? num(2.5, lang, 1) : 3} ETH</Stat>
          <Stat name={expert ? 'codeHash' : labels.code}>{expert ? `${shortHex(code)}${isEoa ? ` (${labels.empty})` : ''}` : isEoa ? labels.none : `8 ${labels.bytes}`}</Stat>
          <Stat name={expert ? 'storageRoot' : labels.storage}>{expert ? `${shortHex(root)}${isEoa ? ` (${labels.empty})` : ''}` : isEoa ? labels.empty : `1 ${labels.slot}`}</Stat>
          <Stat name={labels.controlledBy}>{isEoa ? labels.privateKey : labels.code}</Stat>
        </div>
      </div>
    );
  }

  if (stepId === 'deploy') {
    return (
      <div className="ctl" style={panel}>
        <label className="ctl-field" style={field}>
          <span style={{ whiteSpace: 'nowrap', minWidth: '7.5em' }}>
            {labels.senderNonce}: {s.nonce}
          </span>
          <input id="sc-nonce" type="range" min={0} max={MAX_NONCE} step={1} value={s.nonce} onChange={(e) => s.setNonce(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
        </label>
        <div className="ctl-stats" style={stats}>
          <Stat name={labels.sender}>{shortHex(ALICE)}</Stat>
          {expert && <Stat name="rlp([sender, nonce])">{shortHex(createPreimage(ALICE, s.nonce), 8, 4)}</Stat>}
          <Stat name={labels.contractAddress} tone="good">
            <span title={createAddress(ALICE, s.nonce)}>{shortHex(createAddress(ALICE, s.nonce), 12, 10)}</span>
          </Stat>
        </div>
      </div>
    );
  }

  if (stepId === 'call') {
    const last = s.last;
    return (
      <div className="ctl" style={panel}>
        <div style={row}>
          <button type="button" className="btn btn-primary" data-sc="deposit" onClick={() => s.call('deposit')}>
            deposit() + 1 ETH
          </button>
          <button type="button" className="btn" data-sc="withdraw" onClick={() => s.call('withdraw')}>
            withdraw(1 ETH)
          </button>
          <button type="button" className="btn" data-sc="increment" onClick={() => s.call('increment')}>
            increment()
          </button>
          <button type="button" className="btn" data-sc="reset" onClick={s.resetBank} disabled={s.seq === 0}>
            {labels.reset}
          </button>
        </div>
        <div className="ctl-stats" style={stats} role="status">
          <Stat name="data">{last ? shortCalldata(last.calldata) : '—'}</Stat>
          <Stat name="value">{last ? `${eth(last.value, lang)} ETH` : '—'}</Stat>
          <Stat name={labels.result} tone={last ? (last.ok ? 'good' : 'bad') : undefined}>
            {!last ? labels.noCallYet : last.ok ? labels.success : `revert: ${labels[last.error === 'insufficient-funds' ? 'errFunds' : 'errBalance']}`}
          </Stat>
        </div>
      </div>
    );
  }

  if (stepId === 'storage') {
    const who = KEY_ADDRESS[s.key];
    const hash = mappingSlot(who, BALANCES_SLOT);
    const value = s.bank.balances[who] ?? 0n;
    return (
      <div className="ctl" style={panel}>
        <div style={row}>
          <div className="seg" role="group" aria-label={labels.mappingKey}>
            {KEY_IDS.map((k: KeyId) => (
              <button key={k} type="button" data-sc={`key-${k}`} aria-pressed={s.key === k} onClick={() => s.setKey(k)}>
                {labels[k]}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-primary" data-sc="deposit-as" onClick={() => s.call('deposit', who)}>
            {labels.depositAs}
          </button>
          <button type="button" className="btn" data-sc="reset" onClick={s.resetBank} disabled={s.seq === 0}>
            {labels.reset}
          </button>
        </div>
        <div className="ctl-stats" style={stats} role="status">
          <Stat name={labels.mappingKey}>{shortHex(who)}</Stat>
          <Stat name={labels.slot}>{expert ? shortHex(hash, 12, 8) : shortHex(hash, 8, 6)}</Stat>
          <Stat name={labels.value} tone={value > 0n ? 'good' : undefined}>
            {value > 0n ? `${eth(value, lang)} ETH` : `0 (${labels.notStored})`}
          </Stat>
        </div>
      </div>
    );
  }

  if (stepId === 'evm') {
    const e = s.evm;
    const running = e.status === 'running';
    return (
      <div className="ctl" style={panel}>
        <div style={row}>
          <button type="button" className="btn btn-primary" data-sc="step" onClick={s.step} disabled={!running}>
            {labels.stepBtn}
          </button>
          <button type="button" className="btn" data-sc="run" onClick={s.run} disabled={!running}>
            {labels.runBtn}
          </button>
          <button type="button" className="btn" data-sc="reset" onClick={s.resetEvm} disabled={e.steps === 0}>
            {labels.reset}
          </button>
        </div>
        <div className="ctl-stats" style={stats} role="status">
          <Stat name={labels.lastStep}>{e.lastOp ? `${e.lastOp} −${num(e.lastCost, lang)}` : '—'}</Stat>
          <Stat name={labels.gasLeft}>{num(e.gasLeft, lang)}</Stat>
          <Stat name={labels.gasUsed}>{num(e.gasStart - e.gasLeft, lang)}</Stat>
          <Stat name={labels.stack}>[{e.stack.map(word).join(', ')}]</Stat>
          <Stat name={expert ? 'slot 0' : 'count'} tone={e.status === 'stopped' ? 'good' : undefined}>
            {(e.storage['0'] ?? 0n).toString()}
          </Stat>
        </div>
      </div>
    );
  }

  if (stepId === 'gas') {
    const tx = sendTx(PROGRAM, s.gasLimit, s.nonZero ? { '0': 1n } : {}, GAS_PRICE_GWEI);
    return (
      <div className="ctl" style={panel}>
        <label className="ctl-field" style={field}>
          <span style={{ whiteSpace: 'nowrap', minWidth: '9.5em' }}>
            {labels.gasLimit}: {num(s.gasLimit, lang)}
          </span>
          <input id="sc-gas" type="range" min={MIN_GAS_LIMIT} max={MAX_GAS_LIMIT} step={GAS_LIMIT_STEP} value={s.gasLimit} onChange={(e) => s.setGasLimit(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
        </label>
        <label className="ctl-check" style={{ minHeight: 30 }}>
          <input id="sc-nonzero" type="checkbox" checked={s.nonZero} onChange={(e) => s.setNonZero(e.target.checked)} />
          {labels.slotNonZero}
        </label>
        <div className="ctl-stats" style={stats} role="status">
          <Stat name={labels.result} tone={tx.ok ? 'good' : 'bad'}>
            {tx.ok ? labels.success : labels.outOfGasRevert}
          </Stat>
          <Stat name={labels.gasUsed}>{num(tx.gasUsed, lang)}</Stat>
          <Stat name={labels.refunded}>{num(tx.gasUnused, lang)}</Stat>
          <Stat name={`${labels.fee} (${GAS_PRICE_GWEI} gwei)`}>{num(tx.feeGwei / 1e9, lang, 6)} ETH</Stat>
        </div>
      </div>
    );
  }

  if (stepId === 'reentrancy') {
    const attack = simulateAttack({ others: s.others, deposit: 1, effectsFirst: s.effectsFirst });
    const lastIndex = attack.events.length - 1;
    const i = Math.min(s.attackStep, lastIndex);
    const ev = attack.events[i];
    const done = i === lastIndex;
    const doing = ev.kind === 'call' ? 'withdraw()' : ev.kind === 'send' ? 'call{value: 1 ETH}' : ev.kind === 'write' ? 'balances[attacker] = 0' : 'revert';
    const outcome = i === 0 ? labels.ready : !done ? `${labels.depth} ${ev.depth}: ${doing}` : attack.reverted ? labels.attackReverted : attack.stolen > 0 ? `${labels.stolen} ${attack.stolen} ETH` : labels.nothingStolen;
    return (
      <div className="ctl" style={panel}>
        <label className="ctl-field" style={{ ...field, flexBasis: 240 }}>
          <span style={{ whiteSpace: 'nowrap', minWidth: '8.5em' }}>
            {labels.othersDeposit}: {s.others} ETH
          </span>
          <input id="sc-others" type="range" min={0} max={MAX_OTHERS} step={1} value={s.others} onChange={(e) => s.setOthers(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
        </label>
        <label className="ctl-check" style={{ minHeight: 30 }}>
          <input id="sc-cei" type="checkbox" checked={s.effectsFirst} onChange={(e) => s.setEffectsFirst(e.target.checked)} />
          {labels.effectsFirst}
        </label>
        <div style={row}>
          <button type="button" className="btn btn-primary" data-sc="next" onClick={() => s.setAttackStep(i + 1)} disabled={done}>
            {labels.nextCall}
          </button>
          <button type="button" className="btn" data-sc="attack" onClick={() => s.setAttackStep(lastIndex)} disabled={done}>
            {labels.runAttack}
          </button>
          <button type="button" className="btn" data-sc="reset" onClick={() => s.setAttackStep(0)} disabled={i === 0}>
            {labels.reset}
          </button>
        </div>
        <div className="ctl-stats" style={stats} role="status">
          <Stat name={labels.recorded}>{ev.recorded} ETH</Stat>
          <Stat name={labels.result} tone={!done || i === 0 ? undefined : attack.reverted || attack.stolen === 0 ? 'good' : 'bad'}>
            {outcome}
          </Stat>
        </div>
      </div>
    );
  }

  return null;
}
