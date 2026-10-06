import { useEffect, useRef, useState, type ReactNode } from 'react';
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
import type { ColorKey } from '../../theme/tokens';

const STEPS = ['keys', 'sign', 'broadcast', 'mempool', 'included', 'confirmations'];

// The story runs left to right along x: Alice's wallet, the network, a mempool, the chain, Bob.
const ALICE: Vec3 = [-9.6, 0, -1.4];
const ROW_Z = 2.2;
const N1: Vec3 = [-2.6, 0, 0];
const N2: Vec3 = [0, 0, -2.8];
const N3: Vec3 = [0, 0, 2.8];
const N4: Vec3 = [3.4, 0, -2.6];
const TRAY_X = 3.4;
const CHAIN_X = 8.4;
const STEP_Z = 2.5;
const BSIZE = 1.4;
const BOB: Vec3 = [11.2, 0, 0];
const FACE: Vec3 = [0, Math.PI / 4, 0];

const top = (p: Vec3, y = 1.5): Vec3 => [p[0], y, p[2]];
const PATH_A: Vec3[] = [[ALICE[0], 1.5, ALICE[2]], top(N1), top(N2), top(N4)];
const PATH_B: Vec3[] = [[ALICE[0], 1.5, ALICE[2]], top(N1), top(N3), top(N4)];
const TIP_PATH: Vec3[] = [
  [CHAIN_X, 1.9, 0.2],
  [CHAIN_X, 1.7, 2.7],
];

/** Priority fee of each waiting transaction, in gwei, already sorted. Index 2 is ours. */
const TIPS = [5, 3, 2, 2, 1.5, 1];
const OURS = 2;
const TAKEN = 3;
const slotX = (i: number) => TRAY_X + 1.8 - i * 0.72;
const pedestal = (i: number) => 0.12 + TIPS[i] * 0.16;

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

/** An upright key: bow on top, bit pointing down. The origin is its tip. */
function KeyShape({ color, glow = false }: { color: ColorKey; glow?: boolean }) {
  return (
    <group>
      <mesh position={[0, 1.3, 0]} castShadow>
        <torusGeometry args={[0.27, 0.1, 10, 24]} />
        <Mat color={color} glow={glow} />
      </mesh>
      <Cyl radius={0.08} height={1} position={[0, 0.55, 0]} color={color} glow={glow} segments={12} />
      <Box size={[0.32, 0.13, 0.12]} position={[0.18, 0.16, 0]} color={color} glow={glow} radius={0.03} />
      <Box size={[0.22, 0.13, 0.12]} position={[0.13, 0.42, 0]} color={color} glow={glow} radius={0.03} />
    </group>
  );
}

