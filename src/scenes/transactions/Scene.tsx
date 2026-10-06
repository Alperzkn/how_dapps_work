import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Group } from 'three';
import {
  Anim,
  Ball,
  Block,
  Box,
  ChainLink,
  CoinStack,
  Cyl,
  FlowLine,
  Label,
  Mat,
  Mover,
  NodeTower,
  Packet,
  Person,
  Platform,
  ShadowGround,
  Wallet,
  useLoop,
  type Vec3,
} from '../../scene/kit';
import type { SceneProps } from '../../scene/types';
import { keccakText, signText, verifyText } from '../../sim/keys';
import type { ColorKey } from '../../theme/tokens';
import type { Lang } from '../../types';
import {
  BLOCK_SLOTS,
  confirmationsAt,
  EDGES,
  feeBreakdown,
  GAS_TRANSFER,
  gossipHops,
  MAX_BASE,
  MAX_CONFIRMATIONS,
  MAX_FEE,
  MAX_TIP,
  maxBlocks,
  mempool,
  MIN_BASE,
  MIN_TIP,
  OTHER_TIPS,
  type TxId,
} from './logic';
import { BOB as BOB_KEYS, MAX_MESSAGE, useTx } from './state';

const STEPS = ['keys', 'sign', 'broadcast', 'mempool', 'included', 'confirmations'];

// The story runs left to right along x: Alice's wallet, the network, a mempool, the chain, Bob.
const ALICE: Vec3 = [-9.6, 0, -1.4];
const ROW_Z = 2.2;
const NODES: Vec3[] = [
  [-2.6, 0, 0],
  [0, 0, -2.8],
  [0, 0, 2.8],
  [3.4, 0, -2.6],
];
const NODE_NAMES = ['A', 'B', 'C', 'D'];
const TRAY_X = 3.4;
const CHAIN_X = 8.4;
const BSIZE = 1.4;
/** Blocks already on the chain sit towards the viewer; new ones are added away from it (towards -z). */
const OLD_STEP = 2.5;
const NEW_STEP = 1.8;
const blockZ = (k: number) => -(k - 1) * NEW_STEP;
const SHOWN_BLOCKS = 7;
/** On the "into a block" step the two batches of the mempool are enough. */
const INCLUDED_MAX = 2;
const PRODUCER: Vec3 = [6, 0, 1.9];
const BOB: Vec3 = [11.2, 0, 0];
const FACE: Vec3 = [0, Math.PI / 4, 0];

const top = (p: Vec3, y = 1.5): Vec3 => [p[0], y, p[2]];
const slotX = (i: number) => TRAY_X + 1.8 - i * 0.72;
const pedestal = (tip: number) => 0.12 + tip * 0.16;

const locale = (lang: Lang) => (lang === 'tr' ? 'tr-TR' : 'en-US');
function num(n: number, lang: Lang, digits = 0): string {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString(locale(lang), { minimumFractionDigits: 0, maximumFractionDigits: digits });
}
const gwei = (n: number, lang: Lang) => `${num(n, lang, 1)} gwei`;
/** 0x12ab…cdef */
const short = (hex: string, head = 4, tail = 4) => `${hex.slice(0, 2 + head)}…${hex.slice(-tail)}`;
const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);
const fill = (template: string, n: number | string) => template.replace('{n}', String(n));

/** Steps through timed phases in a loop. With reduced motion it stays on `initial`. */
function usePhase(durations: readonly number[], active: boolean, initial: number) {
  const [phase, setPhase] = useState(initial);
  const cur = useRef(initial);
  const start = useRef<number | null>(null);
  useEffect(() => {
    if (!active) start.current = null;
  }, [active]);
  useLoop((t) => {
    start.current ??= t;
    const total = durations.reduce((a, b) => a + b, 0);
    let local = (t - start.current) % total;
    let i = 0;
    while (i < durations.length - 1 && local >= durations[i]) {
      local -= durations[i];
      i++;
    }
    if (i !== cur.current) {
      cur.current = i;
      setPhase(i);
    }
  }, active);
  return phase;
}

/** An upright key: bow on top, bit pointing down. The origin is its tip. The teeth are cut from the key's own bytes. */
function KeyShape({ color, glow = false, cut }: { color: ColorKey; glow?: boolean; cut: string }) {
  const tooth = (i: number) => 0.14 + ((parseInt(cut.slice(2 + i * 2, 4 + i * 2), 16) || 0) / 255) * 0.3;
  return (
    <group>
      <mesh position={[0, 1.3, 0]} castShadow>
        <torusGeometry args={[0.27, 0.1, 10, 24]} />
        <Mat color={color} glow={glow} />
      </mesh>
      <Cyl radius={0.08} height={1} position={[0, 0.55, 0]} color={color} glow={glow} segments={12} />
      {[0.16, 0.36, 0.56].map((y, i) => (
        <Anim key={y} position={[0.06, y, 0]} scale={[tooth(i), 1, 1]} speed={9}>
          <Box size={[1, 0.13, 0.12]} position={[0.5, 0, 0]} color={color} glow={glow} radius={0.03} />
        </Anim>
      ))}
    </group>
  );
}

