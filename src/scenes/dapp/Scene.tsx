import { useMemo, useRef, type ReactNode } from 'react';
import { Vector3, type Group } from 'three';
import { Anim, Ball, Box, ContractMachine, Cyl, FlowLine, Label, Mat, NodeTower, Packet, Person, Platform, Screen, ShadowGround, Wallet, useLoop, useScene, type Vec3 } from '../../scene/kit';
import type { SceneProps } from '../../scene/types';

// The stack, left to right: browser, wallet, RPC node, contract on the chain.
const S: Vec3 = [-6, 0, 0];
const W: Vec3 = [-2.4, 0, 0];
const R: Vec3 = [1.2, 0, 0];
const C: Vec3 = [5.2, 0.3, 0];
/** The "normal app" lane sits behind the dapp lane. */
const ZA = -4.6;
const HOST: Vec3 = [-6, 0, -3.6];
const INDEXER: Vec3 = [1.2, 0, 3.8];
const NODES: Vec3[] = [
  [7.5, 0, -1.7],
  [7.7, 0, 1.2],
  [4.7, 0, -2.9],
];

/** The contract step repeats every CYCLE seconds; the transaction reaches the machine at LANDS. */
const CYCLE = 4.5;
const LANDS = 2.2;

const up = (p: Vec3, y: number): Vec3 => [p[0], y, p[2]];

const PATHS = {
  appOut: [[-3.2, 0.5, ZA], [-0.5, 0.5, ZA]] as Vec3[],
  appBack: [[-0.5, 0.5, ZA], [-3.2, 0.5, ZA]] as Vec3[],
  whole: [up(S, 1), up(W, 1.1), up(R, 1.5), [C[0] - 0.4, 1.9, 0]] as Vec3[],
  files: [up(HOST, 1.1), [-6, 1.1, -0.3]] as Vec3[],
  request: [[-5, 1, 0.1], up(W, 1.25)] as Vec3[],
  signing: [up(W, 1.25), up(W, 1.25)] as Vec3[],
  signedOut: [up(W, 1.25), [-0.4, 0.9, 0]] as Vec3[],
  toRpc: [up(W, 1.1), up(R, 1.5)] as Vec3[],
  toChain: [up(R, 1.5), [C[0] - 0.4, 1.9, 0]] as Vec3[],
  readOut: [[-6, 1.8, 0], up(R, 1.6)] as Vec3[],
  readBack: [up(R, 1.6), [-6, 1.8, 0]] as Vec3[],
  intake: [up(R, 1.5), [C[0] - 0.4, 2.1, 0], [C[0] - 0.4, 1.75, 0]] as Vec3[],
  logToRpc: [[C[0], 2, 0], up(R, 1.5)] as Vec3[],
  logRpcToUi: [up(R, 1.5), [-6, 1.8, 0]] as Vec3[],
  logToIndexer: [[C[0], 2, 0.4], up(INDEXER, 1.1)] as Vec3[],
  logIndexerToUi: [up(INDEXER, 1.1), [-6, 1.3, 0.6]] as Vec3[],
};
const GOSSIP = NODES.map((n) => [up(R, 1.5), up(n, 1.5)] as Vec3[]);

/**
 * One leg of a repeating sequence: the child travels `path` between `from` and
 * `to` seconds of every `cycle` and is hidden for the rest of it.
 */
function Leg({ path, cycle, from, to, arc = 0.5, rest = true, children }: { path: Vec3[]; cycle: number; from: number; to: number; arc?: number; rest?: boolean; children: ReactNode }) {
  const { reducedMotion } = useScene();
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
  // With reduced motion nothing moves: each parcel rests at its destination, and legs marked rest={false} are left out.
  if (reducedMotion && !rest) return null;
  return (
    <group ref={ref} position={path[path.length - 1]}>
      {children}
    </group>
  );
}

function Bob({ amount = 0.12, speed = 2.4, children }: { amount?: number; speed?: number; children: ReactNode }) {
  const ref = useRef<Group>(null);
  useLoop((t) => {
    if (ref.current) ref.current.position.y = Math.sin(t * speed) * amount;
  });
  return <group ref={ref}>{children}</group>;
}