/** The public key drawn as a padlock: anyone may hold it, and it only checks. */
function Padlock({ light }: { light?: ColorKey }) {
  return (
    <group>
      <Box size={[1, 0.78, 0.44]} position={[0, 0.39, 0]} color="neutral" radius={0.1} />
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

/** The address drawn as a name plate on a post. */
function AddressTag() {
  return (
    <group>
      <Cyl radius={0.06} height={0.6} position={[0, 0.3, 0]} color="chain" segments={10} />
      <Box size={[1.7, 0.6, 0.14]} position={[0, 0.85, 0]} color="platform" radius={0.08} />
      <Ball radius={0.12} position={[-0.58, 0.85, 0.08]} color="actor" />
      <Box size={[0.9, 0.09, 0.04]} position={[0.2, 0.93, 0.08]} color="chain" radius={0.02} />
      <Box size={[0.6, 0.09, 0.04]} position={[0.05, 0.75, 0.08]} color="neutral" radius={0.02} />
    </group>
  );
}

/** The unsigned transaction: a form lying on the table, with a wax seal once signed. */
function TxSheet({ sealed }: { sealed: boolean }) {
  return (
    <group>
      <Box size={[1.7, 0.08, 2.3]} position={[0, 0.04, 0]} color="platform" radius={0.03} />
      <Box size={[1.5, 0.04, 0.3]} position={[0, 0.09, -0.9]} color="tx" glow radius={0.02} />
      {[-0.45, -0.15, 0.15].map((z, i) => (
        <Box key={z} size={[i === 1 ? 1 : 1.4, 0.03, 0.12]} position={[i === 1 ? -0.2 : 0, 0.09, z]} color="chain" radius={0.01} />
      ))}
      <Anim show={sealed} position={[0.4, 0.08, 0.75]} speed={4}>
        <Cyl radius={0.3} height={0.08} position={[0, 0.04, 0]} color="actor" glow />
        <Cyl radius={0.16} height={0.1} position={[0, 0.05, 0]} color="platform" />
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

export default function Scene({ stepId, level, labels }: SceneProps) {
  const at = Math.max(0, STEPS.indexOf(stepId));
  const isKeys = at === 0;
  const isSign = at === 1;
  const isBroadcast = at === 2;
  const isMempool = at === 3;
  const isIncluded = at === 4;
  const isConfirm = at === 5;
  const inBlock = at >= 4;
  const detail = level !== 'beginner';

  // Blocks built on top of ours, one every beat.
  const extra = usePhase([1.3, 1.3, 1.3, 2.6], isConfirm, 3);
  const confirmations = isConfirm ? extra + 1 : 1;

  const keyPos: Vec3 = isKeys ? [-9.6, 0.1, ROW_Z] : isSign ? [-6.8, 0.25, 3.05] : [ALICE[0], 0.5, ALICE[2]];
  const lockPos: Vec3 = isSign ? [-4.9, 0, 2] : [-7.1, 0, ROW_Z];

  return (
    <>
      <ShadowGround />
      <Platform size={[7.2, 7]} position={[-7.5, 0, 0.9]} color="ground" height={0.25} />
      <Platform size={[10, 7.6]} position={[1.5, 0, 0]} color="ground" height={0.25} />
      <Platform size={[2.6, 15.6]} position={[CHAIN_X, 0, 1.2]} color="ground" height={0.25} />
      <Platform size={[2.6, 2.6]} position={[BOB[0], 0, BOB[2]]} color="ground" height={0.25} />

      {/* Alice's wallet. The private key lives here and never travels. */}
      <group position={ALICE}>
        <group scale={1.4}>
          <Wallet color="actor" glow={at <= 1} />
        </group>
        <Label position={[0, 2.2, 0]} show={at <= 2} tone="actor">
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
        <Stamp active={isSign}>
          <group rotation={FACE} scale={1.15}>
            <KeyShape color="actor" glow />
          </group>
        </Stamp>
        <Label position={[0, 2.5, 0]} show={isKeys} tone="actor">
          {labels.privateKey}
          {detail && (
            <>
              <br />
              {labels.privateKeyNote}
            </>
          )}
        </Label>
      </Anim>

      {/* Step 1-2: public key. In step 2 it checks the signature. */}
      <Anim position={lockPos} show={at <= 1} speed={5}>
        <group rotation={FACE}>
          <Padlock light={isSign ? 'valid' : undefined} />
        </group>
        <Label position={[0, 2.1, 0]} show={isKeys}>
          {labels.publicKey}
        </Label>
        <Label position={[0, 2.3, 0]} show={isSign} tone="valid">
          {labels.verify}
        </Label>
        <Label position={[0.6, -0.5, 2.4]} show={isSign} minLevel="expert" tone="mono">
          ecrecover(h, v, r, s) → 0x71C7…
        </Label>
      </Anim>

      {/* Step 1: address. */}
      <Anim position={[-4.6, 0, ROW_Z]} show={isKeys} speed={5}>
        <group rotation={FACE}>
          <AddressTag />
        </group>
        <Label position={[0, 2, 0]}>
          {labels.address}
          {detail && (
            <>
              <br />
              0x71C7…976F
            </>
          )}
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

      {/* Step 2: the transaction form, stamped by the key. */}
      <Anim position={[-7.2, 0, 2.3]} show={isSign} speed={5}>
        <TxSheet sealed={isSign} />
        <Label position={[-2.7, 0.3, 0.1]} tone="tx">
          {labels.transaction}
          {level === 'intermediate' && (
            <>
              <br />
              {labels.txSummary}
              <br />
              nonce 7
            </>
          )}
        </Label>
        <Label position={[1.5, 0.2, 2.2]} tone="actor" maxLevel="intermediate">
          {labels.signature}
        </Label>
        <Label position={[1.5, 0.2, 2.2]} tone="mono" minLevel="expert">
          sig = (r, s, yParity)
        </Label>
        <Label position={[-4.5, 0.2, -2.1]} tone="mono" minLevel="expert">
          nonce: 7
          <br />
          to: 0xB0b…
          <br />
          value: 1 ETH
          <br />
          gasLimit: 21000
          <br />
          maxFeePerGas: 30e9
          <br />
          maxPriorityFeePerGas: 2e9
        </Label>
      </Anim>

      {/* Step 3: the signed transaction hops from node to node. */}
      {[N1, N2, N3, N4].map((p, i) => (
        <group key={i} position={p}>
          <NodeTower color={isBroadcast ? 'tx' : 'neutral'} light="valid" />
        </group>
      ))}
      <Anim show={isBroadcast}>
        <FlowLine points={[[ALICE[0] + 1.1, 0.06, ALICE[2] + 0.2], [N1[0] - 0.8, 0.06, N1[2] - 0.1]]} color="tx" dashed />
        <FlowLine points={[[N1[0] + 0.5, 0.06, -0.7], [N2[0] - 0.6, 0.06, N2[2] + 0.6]]} color="chain" dashed />
        <FlowLine points={[[N1[0] + 0.5, 0.06, 0.7], [N3[0] - 0.6, 0.06, N3[2] - 0.6]]} color="chain" dashed />
        <FlowLine points={[[N2[0] + 0.8, 0.06, N2[2]], [N4[0] - 0.8, 0.06, N4[2]]]} color="chain" dashed />
        <FlowLine points={[[N3[0] + 0.7, 0.06, N3[2] - 0.5], [N4[0] - 0.4, 0.06, N4[2] + 0.9]]} color="chain" dashed />
        <Mover path={PATH_A} duration={4.2} arc={0.7} playing={isBroadcast}>
          <Packet size={0.42} />
        </Mover>
        <Mover path={PATH_B} duration={4.2} arc={0.7} playing={isBroadcast}>
          <Packet size={0.42} />
        </Mover>
        <Label position={[-5.6, 2.3, -0.5]} tone="tx">
          {labels.signedTx}
        </Label>
        <Label position={[N1[0], 2.2, N1[2]]} minLevel="intermediate" maxLevel="intermediate">
          {labels.firstNode}
        </Label>
        <Label position={[N1[0], 2.4, N1[2]]} minLevel="expert" tone="mono">
          eth_sendRawTransaction
        </Label>
        <Label position={[1.4, 0.2, 1.2]} tone="plain" maxLevel="intermediate">
          {labels.relay}
        </Label>
        <Label position={[1.4, 0.2, 1.2]} minLevel="expert" tone="mono">
          devp2p eth/68
          <br />
          NewPooledTransactionHashes
        </Label>
      </Anim>

      {/* Step 4: the waiting room, ordered by tip. */}
      <group position={[TRAY_X, 0, 0]}>
        <Tray />
      </group>
      <Label position={[TRAY_X - 2.9, 1.3, 0]} show={isMempool}>
        {labels.mempool}
      </Label>
      {TIPS.map((tip, i) => {
        const ours = i === OURS;
        const taken = inBlock && i < TAKEN;
        const slot = inBlock && i >= TAKEN ? i - TAKEN : i;
        const here = !ours || at >= 3;
        const pos: Vec3 = taken
          ? [CHAIN_X + (i - 1) * 0.42, BSIZE, 0.25]
          : here
            ? [slotX(slot), pedestal(i), 0]
            : top(N4);
        return (
          <group key={i}>
            <Anim position={[slotX(slot), 0.12, 0]} show={here && !taken} speed={4}>
              <Box size={[0.46, pedestal(i) - 0.12, 0.46]} position={[0, (pedestal(i) - 0.12) / 2, 0]} color="chain" radius={0.04} />
            </Anim>
            <Anim position={pos} show={here} speed={3 + i * 0.4}>
              <Float offset={i * 1.3} amp={isMempool ? 0.14 : 0}>
                <Packet size={ours ? 0.44 : 0.38} glow={ours} color="tx" />
              </Float>
              {ours && (
                <Label position={[0, 1.25, 0]} show={isMempool} tone="tx">
                  {labels.yourTx}
                  {detail && ` · ${tip} gwei`}
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
        {labels.tip} {TIPS[0]} gwei
      </Label>
      <Label position={[slotX(5) + 0.1, 0, 1.4]} show={isMempool} tone="plain" minLevel="intermediate">
        {TIPS[5]} gwei
      </Label>
      <Label position={[TRAY_X + 0.4, -0.9, 2.4]} show={isMempool} minLevel="expert" tone="mono">
        tip = min(maxPriorityFeePerGas,
        <br />
        maxFeePerGas − baseFee)
      </Label>

      {/* The chain: two older blocks, then ours, then the ones built on top. */}
      {[-2, -1].map((k) => (
        <group key={k} position={[CHAIN_X, 0, k * STEP_Z]}>
          <Block color="block" size={BSIZE} />
          <ChainLink from={[0, BSIZE / 2, BSIZE / 2]} to={[0, BSIZE / 2, STEP_Z - BSIZE / 2]} />
          <Label position={[0, BSIZE + 0.6, 0]} show={isIncluded} minLevel="intermediate" tone="plain">
            #{102 + k}
          </Label>
        </group>
      ))}
      <Anim position={[CHAIN_X, 0, 0]} show={inBlock} speed={5}>
        <Block color="block" size={BSIZE} glow />
        <Label position={[-1.3, BSIZE + 0.2, 1.3]} show={isIncluded} tone="block">
          {labels.newBlock}
          {detail && ' #102'}
        </Label>
        <Label position={[0, BSIZE + 0.9, 0]} show={isConfirm} tone="valid">
          1
        </Label>
      </Anim>

      {/* Step 5: who built the block, and where the fee goes. */}
      <Anim position={[CHAIN_X, 0, 2.7]} show={isIncluded} speed={5}>
        <Person color="actor" />
        <Label position={[0, -0.6, 1.1]} tone="actor">
          {labels.producer}
          {level === 'intermediate' && (
            <>
              <br />
              {labels.tipTo}
            </>
          )}
          {level === 'expert' && (
            <>
              <br />
              tip = gasUsed × priorityFee
            </>
          )}
        </Label>
      </Anim>
      <Anim show={isIncluded && detail}>
        <Mover path={TIP_PATH} duration={1.5} arc={0.6} playing={isIncluded}>
          <Cyl radius={0.17} height={0.1} color="tx" glow />
        </Mover>
        <group position={[CHAIN_X, 2, -0.2]}>
          <Burn />
        </group>
        <Label position={[CHAIN_X, 3.9, -0.2]} tone="plain" maxLevel="intermediate">
          {labels.burned}
        </Label>
        <Label position={[CHAIN_X, 3.9, -0.2]} minLevel="expert" tone="mono">
          burn = gasUsed × baseFee
        </Label>
      </Anim>

      {/* Step 6: every block on top is one more confirmation. */}
      {[1, 2, 3].map((k) => (
        <Anim key={k} position={[CHAIN_X, 0, k * STEP_Z]} show={isConfirm && extra >= k} speed={7}>
          <ChainLink from={[0, BSIZE / 2, -STEP_Z + BSIZE / 2]} to={[0, BSIZE / 2, -BSIZE / 2]} />
          <Block color="valid" size={BSIZE} />
          <Label position={[0, BSIZE + 0.9, 0]} tone="valid">
            {k + 1}
          </Label>
        </Anim>
      ))}
      <Label position={[10.6, 0.2, 6.8]} show={isConfirm} minLevel="expert" tone="mono">
        BTC: 6 blocks ≈ 60 min
        <br />
        ETH: finalized in 2–3 epochs
      </Label>

      {/* Bob only ever shows the world an address. */}
      <group position={BOB}>
        <Wallet color="actor" glow={isConfirm} />
        <Anim position={[0, 0, 0.9]} show={isConfirm} speed={4}>
          <CoinStack count={3} color="tx" radius={0.26} glow />
        </Anim>
        <Label position={[0.9, -0.3, 1.5]} show={inBlock} tone={isConfirm ? 'valid' : 'actor'}>
          {labels.bob}
          {isConfirm && detail && ' · +1 ETH'}
          {isConfirm && (
            <>
              <br />
              {confirmations} {confirmations === 1 ? labels.confirmation : labels.confirmations}
            </>
          )}
        </Label>
      </group>
      <Anim show={isConfirm}>
        <FlowLine points={[[CHAIN_X + 0.9, 0.7, 0], [BOB[0] - 0.9, 0.7, 0]]} color="valid" dashed />
      </Anim>
    </>
  );
}