/** The public key drawn as a padlock: anyone may hold it, and it only checks. */
function Padlock({ light, body = 'neutral' }: { light?: ColorKey; body?: ColorKey }) {
  return (
    <group>
      <Box size={[1, 0.78, 0.44]} position={[0, 0.39, 0]} color={body} radius={0.1} />
      <mesh position={[0, 0.78, 0]} castShadow>
        <torusGeometry args={[0.28, 0.08, 10, 24, Math.PI]} />
        <Mat color="chain" />
      </mesh>
      <Cyl radius={0.1} height={0.06} position={[0, 0.44, 0.23]} rotation={[Math.PI / 2, 0, 0]} color="actor" />
      <Box size={[0.08, 0.2, 0.05]} position={[0, 0.3, 0.23]} color="actor" radius={0.02} />
      {light && <Ball radius={0.16} position={[0, 1.5, 0]} color={light} glow />}
    </group>
  );
}

const TILE_COLORS: ColorKey[] = ['actor', 'chain', 'neutral', 'block'];

/** The address drawn as a name plate on a post. Its tile pattern is read off the address itself. */
function AddressTag({ address }: { address: string }) {
  return (
    <group>
      <Cyl radius={0.06} height={0.6} position={[0, 0.3, 0]} color="chain" segments={10} />
      <Box size={[1.7, 0.6, 0.14]} position={[0, 0.85, 0]} color="platform" radius={0.08} />
      {Array.from({ length: 12 }, (_, i) => {
        const nibble = parseInt(address[2 + i] ?? '0', 16) || 0;
        return <Box key={i} size={[0.2, 0.2, 0.05]} position={[-0.66 + (i % 6) * 0.264, 0.97 - Math.floor(i / 6) * 0.24, 0.08]} color={TILE_COLORS[nibble % TILE_COLORS.length]} radius={0.03} />;
      })}
    </group>
  );
}

/** The transaction: a form lying on the table. The wax seal is whole only while the signature checks out. */
function TxSheet({ valid }: { valid: boolean }) {
  return (
    <group>
      <Box size={[1.7, 0.08, 2.3]} position={[0, 0.04, 0]} color="platform" radius={0.03} />
      <Box size={[1.5, 0.04, 0.3]} position={[0, 0.09, -0.9]} color="tx" glow radius={0.02} />
      {[-0.45, -0.15, 0.15].map((z, i) => (
        <Box key={z} size={[i === 1 ? 1 : 1.4, 0.03, 0.12]} position={[i === 1 ? -0.2 : 0, 0.09, z]} color="chain" radius={0.01} />
      ))}
      <Anim show={valid} position={[0.4, 0.08, 0.75]} speed={6}>
        <Cyl radius={0.3} height={0.08} position={[0, 0.04, 0]} color="actor" glow />
        <Cyl radius={0.16} height={0.1} position={[0, 0.05, 0]} color="platform" />
      </Anim>
      {/* A broken seal: two halves pulled apart. */}
      <Anim show={!valid} position={[0.4, 0.08, 0.75]} speed={6}>
        <Box size={[0.26, 0.08, 0.5]} position={[-0.22, 0.04, 0]} rotation={[0, 0.35, 0]} color="invalid" glow radius={0.03} />
        <Box size={[0.26, 0.08, 0.5]} position={[0.22, 0.04, 0.06]} rotation={[0, -0.3, 0]} color="invalid" glow radius={0.03} />
      </Anim>
    </group>
  );
}

/** Presses down and lifts again, like stamping a seal. */
function Stamp({ active, children }: { active: boolean; children: ReactNode }) {
  const ref = useRef<Group>(null);
  useLoop((t) => {
    if (ref.current) ref.current.position.y = active ? Math.abs(Math.sin(t * 2.4)) * 0.55 : 0;
  });
  return <group ref={ref}>{children}</group>;
}

/** Idle hovering for things that wait. */
function Float({ offset = 0, amp = 0.1, children }: { offset?: number; amp?: number; children: ReactNode }) {
  const ref = useRef<Group>(null);
  useLoop((t) => {
    if (ref.current) ref.current.position.y = (Math.sin(t * 2.2 + offset) * 0.5 + 0.5) * amp;
  });
  return <group ref={ref}>{children}</group>;
}

/** A coin that rises and fades to nothing: the burned base fee. */
function Burn() {
  const ref = useRef<Group>(null);
  useLoop((t) => {
    const g = ref.current;
    if (!g) return;
    const u = (t % 1.8) / 1.8;
    g.position.y = u * 1.3;
    g.scale.setScalar(1 - u * 0.85);
  });
  return (
    <group ref={ref}>
      <Cyl radius={0.26} height={0.12} color="tx" glow />
    </group>
  );
}