/** A transaction that carries a signature: a parcel with a green seal. */
function SignedTx() {
  return (
    <group>
      <Packet color="tx" size={0.4} />
      <Ball radius={0.11} position={[0, 0.46, 0]} color="valid" glow />
    </group>
  );
}

const Unsigned = () => <Packet color="neutral" size={0.36} glow={false} />;
const Query = () => <Packet color="block" size={0.3} />;
const LogPacket = () => <Packet color="valid" size={0.32} />;

function FileSheet() {
  return (
    <group rotation={[0.5, 0, 0]}>
      <Box size={[0.42, 0.54, 0.05]} color="neutral" radius={0.02} />
      <Box size={[0.26, 0.05, 0.02]} position={[0, 0.1, 0.04]} color="block" radius={0.01} />
      <Box size={[0.26, 0.05, 0.02]} position={[0, -0.04, 0.04]} color="chain" radius={0.01} />
    </group>
  );
}

/** The private key. It lives in the wallet and never travels. */
function Key() {
  return (
    <group rotation={[0, 0, -0.5]}>
      <mesh castShadow>
        <torusGeometry args={[0.17, 0.06, 10, 20]} />
        <Mat color="ink" />
      </mesh>
      <Box size={[0.56, 0.1, 0.1]} position={[0.44, 0, 0]} color="ink" radius={0.03} />
      <Box size={[0.1, 0.2, 0.1]} position={[0.52, -0.12, 0]} color="ink" radius={0.02} />
      <Box size={[0.1, 0.16, 0.1]} position={[0.68, -0.1, 0]} color="ink" radius={0.02} />
    </group>
  );
}

/** A sheet listing the contract's functions: the ABI the website ships with. */
function AbiCard() {
  return (
    <group rotation={[-0.35, 0, 0]}>
      <Box size={[0.9, 1.2, 0.06]} position={[0, 0.6, 0]} color="platform" radius={0.03} />
      {[0.95, 0.72, 0.49, 0.26].map((y, i) => (
        <Box key={y} size={[i % 2 ? 0.46 : 0.62, 0.08, 0.02]} position={[i % 2 ? -0.08 : 0, y, 0.04]} color={i === 0 ? 'contract' : 'neutral'} radius={0.01} />
      ))}
    </group>
  );
}

/** Calldata as a strip: 4-byte selector, then one 32-byte word per argument. */
function CalldataTape() {
  return (
    <group>
      <Box size={[0.42, 0.34, 0.34]} position={[-1.3, 0, 0]} color="tx" glow radius={0.05} />
      <Box size={[1.1, 0.34, 0.34]} position={[-0.48, 0, 0]} color="actor" radius={0.05} />
      <Box size={[1.1, 0.34, 0.34]} position={[0.68, 0, 0]} color="tokenA" radius={0.05} />
    </group>
  );
}

/**
 * A storage column whose height is a balance kept inside the contract.
 * While `live`, it flips from `before` to `after` each time the transaction lands.
 */
function Balance({ position, before, after, color, live }: { position: Vec3; before: number; after: number; color: 'actor' | 'tokenA'; live: boolean }) {
  const ref = useRef<Group>(null);
  useLoop((time, dt) => {
    const g = ref.current;
    if (!g) return;
    const goal = live && time % CYCLE < LANDS ? before : after;
    g.scale.y += (goal - g.scale.y) * (1 - Math.exp(-dt * 5));
  });
  return (
    <group position={position}>
      <Cyl radius={0.3} height={0.08} position={[0, 0.04, 0]} color="platform" />
      <group ref={ref} scale={[1, after, 1]}>
        <Box size={[0.42, 1, 0.42]} position={[0, 0.5, 0]} color={color} radius={0.04} />
      </group>
    </group>
  );
}