/** An open tray: the waiting room for transactions. */
function Tray() {
  const w = 4.7;
  const d = 1.7;
  return (
    <group>
      <Box size={[w, 0.12, d]} position={[0, 0.06, 0]} color="neutral" radius={0.04} />
      <Box size={[w, 0.4, 0.12]} position={[0, 0.2, -d / 2]} color="neutral" radius={0.04} />
      <Box size={[w, 0.24, 0.12]} position={[0, 0.12, d / 2]} color="neutral" radius={0.04} />
      <Box size={[0.12, 0.4, d]} position={[-w / 2, 0.2, 0]} color="neutral" radius={0.04} />
      <Box size={[0.12, 0.4, d]} position={[w / 2, 0.2, 0]} color="neutral" radius={0.04} />
    </group>
  );
}

const HOP_TIME = 1.1;

/** One leg of the gossip wave: a parcel that flies from `from` to `to` during its time window of the cycle. */
function Hop({ from, to, start, cycle }: { from: Vec3; to: Vec3; start: number; cycle: number }) {
  const ref = useRef<Group>(null);
  const t0 = useRef<number | null>(null);
  useLoop((t) => {
    const g = ref.current;
    if (!g) return;
    t0.current ??= t;
    const u = (((t - t0.current) % cycle) - start) / HOP_TIME;
    g.visible = u >= 0 && u <= 1;
    if (!g.visible) return;
    const e = u * u * (3 - 2 * u);
    g.position.set(from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e + Math.sin(e * Math.PI) * 0.7, from[2] + (to[2] - from[2]) * e);
  });
  return (
    <group ref={ref} visible={false}>
      <Packet size={0.42} />
    </group>
  );
}

/**
 * The network. On the broadcast step the transaction enters at node `first` and spreads one hop at a time.
 * Remount (key) when `first` changes so the wave restarts from the wallet.
 */
function Network({ first, active, level, labels }: { first: number; active: boolean; level: SceneProps['level']; labels: Record<string, string> }) {
  const hops = useMemo(() => gossipHops(first), [first]);
  const far = Math.max(...hops);
  // Phase 0: wallet -> first node. Phase n: the nodes n − 1 hops away pass it on. Last phase: everyone has it.
  const durations = useMemo(() => [...Array<number>(far + 1).fill(HOP_TIME), 1.8], [far]);
  const cycle = durations.reduce((a, b) => a + b, 0);
  const phase = usePhase(durations, active, far + 1);
  const from: Vec3 = [ALICE[0], 1.5, ALICE[2]];
  return (
    <>
      {NODES.map((p, i) => {
        const has = active && phase > hops[i];
        return (
          <group key={i} position={p}>
            <NodeTower color={has ? 'tx' : 'neutral'} light="valid" glow={has && hops[i] === 0} />
            <Label position={[0, 2.2, 0]} show={active} tone={hops[i] === 0 ? 'tx' : 'plain'} maxLevel={hops[i] === 0 ? 'intermediate' : 'expert'}>
              {NODE_NAMES[i]} · {hops[i] === 0 ? (level === 'beginner' ? labels.firstShort : labels.firstNode) : fill(labels.hopN, hops[i])}
            </Label>
            <Label position={[0, 2.4, 0]} show={active && hops[i] === 0} minLevel="expert" tone="mono">
              {NODE_NAMES[i]} · eth_sendRawTransaction
            </Label>
          </group>
        );
      })}
      <Anim show={active}>
        <FlowLine points={[[ALICE[0] + 1.1, 0.06, ALICE[2] + 0.2], [NODES[first][0] - 0.8, 0.06, NODES[first][2] - 0.1]]} color="tx" dashed />
        {EDGES.map(([a, b]) => {
          const [near, away] = hops[a] <= hops[b] ? [a, b] : [b, a];
          const p = NODES[near];
          const q = NODES[away];
          const len = Math.hypot(q[0] - p[0], q[2] - p[2]);
          const ux = (q[0] - p[0]) / len;
          const uz = (q[2] - p[2]) / len;
          return (
            <group key={`${a}-${b}`}>
              <FlowLine points={[[p[0] + ux * 0.85, 0.06, p[2] + uz * 0.85], [q[0] - ux * 0.85, 0.06, q[2] - uz * 0.85]]} color="chain" dashed />
              <Hop from={top(p)} to={top(q)} start={HOP_TIME * (1 + hops[near])} cycle={cycle} />
            </group>
          );
        })}
        <Hop from={from} to={top(NODES[first])} start={0} cycle={cycle} />
      </Anim>
    </>
  );
}

export default function Scene({ stepId, level, lang, labels }: SceneProps) {
  const at = Math.max(0, STEPS.indexOf(stepId));
  const isKeys = at === 0;
  const isSign = at === 1;
  const isBroadcast = at === 2;
  const isMempool = at === 3;
  const isIncluded = at === 4;
  const isConfirm = at === 5;
  const detail = level !== 'beginner';

  const wallet = useTx((s) => s.wallet);
  const typed = useTx((s) => s.message);
  const signedMessage = useTx((s) => s.signedMessage);
  const verifier = useTx((s) => s.verifier);
  const first = useTx((s) => s.first);
  const tip = useTx((s) => s.tip);
  const baseFee = useTx((s) => s.baseFee);
  const blocks = useTx((s) => s.blocks);

  // Sign: a real ECDSA signature over keccak256(text), checked against the current text and the chosen key.
  const message = typed ?? labels.defaultMessage;
  const signedText = signedMessage ?? labels.defaultMessage;
  const signature = useMemo(() => signText(signedText, wallet.privateKey), [signedText, wallet.privateKey]);
  const checkKey = verifier === 'alice' ? wallet.publicKey : BOB_KEYS.publicKey;
  const valid = useMemo(() => verifyText(message, signature, checkKey), [message, signature, checkKey]);
  const digest = useMemo(() => keccakText(message), [message]);

  // Mempool and blocks.
  const pool = useMemo(() => mempool(tip, baseFee), [tip, baseFee]);
  const made = isIncluded ? Math.min(blocks, INCLUDED_MAX) : isConfirm ? Math.min(blocks, maxBlocks(pool.inclusionBlock)) : 0;
  const confirmations = confirmationsAt(made, pool.inclusionBlock);
  const inBlock = confirmations > 0;
  const fee = feeBreakdown(GAS_TRANSFER, baseFee, pool.effective);
  // The cheapest transaction that can actually be included (Alice is last but not includable above her ceiling).
  const lowest = pool.order[pool.includable ? pool.order.length - 1 : pool.order.length - 2];
  const aliceZ = blockZ(Math.max(pool.inclusionBlock, 1));
  const tipPath = useMemo<Vec3[]>(() => [[CHAIN_X, 1.9, aliceZ + 0.2], [PRODUCER[0], 1.7, PRODUCER[2]]], [aliceZ]);

  const keyPos: Vec3 = isKeys ? [-9.6, 0.1, ROW_Z] : isSign ? [-6.8, 0.25, 3.05] : [ALICE[0], 0.5, ALICE[2]];
  const lockPos: Vec3 = isSign ? [-4.9, 0, 2] : [-7.1, 0, ROW_Z];

  return (
    <>
      <ShadowGround />
      <Platform size={[7.2, 7]} position={[-7.5, 0, 0.9]} color="ground" height={0.25} />
      <Platform size={[10, 7.6]} position={[1.5, 0, 0]} color="ground" height={0.25} />
      <Platform size={[2.6, 19.4]} position={[CHAIN_X, 0, -3.1]} color="ground" height={0.25} />
      <Platform size={[2.6, 2.6]} position={[BOB[0], 0, BOB[2]]} color="ground" height={0.25} />

      {/* Alice's wallet. The private key lives here and never travels. */}
      <group position={ALICE}>
        <group scale={1.4}>
          <Wallet color="actor" glow={at <= 1} />
        </group>
        <Label position={[0, 1.95, 0]} show={at <= 2} tone="actor">
          {labels.alice}
          {isBroadcast && (
            <>
              <br />
              {labels.keyStays}
            </>
          )}
        </Label>
      </group>

      {/* Step 1-2: private key. */}
      <Anim position={keyPos} show={at <= 1} speed={5}>
        <Stamp active={isSign && valid}>
          <group rotation={FACE} scale={1.15}>
            <KeyShape color="actor" glow cut={wallet.privateKey} />
          </group>
        </Stamp>
        <Label position={[0, 2.5, 0]} show={isKeys} tone="actor">
          {labels.privateKey}
          {detail && (
            <>
              <br />
              {short(wallet.privateKey)}
            </>
          )}
        </Label>
      </Anim>

      {/* Step 1-2: public key. In step 2 it checks the signature. */}
      <Anim position={lockPos} show={at <= 1} speed={5}>
        <group rotation={FACE}>
          <Padlock light={isSign ? (valid ? 'valid' : 'invalid') : undefined} body={isSign && verifier === 'bob' ? 'tokenB' : 'neutral'} />
        </group>
        <Label position={[0, 2.1, 0]} show={isKeys}>
          {labels.publicKey}
          {detail && (
            <>
              <br />
              {short(wallet.publicKey)}
            </>
          )}
        </Label>
        <Label position={[0, 2.3, 0]} show={isSign} tone={valid ? 'valid' : 'invalid'}>
          {verifier === 'bob' && (
            <>
              {labels.bobKey}
              <br />
            </>
          )}
          {valid ? labels.verify : labels.verifyFail}
        </Label>
        <Label position={[2.3, 0.2, 0.4]} show={isSign} minLevel="expert" tone="mono">
          h = keccak256(msg) = {short(digest)}
          <br />
          verify(h, (r, s), Q) = {valid ? 'true' : 'false'}
        </Label>
      </Anim>

      {/* Step 1: address. */}
      <Anim position={[-4.6, 0, ROW_Z]} show={isKeys} speed={5}>
        <group rotation={FACE}>
          <AddressTag address={wallet.address} />
        </group>
        <Label position={[0.5, 2.15, -0.5]}>
          {labels.address}
          <br />
          {short(wallet.address)}
          <br />
          {labels.demoShort}
        </Label>
      </Anim>
      <Anim show={isKeys}>
        <FlowLine points={[[-8.95, 0.75, ROW_Z], [-7.95, 0.75, ROW_Z]]} color="chain" />
        <FlowLine points={[[-6.4, 0.75, ROW_Z], [-5.65, 0.75, ROW_Z]]} color="chain" />
        <Label position={[-8.3, -0.2, ROW_Z + 1.3]} minLevel="expert" tone="mono">
          Q = d · G
        </Label>
        <Label position={[-5.6, -0.2, ROW_Z + 1.3]} minLevel="expert" tone="mono">
          keccak256(Q)[12:]
        </Label>
      </Anim>

      {/* Step 2: the message, stamped by the key. */}
      <Anim position={[-7.2, 0, 2.3]} show={isSign} speed={5}>
        <TxSheet valid={valid} />
        <Label position={[-2.7, 0.3, 0.1]} tone="tx">
          {labels.transaction}
          <br />"{clip(message, 22)}"
          {message !== signedText && (
            <>
              <br />
              {labels.edited}
            </>
          )}
        </Label>
        <Label position={[1.5, 0.2, 2.2]} tone={valid ? 'actor' : 'invalid'} maxLevel="beginner">
          {labels.signature} {signature.r.slice(2, 8)}…
        </Label>
        <Label position={[1.5, 0.2, 2.2]} tone="mono" minLevel="intermediate">
          r = {short(signature.r)}
          <br />s = {short(signature.s)}
        </Label>
      </Anim>

      {/* Step 3: the signed transaction enters at one node and spreads hop by hop. */}
      <Network key={first} first={first} active={isBroadcast} level={level} labels={labels} />
      <Label position={[-6.2, 2.3, -0.9]} show={isBroadcast} tone="tx">
        {labels.signedTx}
      </Label>
      <Label position={[-3.2, 0.2, 3.4]} show={isBroadcast} tone="plain" maxLevel="intermediate">
        {labels.relay}
      </Label>
      <Label position={[-3.2, 0.2, 3.4]} show={isBroadcast} minLevel="expert" tone="mono">
        devp2p eth/68
      </Label>

      {/* Step 4: the waiting room, ordered by tip. */}
      <group position={[TRAY_X, 0, 0]}>
        <Tray />
      </group>
      <Anim show={isMempool} position={[slotX(1), 0.125, 0]}>
        <Box size={[2.16, 0.04, 1.5]} color="block" glow radius={0.02} />
      </Anim>
      <Label position={[TRAY_X - 3, 0.3, 0.9]} show={isMempool}>
        {labels.mempool}
      </Label>
      <Label position={[slotX(1) + 0.4, 0.2, -1.7]} show={isMempool} tone="block">
        {labels.nextBlock}
      </Label>
      {pool.order.map((id: TxId, rank) => {
        const ours = id === 'alice';
        const price = ours ? pool.effective : OTHER_TIPS[id];
        const batch = ours ? pool.inclusionBlock : Math.floor(rank / BLOCK_SLOTS) + 1;
        const taken = batch > 0 && made >= batch;
        const slot = Math.max(0, rank - BLOCK_SLOTS * made);
        const here = !ours || at >= 3;
        const stuck = ours && !pool.includable;
        const height = pedestal(price);
        const pos: Vec3 = taken ? [CHAIN_X + ((rank % BLOCK_SLOTS) - 1) * 0.42, BSIZE, blockZ(batch) + 0.25] : here ? [slotX(slot), height, 0] : top(NODES[3]);
        return (
          <group key={id}>
            <Anim position={[slotX(slot), 0.12, 0]} scale={[1, Math.max(height - 0.12, 0.01), 1]} show={here && !taken} speed={5}>
              <Box size={[0.46, 1, 0.46]} position={[0, 0.5, 0]} color="chain" radius={0.04} />
            </Anim>
            <Anim position={pos} show={here} speed={ours ? 5 : 4}>
              <Float offset={rank * 1.3} amp={isMempool ? 0.14 : 0}>
                <Packet size={ours ? 0.44 : 0.38} glow={ours && !stuck} color={stuck ? 'neutral' : 'tx'} />
              </Float>
              {ours && (
                <Label position={[0, 1.25, 0]} show={isMempool || (isIncluded && !taken)} tone={stuck ? 'invalid' : 'tx'}>
                  {labels.yourTx}
                  {isMempool && detail && !stuck && (
                    <>
                      <br />
                      min({num(tip, lang, 1)}, {MAX_FEE} − {num(baseFee, lang)}) = {gwei(price, lang)}
                    </>
                  )}
                  {isIncluded && !stuck && ` · ${labels.waits}`}
                  {stuck && (
                    <>
                      <br />
                      {labels.cannot}
                    </>
                  )}
                </Label>
              )}
            </Anim>
          </group>
        );
      })}
      <Label position={[slotX(0) + 0.3, 0, 1.4]} show={isMempool} tone="plain" maxLevel="beginner">
        {labels.highFee}
      </Label>
      <Label position={[slotX(5) + 0.1, 0, 1.4]} show={isMempool} tone="plain" maxLevel="beginner">
        {labels.lowFee}
      </Label>
      <Label position={[slotX(0) + 0.3, 0, 1.4]} show={isMempool} tone="plain" minLevel="intermediate">
        {labels.tip} {gwei(pool.order[0] === 'alice' ? pool.effective : OTHER_TIPS[pool.order[0]], lang)}
      </Label>
      <Label position={[slotX(5) + 0.1, 0, 1.4]} show={isMempool} tone="plain" minLevel="intermediate">
        {gwei(lowest === 'alice' ? pool.effective : OTHER_TIPS[lowest], lang)}
      </Label>
      <Label position={[TRAY_X + 0.4, -0.9, 2.4]} show={isMempool} minLevel="expert" tone="mono">
        tip = min(maxPriorityFeePerGas,
        <br />
        maxFeePerGas − baseFee)
        <br />= min({num(tip, lang, 1)}, {MAX_FEE} − {num(baseFee, lang)}) {pool.includable ? `= ${gwei(pool.effective, lang)}` : '< 0'}
      </Label>

      {/* The chain: two older blocks, then one new block per press of the button. */}
      {[1, 2].map((k) => (
        <group key={k} position={[CHAIN_X, 0, k * OLD_STEP]}>
          <Block color="block" size={BSIZE} />
          <Anim show={k === 2 || made >= 1}>
            <ChainLink from={[0, BSIZE / 2, -BSIZE / 2]} to={[0, BSIZE / 2, -OLD_STEP + BSIZE / 2]} />
          </Anim>
          <Label position={[0, BSIZE + 0.6, 0]} show={isIncluded && k === 1} minLevel="intermediate" tone="plain">
            #{102 - k}
          </Label>
        </group>
      ))}
      {Array.from({ length: SHOWN_BLOCKS }, (_, i) => {
        const k = i + 1;
        const ours = k === pool.inclusionBlock;
        const after = pool.inclusionBlock > 0 && k > pool.inclusionBlock;
        const newest = k === made;
        return (
          <Anim key={k} position={[CHAIN_X, 0, blockZ(k)]} show={made >= k} speed={7}>
            <Block color={after ? 'valid' : 'block'} size={BSIZE} glow={ours} />
            {k > 1 && <ChainLink from={[0, BSIZE / 2, BSIZE / 2]} to={[0, BSIZE / 2, NEW_STEP - BSIZE / 2]} />}
            {k > INCLUDED_MAX &&
              [-0.3, 0, 0.3].map((dx) => (
                <group key={dx} position={[dx, BSIZE, 0.25]}>
                  <Packet size={0.2} glow={false} />
                </group>
              ))}
            <Label position={[1.5, BSIZE + 0.3, -1.1]} show={isIncluded && newest} tone="block">
              {labels.newBlock}
              {detail && ` #${101 + k}`}
            </Label>
            <Label position={[0, BSIZE + 0.9, 0]} show={isConfirm && confirmationsAt(k, pool.inclusionBlock) > 0} tone="valid">
              {confirmationsAt(k, pool.inclusionBlock)}
            </Label>
          </Anim>
        );
      })}

      {/* Step 5: who built the block, and where the fee goes. */}
      <Anim position={PRODUCER} show={isIncluded} speed={5}>
        <Person color="actor" />
        <Label position={[-1.5, 0.2, 0.9]} tone="actor">
          {labels.producer}
        </Label>
        <Label position={[-1.5, -0.5, 1.6]} show={inBlock} minLevel="intermediate" maxLevel="intermediate" tone="plain">
          {labels.tipShort} · {num(fee.toProducer, lang)} gwei
        </Label>
        <Label position={[-1.5, -0.5, 1.6]} show={inBlock} minLevel="expert" tone="mono">
          gasUsed × tip = {num(fee.toProducer, lang)} gwei
        </Label>
      </Anim>
      <Anim show={isIncluded && detail && inBlock}>
        <Mover path={tipPath} duration={1.5} arc={0.6} playing={isIncluded && inBlock}>
          <Cyl radius={0.17} height={0.1} color="tx" glow />
        </Mover>
        <group position={[CHAIN_X, 2, aliceZ - 0.2]}>
          <Burn />
        </group>
        <Label position={[CHAIN_X, 3.9, aliceZ - 0.2]} tone="plain" maxLevel="intermediate">
          {labels.burnShort} · {num(fee.burned, lang)} gwei
        </Label>
        <Label position={[CHAIN_X, 3.9, aliceZ - 0.2]} minLevel="expert" tone="mono">
          gasUsed × baseFee = {num(fee.burned, lang)} gwei
        </Label>
      </Anim>

      {/* Step 6: every block on top is one more confirmation. */}
      <Label position={[1.6, 0.3, -6.9]} show={isConfirm} minLevel="expert" tone="mono">
        BTC: 6 blocks ≈ 60 min
        <br />
        ETH: finalized in 2–3 epochs
      </Label>

      {/* Bob only ever shows the world an address. */}
      <group position={BOB}>
        <Wallet color="actor" glow={isConfirm && inBlock} />
        <Anim position={[0, 0, 0.9]} show={isConfirm && inBlock} speed={4}>
          <CoinStack count={3} color="tx" radius={0.26} glow />
        </Anim>
        <Label position={isConfirm ? [2.5, 0.5, -1] : [0.9, -0.3, 1.5]} show={at >= 4} tone={isConfirm && inBlock ? 'valid' : 'actor'}>
          {labels.bob}
          {isConfirm && inBlock && detail && ' · +1 ETH'}
          {isConfirm && (
            <>
              <br />
              {inBlock ? `${confirmations} ${confirmations === 1 ? labels.confirmation : labels.confirmations}` : labels.bobWaiting}
            </>
          )}
        </Label>
      </group>
      <Anim show={isConfirm && inBlock}>
        <FlowLine points={[[CHAIN_X + 0.9, 0.7, aliceZ], [BOB[0] - 0.9, 0.7, 0]]} color="valid" dashed />
      </Anim>
    </>
  );
}