export default function Scene({ stepId, labels }: SceneProps) {
  const compare = stepId === 'compare';
  const frontend = stepId === 'frontend';
  const wallet = stepId === 'wallet';
  const rpc = stepId === 'rpc';
  const contract = stepId === 'contract';
  const events = stepId === 'events';
  const executed = contract || events;

  return (
    <>
      <ShadowGround />

      {/* Step 1 only: an ordinary app, where one company's server holds the data and the rules. */}
      <Anim show={compare}>
        <Platform size={[9.6, 3]} position={[-1.6, 0, ZA]} color="ground" height={0.2} />
        <group position={[-5.4, 0, ZA + 0.9]}>
          <Person color="actor" />
        </group>
        <group position={[-4.1, 0, ZA]}>
          <Screen face="neutral" />
        </group>
        <group position={[0.4, 0, ZA]}>
          <NodeTower units={3} color="neutral" light="invalid" />
        </group>
        <group position={[1.9, 0, ZA + 0.3]}>
          <Person color="chain" />
        </group>
        <FlowLine points={[[-3.1, 0.06, ZA], [-0.4, 0.06, ZA]]} color="chain" />
        <Leg path={PATHS.appOut} cycle={4} from={0} to={1.5} arc={0.3} rest={false}>
          <Unsigned />
        </Leg>
        <Leg path={PATHS.appBack} cycle={4} from={2} to={3.5} arc={0.3}>
          <Unsigned />
        </Leg>
        <Label position={[-4.1, 2.4, ZA]}>{labels.normalApp}</Label>
        <Label position={[1, 2.3, ZA]} tone="invalid">
          {labels.companyServer}
        </Label>
        <Label position={[-1.7, 1.9, ZA - 1.2]} minLevel="expert" tone="mono">
          {labels.privateApi}
        </Label>
      </Anim>

      {/* The dapp stack, present in every step. */}
      <Platform size={[9.8, 3.2]} position={[-2.3, 0, 0]} color="ground" height={0.2} />
      <group position={[-7, 0, 1]}>
        <Person color="actor" />
      </group>
      <group position={S}>
        <Screen face={events ? 'valid' : 'block'} glow={frontend || events} />
      </group>
      <Anim position={W} scale={wallet ? 1.25 : 1}>
        <Wallet glow={wallet} />
      </Anim>
      <group position={R}>
        <NodeTower units={3} color="neutral" glow={rpc} />
      </group>
      <Platform size={[3.6, 3.6]} position={[C[0], C[1], 0]} color="block" height={0.3} />
      <group position={C}>
        <ContractMachine active={contract || compare} glow={contract} size={1.1} />
      </group>
      <FlowLine points={[[-4.9, 0.06, 0], [-3.3, 0.06, 0]]} color="chain" />
      <FlowLine points={[[-1.5, 0.06, 0], [0.5, 0.06, 0]]} color="chain" />
      <FlowLine points={[[1.9, 0.06, 0], [3.3, 0.06, 0]]} color="chain" />

      <Label position={[S[0], 2.5, 0]} show={compare}>
        {labels.dapp}
      </Label>
      <Label position={[S[0], 2.5, 0]} show={frontend || events} tone={events ? 'valid' : 'block'}>
        {events ? labels.uiUpdates : labels.website}
      </Label>
      <Label position={[W[0], 1.9, 0]} show={compare || frontend || rpc} minLevel={compare ? 'intermediate' : 'beginner'} tone={compare ? 'plain' : 'actor'}>
        {labels.wallet}
      </Label>
      <Label position={[R[0], 2.35, 0]} show={compare || rpc || events} minLevel={rpc ? 'beginner' : 'intermediate'} tone={rpc ? 'default' : 'plain'}>
        {labels.rpcNode}
      </Label>
      <Label position={[C[0], 3.05, 0]} show={compare || rpc || contract} tone={compare ? 'valid' : 'default'}>
        {labels.contract}
      </Label>

      {/* The network: many independent nodes hold the contract, not one owner. */}
      {NODES.map((n, i) => (
        <Anim key={i} position={n} show={compare || rpc || contract} speed={4 + i}>
          <NodeTower units={2} color="neutral" glow={contract} />
        </Anim>
      ))}
      <Label position={[7.9, -0.45, 2.2]} show={compare || rpc} minLevel="intermediate" tone="plain">
        {labels.network}
      </Label>
      <Label position={[7.9, -0.45, 2.2]} show={contract} minLevel="intermediate" tone="plain">
        {labels.everyNode}
      </Label>

      <Anim show={compare}>
        <Leg path={PATHS.whole} cycle={6} from={0.4} to={5} arc={0.35}>
          <SignedTx />
        </Leg>
        <Label position={[-3.4, -0.4, 2.4]} minLevel="expert" tone="mono">
          {labels.publicRpc}
        </Label>
      </Anim>

      {/* Step 2: the website is static files; it ships the contract's ABI. */}
      <Anim show={frontend} position={HOST}>
        <NodeTower units={2} color="neutral" light="block" />
        <Label position={[0, 1.7, 0]} minLevel="intermediate">
          {labels.staticHost}
        </Label>
      </Anim>
      <Anim show={frontend}>
        <FlowLine points={[[-6, 0.06, -2.9], [-6, 0.06, -0.6]]} color="chain" dashed />
        <Leg path={PATHS.files} cycle={3.2} from={0} to={1.5} arc={0.5}>
          <FileSheet />
        </Leg>
        <Leg path={PATHS.files} cycle={3.2} from={1.6} to={3.1} arc={0.5}>
          <FileSheet />
        </Leg>
        <group position={[-4.7, 0, -1.2]}>
          <AbiCard />
          <Label position={[0, 1.65, 0]} minLevel="intermediate" tone="mono">
            ABI
          </Label>
        </group>
        <Label position={[-3.9, 0.3, 0.9]} minLevel="expert" tone="mono">
          window.ethereum
        </Label>
      </Anim>

      {/* Step 3: the site asks, the user confirms, the wallet signs with a key that stays inside. */}
      <Anim show={wallet}>
        <group position={[W[0] + 0.1, 2.15, 0]}>
          <Bob>
            <Key />
          </Bob>
        </group>
        <Leg path={PATHS.request} cycle={6} from={0} to={1.6} arc={0.3} rest={false}>
          <Unsigned />
        </Leg>
        <Leg path={PATHS.signing} cycle={6} from={1.6} to={3.3} arc={0.18} rest={false}>
          <Unsigned />
        </Leg>
        <Leg path={PATHS.signedOut} cycle={6} from={3.3} to={5.4} arc={0.3}>
          <SignedTx />
        </Leg>
        <Label position={[W[0] + 0.3, 3, 0]} tone="actor">
          {labels.keyStays}
        </Label>
        <Label position={[-4.3, 0.2, 1]} maxLevel="intermediate" tone="plain">
          {labels.request}
        </Label>
        <Label position={[-4.3, 0.2, 1]} minLevel="expert" tone="mono">
          eth_sendTransaction
        </Label>
        <Label position={[-0.6, 0.2, 1]} maxLevel="intermediate" tone="tx">
          {labels.signed}
        </Label>
        <Label position={[-0.6, 0.2, 1]} minLevel="expert" tone="mono">
          tx + (yParity, r, s)
        </Label>
      </Anim>

      {/* Step 4: reads go straight to a node and back; a signed transaction is broadcast. */}
      <Anim show={rpc}>
        <FlowLine points={[[-6, 2.3, 0], [-2.4, 3.3, 0], [R[0], 2.2, 0]]} color="block" dashed curved />
        <Leg path={PATHS.toRpc} cycle={6} from={0} to={1.5} arc={0.4} rest={false}>
          <SignedTx />
        </Leg>
        <Leg path={PATHS.toChain} cycle={6} from={1.7} to={3.2} arc={0.4}>
          <SignedTx />
        </Leg>
        {GOSSIP.map((path, i) => (
          <Leg key={i} path={path} cycle={6} from={1.7} to={3.2} arc={0.6}>
            <Packet color="tx" size={0.24} />
          </Leg>
        ))}
        <Leg path={PATHS.readOut} cycle={6} from={3.2} to={4.4} arc={1.4} rest={false}>
          <Query />
        </Leg>
        <Leg path={PATHS.readBack} cycle={6} from={4.6} to={5.8} arc={1.4}>
          <Query />
        </Leg>
        <Label position={[-2.6, 3.9, 0]} maxLevel="intermediate" tone="block">
          {labels.read}
        </Label>
        <Label position={[-2.6, 3.9, 0]} minLevel="expert" tone="mono">
          eth_call
        </Label>
        <Label position={[-0.6, -0.3, 2.2]} maxLevel="intermediate" tone="tx">
          {labels.write}
        </Label>
        <Label position={[-0.6, -0.3, 2.2]} minLevel="expert" tone="mono">
          eth_sendRawTransaction
        </Label>
      </Anim>

      {/* Steps 5-6: the call is decoded and the contract's storage changes. */}
      <Anim show={executed} position={[C[0] + 0.2, C[1], 1.25]}>
        <Balance position={[-0.5, 0, 0]} before={1} after={0.65} color="actor" live={contract} />
        <Balance position={[0.4, 0, 0]} before={0.35} after={0.7} color="tokenA" live={contract} />
      </Anim>
      <Anim show={contract}>
        <Leg path={PATHS.intake} cycle={CYCLE} from={0} to={LANDS} arc={0.2}>
          <SignedTx />
        </Leg>
        <group position={[C[0] - 0.1, 3.9, 0]}>
          <CalldataTape />
        </group>
        <Label position={[C[0] - 0.1, 4.55, 0]} maxLevel="intermediate" tone="tx">
          {labels.calldata}
        </Label>
        <Label position={[C[0] - 0.1, 4.6, 0]} minLevel="expert" tone="mono">
          0xa9059cbb · to (32 B) · amount (32 B)
        </Label>
        <Label position={[C[0] + 0.4, -0.25, 2.3]} maxLevel="beginner">
          {labels.balances}
        </Label>
        <Label position={[C[0] + 0.4, -0.25, 2.3]} minLevel="intermediate" maxLevel="intermediate">
          {labels.balancesNum}
        </Label>
        <Label position={[C[0] + 0.4, -0.25, 2.3]} minLevel="expert" tone="mono">
          balanceOf[from] −= 10 · balanceOf[to] += 10
        </Label>
      </Anim>

      {/* Step 6: the contract emits a log; a node or an indexer hands it back to the page. */}
      <Anim show={events} position={INDEXER}>
        <NodeTower units={2} color="neutral" light="valid" />
        <Cyl radius={0.42} height={0.3} position={[1.15, 0.15, 0]} color="chain" />
        <Cyl radius={0.42} height={0.3} position={[1.15, 0.5, 0]} color="chain" />
        <Label position={[0.6, 1.75, 0]}>{labels.indexer}</Label>
      </Anim>
      <Anim show={events}>
        <FlowLine points={[[C[0] - 1.1, 0.06, 1.7], [INDEXER[0] + 1.9, 0.06, 3.5]]} color="valid" dashed />
        <FlowLine points={[[INDEXER[0] - 0.8, 0.06, 3.5], [-5.6, 0.06, 1]]} color="valid" dashed />
        <Leg path={PATHS.logToRpc} cycle={6} from={0} to={1.4} arc={0.5} rest={false}>
          <LogPacket />
        </Leg>
        <Leg path={PATHS.logRpcToUi} cycle={6} from={1.5} to={3.1} arc={1.2}>
          <LogPacket />
        </Leg>
        <Leg path={PATHS.logToIndexer} cycle={6} from={0.3} to={2} arc={0.6} rest={false}>
          <LogPacket />
        </Leg>
        <Leg path={PATHS.logIndexerToUi} cycle={6} from={2.4} to={4.6} arc={0.6}>
          <LogPacket />
        </Leg>
        <Label position={[C[0], 3.05, 0]} maxLevel="beginner" tone="valid">
          {labels.event}
        </Label>
        <Label position={[C[0], 3.05, 0]} minLevel="intermediate" maxLevel="intermediate" tone="valid">
          {labels.eventName}
        </Label>
        <Label position={[C[0], 3.05, 0]} minLevel="expert" tone="mono">
          topics[0] = keccak256(sig)
        </Label>
        <Label position={[-2.4, 3.1, 0]} minLevel="expert" tone="mono">
          eth_getLogs
        </Label>
      </Anim>
    </>
  );
}