function Stat({ name, tone, children }: { name: string; tone?: 'good' | 'bad'; children: ReactNode }) {
  return (
    <div className="ctl-stat">
      <span>{name}</span>
      <strong data-tone={tone}>{children}</strong>
    </div>
  );
}

function KeysControls({ labels }: SceneProps) {
  const wallet = useTx((s) => s.wallet);
  const newWallet = useTx((s) => s.newWallet);
  return (
    <div className="ctl" style={{ gap: '6px 12px', maxWidth: 520 }}>
      <button type="button" className="btn btn-primary" onClick={newWallet}>
        {labels.newWallet}
      </button>
      <span style={{ flex: 1, minWidth: 120, fontSize: '0.76rem', fontWeight: 600, color: 'var(--c-invalid)' }}>{labels.demoWarning}</span>
      <div className="ctl-stats" style={{ flexBasis: '100%' }}>
        <Stat name={labels.privateKey}>{short(wallet.privateKey)}</Stat>
        <Stat name={labels.publicKey}>{short(wallet.publicKey)}</Stat>
        <Stat name={labels.address}>{short(wallet.address)}</Stat>
      </div>
    </div>
  );
}

function SignControls({ labels }: SceneProps) {
  const wallet = useTx((s) => s.wallet);
  const typed = useTx((s) => s.message);
  const signedMessage = useTx((s) => s.signedMessage);
  const verifier = useTx((s) => s.verifier);
  const setMessage = useTx((s) => s.setMessage);
  const sign = useTx((s) => s.sign);
  const setVerifier = useTx((s) => s.setVerifier);
  const message = typed ?? labels.defaultMessage;
  const signedText = signedMessage ?? labels.defaultMessage;
  const signature = signText(signedText, wallet.privateKey);
  const valid = verifyText(message, signature, verifier === 'alice' ? wallet.publicKey : BOB_KEYS.publicKey);
  const fresh = message === signedText;
  return (
    <div className="ctl" style={{ gap: '6px 12px', maxWidth: 520 }}>
      <label className="ctl-field">
        <span>{labels.messageLabel}</span>
        <input type="text" value={message} maxLength={MAX_MESSAGE} onChange={(e) => setMessage(e.target.value)} spellCheck={false} autoComplete="off" />
      </label>
      <button type="button" className="btn btn-primary" onClick={sign} disabled={fresh} style={{ alignSelf: 'flex-end' }}>
        {fresh ? labels.signed : labels.signAgain}
      </button>
      <label className="ctl-check" style={{ fontSize: '0.8rem' }}>
        <input type="checkbox" checked={verifier === 'bob'} onChange={(e) => setVerifier(e.target.checked ? 'bob' : 'alice')} />
        {labels.useBobKey}
      </label>
      <div className="ctl-stats">
        <Stat name={labels.result} tone={valid ? 'good' : 'bad'}>
          {valid ? labels.valid : labels.invalid}
        </Stat>
      </div>
    </div>
  );
}

function BroadcastControls({ labels }: SceneProps) {
  const first = useTx((s) => s.first);
  const setFirst = useTx((s) => s.setFirst);
  const far = Math.max(...gossipHops(first));
  return (
    <div className="ctl" style={{ gap: '6px 14px' }}>
      <div className="ctl-field" style={{ flex: 'none', minWidth: 0 }}>
        <span id="first-node">{labels.pickNode}</span>
        <div className="seg" role="group" aria-labelledby="first-node">
          {NODE_NAMES.map((name, i) => (
            <button key={name} type="button" aria-pressed={i === first} onClick={() => setFirst(i)}>
              {name}
            </button>
          ))}
        </div>
      </div>
      <Stat name={labels.hopsAll}>{far}</Stat>
    </div>
  );
}

function MempoolControls({ labels, lang }: SceneProps) {
  const tip = useTx((s) => s.tip);
  const baseFee = useTx((s) => s.baseFee);
  const setTip = useTx((s) => s.setTip);
  const setBaseFee = useTx((s) => s.setBaseFee);
  const pool = mempool(tip, baseFee);
  const row = { display: 'flex', alignItems: 'center', gap: 10, flexBasis: '100%' } as const;
  const name = { whiteSpace: 'nowrap', minWidth: '10.5em' } as const;
  return (
    <div className="ctl" style={{ gap: '2px 14px', maxWidth: 520 }}>
      <label className="ctl-field" style={row}>
        <span style={name}>
          {labels.tipLabel}: {gwei(tip, lang)}
        </span>
        <input id="tip" type="range" min={MIN_TIP} max={MAX_TIP} step={0.5} value={tip} onChange={(e) => setTip(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <label className="ctl-field" style={row}>
        <span style={name}>
          {labels.baseLabel}: {gwei(baseFee, lang)}
        </span>
        <input id="base-fee" type="range" min={MIN_BASE} max={MAX_BASE} step={1} value={baseFee} onChange={(e) => setBaseFee(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <div className="ctl-stats">
        <Stat name={labels.posLabel}>{pool.includable ? `${pool.rank + 1} / ${pool.order.length}` : '–'}</Stat>
        <Stat name={labels.nextLabel} tone={pool.inNextBlock ? 'good' : 'bad'}>
          {pool.inNextBlock ? labels.yes : pool.includable ? labels.no : labels.cannot}
        </Stat>
        <Stat name={labels.effLabel}>{pool.includable ? gwei(pool.effective, lang) : '–'}</Stat>
      </div>
    </div>
  );
}

function BlockControls({ labels, lang, level, stepId }: SceneProps) {
  const tip = useTx((s) => s.tip);
  const baseFee = useTx((s) => s.baseFee);
  const blocks = useTx((s) => s.blocks);
  const produce = useTx((s) => s.produce);
  const restart = useTx((s) => s.restart);
  const pool = mempool(tip, baseFee);
  const confirming = stepId === 'confirmations';
  const max = confirming ? maxBlocks(pool.inclusionBlock) : INCLUDED_MAX;
  const made = Math.min(blocks, max);
  const confirmations = confirmationsAt(made, pool.inclusionBlock);
  const fee = feeBreakdown(GAS_TRANSFER, baseFee, pool.effective);
  const status = confirmations > 0 ? fill(labels.inBlock, 101 + pool.inclusionBlock) : pool.includable ? labels.waiting : labels.cannot;
  return (
    <div className="ctl" style={{ gap: '6px 12px', maxWidth: 540 }}>
      <button type="button" className="btn btn-primary" onClick={() => produce(max)} disabled={made >= max}>
        {made >= max ? (confirming ? labels.maxReached : labels.emptyPool) : labels.produce}
      </button>
      <button type="button" className="btn" onClick={restart} disabled={made <= 1}>
        {labels.restart}
      </button>
      <div className="ctl-stats" style={{ flexBasis: '100%' }}>
        {confirming ? (
          <>
            <Stat name={labels.confLabel} tone={confirmations >= MAX_CONFIRMATIONS ? 'good' : confirmations === 0 ? 'bad' : undefined}>
              {confirmations}
            </Stat>
            <Stat name={labels.btcRule}>
              {Math.min(confirmations, MAX_CONFIRMATIONS)} / {MAX_CONFIRMATIONS}
            </Stat>
            {level !== 'beginner' && (
              <Stat name={labels.btcTime}>
                ≈ {confirmations * 10} {labels.minutes}
              </Stat>
            )}
          </>
        ) : (
          <>
            <Stat name={labels.txStatus} tone={confirmations > 0 ? 'good' : 'bad'}>
              {status}
            </Stat>
            <Stat name={labels.feePaid}>{confirmations > 0 ? `${num(fee.totalEth, lang, 6)} ETH` : '–'}</Stat>
          </>
        )}
      </div>
    </div>
  );
}

export function Controls(props: SceneProps) {
  switch (props.stepId) {
    case 'keys':
      return <KeysControls {...props} />;
    case 'sign':
      return <SignControls {...props} />;
    case 'broadcast':
      return <BroadcastControls {...props} />;
    case 'mempool':
      return <MempoolControls {...props} />;
    case 'included':
    case 'confirmations':
      return <BlockControls {...props} />;
    default:
      return null;
  }
}
