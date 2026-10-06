import { useThree } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode } from 'react';
import { Vector3, type Group } from 'three';
import { Anim, Ball, Box, ContractMachine, Cyl, FlowLine, Label, Mat, NodeTower, Packet, Person, Platform, Screen, ShadowGround, Wallet, useLevel, useLoop, useScene, type Vec3 } from '../../scene/kit';
import type { SceneProps } from '../../scene/types';
import {
  activeProvider, buildCall, filterLogs, FILTERS, FNS, MAX_AMOUNT, outage, PEOPLE, RPC, shortHex, shortWord, TOKEN_ADDRESS, topicsFor, UNKNOWN_SPENDER, walletRequest, WHO,
  type Fn, type Log, type Who,
} from './logic';
import { useDapp } from './state';

// The stack, left to right: browser, wallet, RPC node, contract on the chain.
const S: Vec3 = [-6, 0, 0];
const W: Vec3 = [-2.4, 0, 0];
const R: Vec3 = [1.2, 0, 0];
const C: Vec3 = [5.2, 0.3, 0];
/** A second provider and a second website, used when the first ones are gone. */
const R2: Vec3 = [1.2, 0, 2.9];
const S2: Vec3 = [-5.2, 0, 3.1];
/** The "normal app" lane sits behind the dapp lane. */
const ZA = -4.6;
const HOST: Vec3 = [-6, 0, -3.6];
const INDEXER: Vec3 = [1.2, 0, 3.8];
/** The stack of recent logs on the events step. */
const LOGS: Vec3 = [2.6, 0, -3.1];
const LOG_SLOTS = 5;
const NODES: Vec3[] = [
  [7.5, 0, -1.7],
  [7.7, 0, 1.2],
  [4.7, 0, -2.9],
];

const up = (p: Vec3, y: number): Vec3 => [p[0], y, p[2]];
const CHAIN_IN: Vec3 = [C[0] - 0.4, 1.9, 0];

const PATHS = {
  appOut: [[-3.2, 0.5, ZA], [-0.5, 0.5, ZA]] as Vec3[],
  appBack: [[-0.5, 0.5, ZA], [-3.2, 0.5, ZA]] as Vec3[],
  whole: [up(S, 1), up(W, 1.1), up(R, 1.5), CHAIN_IN] as Vec3[],
  wholeOther: [up(S2, 1), up(W, 1.1), up(R, 1.5), CHAIN_IN] as Vec3[],
  files: [up(HOST, 1.1), [-6, 1.1, -0.3]] as Vec3[],
  request: [[-5, 1, 0.1], up(W, 1.25)] as Vec3[],
  signing: [up(W, 1.25), up(W, 1.25)] as Vec3[],
  signedOut: [up(W, 1.25), [-0.4, 0.9, 0]] as Vec3[],
  intake: [up(R, 1.5), [C[0] - 0.4, 2.1, 0], [C[0] - 0.4, 1.75, 0]] as Vec3[],
  logToRpc: [[C[0], 2, 0], up(R, 1.5)] as Vec3[],
  logRpcToUi: [up(R, 1.5), [-6, 1.8, 0]] as Vec3[],
  logToIndexer: [[C[0], 2, 0.4], up(INDEXER, 1.1)] as Vec3[],
  logIndexerToUi: [up(INDEXER, 1.1), [-6, 1.3, 0.6]] as Vec3[],
};
/** Paths of the RPC step, through whichever provider is in use. */
const rpcPaths = (node: Vec3) => ({
  toRpc: [up(W, 1.1), up(node, 1.5)] as Vec3[],
  toChain: [up(node, 1.5), CHAIN_IN] as Vec3[],
  readOut: [[-6, 1.8, 0], up(node, 1.6)] as Vec3[],
  readBack: [up(node, 1.6), [-6, 1.8, 0]] as Vec3[],
  gossip: NODES.map((n) => [up(node, 1.5), up(n, 1.5)] as Vec3[]),
});
const RPC_PATHS = [rpcPaths(R), rpcPaths(R2)];

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

/** Plays once when mounted: the child travels `path` and disappears at the end. Remount (change `key`) to replay. */
function OneShot({ path, duration = 1.1, arc = 0.2, children }: { path: Vec3[]; duration?: number; arc?: number; children: ReactNode }) {
  const { reducedMotion } = useScene();
  const ref = useRef<Group>(null);
  const start = useRef<number | null>(null);
  const pts = useMemo(() => path.map((p) => new Vector3(...p)), [path]);
  useLoop((time) => {
    const g = ref.current;
    if (!g) return;
    start.current ??= time;
    const u = (time - start.current) / duration;
    if (u >= 1) {
      g.visible = false;
      return;
    }
    g.visible = true;
    const n = pts.length - 1;
    const seg = Math.min(Math.floor(u * n), n - 1);
    const f = u * n - seg;
    g.position.lerpVectors(pts[seg], pts[seg + 1], f * f * (3 - 2 * f));
    g.position.y += Math.sin(u * Math.PI) * arc;
  });
  if (reducedMotion) return null;
  return (
    <group ref={ref} position={path[0]} visible={false}>
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
function CalldataTape({ words }: { words: number }) {
  return (
    <group>
      <Box size={[0.42, 0.34, 0.34]} position={[-1.3, 0, 0]} color="tx" glow radius={0.05} />
      <Box size={[1.1, 0.34, 0.34]} position={[-0.48, 0, 0]} color="actor" radius={0.05} />
      <Anim show={words > 1} position={[0.68, 0, 0]}>
        <Box size={[1.1, 0.34, 0.34]} color="tokenA" radius={0.05} />
      </Anim>
    </group>
  );
}

/** A storage column whose height is a balance kept inside the contract. */
function Balance({ position, value, color, glow }: { position: Vec3; value: number; color: 'actor' | 'tokenA' | 'tokenB'; glow: boolean }) {
  return (
    <group position={position}>
      <Cyl radius={0.3} height={0.08} position={[0, 0.04, 0]} color="platform" />
      <Anim position={[0, 0.08, 0]} scale={[1, Math.max(value / 60, 0.02), 1]} speed={5}>
        <Box size={[0.42, 1, 0.42]} position={[0, 0.5, 0]} color={color} glow={glow} radius={0.04} />
      </Anim>
    </group>
  );
}

const BALANCE_COLOR: Record<Who, 'actor' | 'tokenA' | 'tokenB'> = { ayse: 'actor', ben: 'tokenA', cem: 'tokenB' };

/** "Ayşe → Ben 10" */
const logText = (l: Log) => `${PEOPLE[l.from].name} → ${PEOPLE[l.to].name} ${l.value}`;

export default function Scene({ stepId, labels }: SceneProps) {
  const st = useDapp();
  const { compact } = useScene();
  const { atLeast } = useLevel();
  const nums = atLeast('intermediate');

  const compare = stepId === 'compare';
  const frontend = stepId === 'frontend';
  const wallet = stepId === 'wallet';
  const rpc = stepId === 'rpc';
  const contract = stepId === 'contract';
  const events = stepId === 'events';
  const executed = contract || events;

  // Step 1: what is still alive after the operator pulls the plug.
  const down = compare && st.shutDown;
  const siteDark = down;
  const useOther = down && st.otherFrontend;

  // Step 3: the request in the wallet.
  const pending = st.decision === 'pending';
  const confirmed = st.decision === 'confirmed';
  const rejected = st.decision === 'rejected';

  // Step 4: which provider answers, if any.
  const provider = activeProvider(st.providerDown, st.switched);
  const rp = RPC_PATHS[provider ?? 0];
  const reading = st.rpcMode === 'read';
  const dead = provider === null;
  const firstDark = rpc && st.providerDown;

  // Steps 5 and 6: the call, its result and the logs a query would return.
  const call = useMemo(() => buildCall(st.fn, PEOPLE[st.target].address, st.amount), [st.fn, st.target, st.amount]);
  const last = st.last;
  const reverted = contract && last !== null && !last.ok;
  const recent = st.token.logs.slice(-LOG_SLOTS);
  const matched = useMemo(() => new Set(filterLogs(st.token.logs, st.filter).map((l) => l.id)), [st.token.logs, st.filter]);
  const anyMatch = matched.size > 0;
  const newestMatch = [...recent].reverse().find((l) => matched.has(l.id))?.id;

  let result = '';
  if (last) {
    const who = PEOPLE[last.target].name;
    if (last.outcome === 'transferred') result = `Transfer(Ayşe, ${who}, ${last.amount})`;
    else if (last.outcome === 'approved') result = `allowance[Ayşe][${who}] = ${last.amount}`;
    else if (last.outcome === 'read') result = `${labels.resRead} ${last.returned ?? 0}`;
    else result = labels.resReverted;
  }

  // On a phone the control panel covers the lower part of the canvas: raise and shrink the model to clear it.
  // A short canvas (small phone) leaves even less room above the panel, so the model shrinks a little more.
  const squat = useThree((s) => s.size.height < s.size.width * 0.8) ? 0.85 : 1;
  const lift = !compact || frontend ? 0 : (compare ? 3.2 : wallet ? 2.3 : rpc ? 3.2 : contract ? 1.2 : 3.2) * squat;
  const fit = !compact || frontend ? 1 : (compare || rpc || events ? 0.82 : 0.9) * squat;
  /** Vertical distance between the three calldata captions. */
  const gap = compact ? 0.9 / squat : 0.62;

  return (
    <Anim position={[0, lift, 0]} scale={fit}>
      <ShadowGround />

      {/* Step 1 only: an ordinary app, where one company's server holds the data and the rules. */}
      <Anim show={compare}>
        <Platform size={[9.6, 3]} position={[-1.6, 0, ZA]} color="ground" height={0.2} />
        <group position={[-5.4, 0, ZA + 0.9]}>
          <Person color="actor" />
        </group>
        <group position={[-4.1, 0, ZA]}>
          <Screen face={down ? 'ink' : 'neutral'} />
        </group>
        <group position={[0.4, 0, ZA]}>
          <NodeTower units={3} color={down ? 'ink' : 'neutral'} light="invalid" />
        </group>
        <group position={[1.9, 0, ZA + 0.3]}>
          <Person color="chain" />
        </group>
        <FlowLine points={[[-3.1, 0.06, ZA], [-0.4, 0.06, ZA]]} color={down ? 'invalid' : 'chain'} dashed={down} />
        <Anim show={!down}>
          <Leg path={PATHS.appOut} cycle={4} from={0} to={1.5} arc={0.3} rest={false}>
            <Unsigned />
          </Leg>
          <Leg path={PATHS.appBack} cycle={4} from={2} to={3.5} arc={0.3}>
            <Unsigned />
          </Leg>
        </Anim>
        <Label position={[-4.1, 2.4, ZA]} tone={down ? 'invalid' : 'default'}>
          {labels.normalApp}
          {down ? `: ${labels.offline}` : ''}
        </Label>
        <Label position={[1, 2.3, ZA]} tone="invalid">
          {down ? labels.serverOff : labels.companyServer}
        </Label>
        <Label position={[-1.7, 1.9, ZA - 1.2]} minLevel="expert" tone="mono" show={!down}>
          {labels.privateApi}
        </Label>
      </Anim>

      {/* The dapp stack, present in every step. */}
      <Platform size={[9.8, 3.2]} position={[-2.3, 0, 0]} color="ground" height={0.2} />
      <group position={[-7, 0, 1]}>
        <Person color="actor" />
      </group>
      <group position={S}>
        <Screen face={siteDark ? 'ink' : events && anyMatch ? 'valid' : 'block'} glow={frontend || (events && anyMatch)} />
      </group>
      <Anim position={W} scale={wallet ? 1.25 : 1}>
        <Wallet glow={wallet && !rejected} color={wallet && rejected ? 'invalid' : 'actor'} />
      </Anim>
      <group position={R}>
        <NodeTower units={3} color={firstDark ? 'ink' : 'neutral'} light={firstDark ? 'invalid' : 'valid'} glow={rpc && provider === 0} />
      </group>
      <Platform size={[3.6, 3.6]} position={[C[0], C[1], 0]} color="block" height={0.3} />
      <group position={C}>
        <ContractMachine active={contract || compare} color={reverted ? 'invalid' : 'contract'} glow={contract || down} size={1.1} />
      </group>
      <FlowLine points={[[-4.9, 0.06, 0], [-3.3, 0.06, 0]]} color={siteDark ? 'invalid' : 'chain'} dashed={siteDark} />
      <FlowLine points={[[-1.5, 0.06, 0], [0.5, 0.06, 0]]} color="chain" />
      <FlowLine points={[[1.9, 0.06, 0], [3.3, 0.06, 0]]} color="chain" />

      <Label position={[S[0], 2.5, 0]} show={compare} tone={siteDark ? 'invalid' : 'default'}>
        {siteDark ? labels.siteOff : labels.dapp}
      </Label>
      <Label position={[S[0], 2.5, 0]} show={frontend || events} tone={events ? (anyMatch ? 'valid' : 'plain') : 'block'}>
        {events ? `${labels.uiUpdates}: ${matched.size}` : labels.website}
      </Label>
      <Label position={[W[0], 1.9, 0]} show={compare || frontend || rpc} minLevel={compare ? 'intermediate' : 'beginner'} tone={compare ? 'plain' : 'actor'}>
        {labels.wallet}
      </Label>
      <Label position={[R[0], 2.35, 0]} show={compare || rpc || events} minLevel={rpc ? 'beginner' : 'intermediate'} tone={firstDark ? 'invalid' : rpc ? 'default' : 'plain'}>
        {labels.rpcNode}
        {firstDark ? `: ${labels.down}` : ''}
      </Label>
      <Label position={[C[0], 3.05, 0]} show={compare || rpc || contract} tone={compare ? 'valid' : 'default'}>
        {down ? `${labels.contract}: ${labels.stillRunning}` : labels.contract}
      </Label>

      {/* The network: many independent nodes hold the contract, not one owner. */}
      {NODES.map((n, i) => (
        <Anim key={i} position={n} show={compare || rpc || contract} speed={4 + i}>
          <NodeTower units={2} color="neutral" glow={contract || (rpc && !reading && !dead)} />
        </Anim>
      ))}
      <Label position={[7.9, -0.45, 2.2]} show={compare || rpc} minLevel="intermediate" tone="plain">
        {labels.network}
      </Label>
      <Label position={[NODES[0][0] + 0.3, 1.7, NODES[0][2]]} show={contract} minLevel="intermediate" tone="plain">
        {labels.everyNode}
      </Label>

      <Anim show={compare && !down}>
        <Leg path={PATHS.whole} cycle={6} from={0.4} to={5} arc={0.35}>
          <SignedTx />
        </Leg>
      </Anim>
      <Label position={[-3.4, -0.4, 2.4]} minLevel="expert" tone="mono" show={compare && !down}>
        {labels.publicRpc}
      </Label>
      {/* Step 1, after the shutdown: any other website can drive the same contract. */}
      <Anim show={useOther} position={S2}>
        <Platform size={[2.4, 1.6]} position={[0, 0, 0]} color="ground" height={0.2} />
        <Screen face="valid" glow />
        <Label position={[0, 2.5, 0]} tone="valid">
          {labels.otherFrontend}
        </Label>
      </Anim>
      <Anim show={useOther}>
        <FlowLine points={[[S2[0] + 1.1, 0.06, S2[2] - 0.4], [W[0] - 0.5, 0.06, 0.9]]} color="valid" />
        <Leg path={PATHS.wholeOther} cycle={6} from={0.4} to={5} arc={0.35}>
          <SignedTx />
        </Leg>
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

      {/* Step 3: the site asks, the user decides, the wallet signs with a key that stays inside. */}
      <Anim show={wallet}>
        <group position={[W[0] + 0.1, 2.15, 0]}>
          <Bob>
            <Key />
          </Bob>
        </group>
        {/* Waiting for a decision: the request arrives and hovers at the wallet. */}
        <Anim show={pending}>
          <Leg path={PATHS.request} cycle={4} from={0} to={1.4} arc={0.3} rest={false}>
            <Unsigned />
          </Leg>
          <Leg path={PATHS.signing} cycle={4} from={1.4} to={4} arc={0.14}>
            <Unsigned />
          </Leg>
        </Anim>
        {/* Confirmed: it leaves with a seal. */}
        <Anim show={confirmed}>
          <Leg path={PATHS.signedOut} cycle={3} from={0} to={2.4} arc={0.3}>
            <SignedTx />
          </Leg>
        </Anim>
        {/* Rejected: it goes nowhere. */}
        <Anim show={rejected} position={[-3.9, 0.2, 0.9]}>
          <Packet color="invalid" size={0.36} glow={false} />
        </Anim>
        <Label position={[W[0] + 0.3, 3, 0]} tone="actor">
          {labels.keyStays}
        </Label>
        <Label position={[-4.3, 0.2, 1]} maxLevel="beginner" tone={rejected ? 'invalid' : 'plain'}>
          {rejected ? labels.rejectedTag : st.reqKind === 'transfer' ? labels.askTransfer : labels.askApprove}
        </Label>
        <Label position={[-4.3, 0.2, 1]} minLevel="intermediate" tone={rejected ? 'invalid' : 'mono'}>
          {rejected ? labels.rejectedTag : st.reqKind === 'transfer' ? 'transfer(Ben, 10)' : `approve(${shortHex(UNKNOWN_SPENDER)}, MAX)`}
        </Label>
        <Label position={[-0.6, 0.2, 1]} maxLevel="beginner" tone={st.reqKind === 'unlimited' ? 'invalid' : 'tx'} show={confirmed}>
          {labels.signed}
        </Label>
        <Label position={[-0.6, 0.2, 1]} minLevel="intermediate" tone="mono" show={confirmed}>
          r = {st.signature ? shortHex(st.signature.r, 8, 4) : ''}
        </Label>
      </Anim>

      {/* Step 4: a read is answered by one node; a signed transaction is broadcast and waits for a block. */}
      <Anim show={rpc && st.switched} position={R2}>
        <NodeTower units={3} color="neutral" glow={provider === 1} />
        <Label position={[0, -0.5, 1]} tone="valid">
          {labels.otherProvider}
        </Label>
      </Anim>
      <Anim show={rpc && reading}>
        <FlowLine points={provider === 1 ? [[-6, 2.3, 0.3], [-2.4, 3.1, 1.8], [R2[0], 2.2, R2[2]]] : [[-6, 2.3, 0], [-2.4, 3.3, 0], [R[0], 2.2, 0]]} color={dead ? 'invalid' : 'block'} dashed curved />
        <Leg key={`out${provider}`} path={rp.readOut} cycle={3} from={0} to={1.2} arc={1.4} rest={false}>
          <Query />
        </Leg>
        <Anim show={!dead}>
          <Leg key={`back${provider}`} path={rp.readBack} cycle={3} from={1.4} to={2.6} arc={1.4}>
            <Query />
          </Leg>
        </Anim>
        <Label position={[-2.6, 3.9, 0]} tone={dead ? 'invalid' : atLeast('expert') ? 'mono' : 'block'}>
          {dead ? labels.noAnswer : atLeast('expert') ? 'eth_call' : labels.read}
        </Label>
      </Anim>
      <Anim show={rpc && !reading}>
        <Leg key={`w${provider}`} path={rp.toRpc} cycle={6} from={0} to={1.5} arc={0.4} rest={dead}>
          <SignedTx />
        </Leg>
        <Anim show={!dead}>
          <Leg key={`c${provider}`} path={rp.toChain} cycle={6} from={1.7} to={3.2} arc={0.4}>
            <SignedTx />
          </Leg>
          {rp.gossip.map((path, i) => (
            <Leg key={`${provider}${i}`} path={path} cycle={6} from={1.7} to={3.2} arc={0.6}>
              <Packet color="tx" size={0.24} />
            </Leg>
          ))}
          {/* The block that finally includes it. */}
          <Leg path={[[C[0] + 0.9, 2.2, -0.9], [C[0] + 0.9, 2.2, -0.9]]} cycle={6} from={3.6} to={5.9} arc={0.25} rest={false}>
            <Box size={[0.6, 0.6, 0.6]} position={[0, 0.3, 0]} color="block" glow radius={0.08} />
          </Leg>
        </Anim>
        <Label position={[-0.6, -0.3, 2.2]} tone={dead ? 'invalid' : atLeast('expert') ? 'mono' : 'tx'} show={!st.switched}>
          {dead ? labels.noAnswer : atLeast('expert') ? 'eth_sendRawTransaction' : labels.write}
        </Label>
        <Label position={[-2.6, 3.9, 0]} tone={atLeast('expert') ? 'mono' : 'tx'} show={st.switched}>
          {atLeast('expert') ? 'eth_sendRawTransaction' : labels.write}
        </Label>
        <Label position={[C[0] + 1.2, 3.6, -0.9]} minLevel="intermediate" tone="block" show={!dead && !compact}>
          {labels.nextBlockTag}
        </Label>
      </Anim>

      {/* Steps 5-6: the balances kept in the contract's storage. */}
      <Anim show={executed} position={[C[0] + 0.2, C[1], 1.25]}>
        {WHO.map((w, i) => (
          <Balance key={w} position={[-0.9 + i * 0.8, 0, 0]} value={st.token.balances[w]} color={BALANCE_COLOR[w]} glow={contract && last !== null && last.ok && last.outcome !== 'read' && (w === 'ayse' || w === last.target)} />
        ))}
      </Anim>
      <Anim show={contract}>
        {last && (
          <OneShot key={last.id} path={PATHS.intake}>
            {last.fn === 'balanceOf' ? <Query /> : <SignedTx />}
          </OneShot>
        )}
        <group position={[C[0] - 0.1, 3.9, 0]}>
          <CalldataTape words={call.words.length} />
        </group>
        {/* What each part of the calldata means, then the real bytes. */}
        <Label position={[C[0] - 0.1, 5 + 2 * gap, 0]} tone={nums ? 'mono' : 'tx'}>
          {nums ? `selector ${call.selector}` : `${labels.capFn}: ${st.fn}`}
        </Label>
        <Label position={[C[0] - 0.1, 5 + gap, 0]} tone={nums ? 'mono' : 'actor'}>
          {nums ? `address ${shortWord(call.words[0])}` : `${labels.capTo}: ${PEOPLE[st.target].name}`}
        </Label>
        <Label position={[C[0] - 0.1, 5, 0]} tone={nums ? 'mono' : 'tokenA'} show={call.words.length > 1}>
          {nums ? `uint256 ${shortWord(call.words[1] ?? '')}` : `${labels.capAmount}: ${st.amount}`}
        </Label>
        <Label position={[C[0] - 2.4, 1.2, 1.6]} tone={reverted ? 'invalid' : 'valid'} show={last !== null}>
          {result}
        </Label>
      </Anim>
      <Label position={[C[0] + 0.6, -0.1, 2.4]} show={contract} tone="plain">
        {nums ? WHO.map((w) => `${PEOPLE[w].name} ${st.token.balances[w]}`).join(' · ') : labels.balances}
      </Label>

      {/* Step 6: every call left a log; a query returns the ones whose topics match. */}
      <Anim show={events} position={INDEXER}>
        <NodeTower units={2} color="neutral" light="valid" />
        <Cyl radius={0.42} height={0.3} position={[1.15, 0.15, 0]} color="chain" />
        <Cyl radius={0.42} height={0.3} position={[1.15, 0.5, 0]} color="chain" />
        <Label position={[0.6, 1.75, 0]}>{labels.indexer}</Label>
      </Anim>
      <Anim show={events} position={LOGS}>
        <Platform size={[1.5, 1.1]} position={[0, 0.1, 0]} color="ground" height={0.1} />
        {recent.map((l, i) => {
          const hit = matched.has(l.id);
          return (
            <Anim key={l.id} position={[hit ? 0.25 : 0, 0.3 + i * 0.62, hit ? -0.25 : 0]} speed={8}>
              <Box size={[1.1, 0.4, 0.7]} color={hit ? 'valid' : l.event === 'Approval' ? 'actor' : 'neutral'} glow={hit} radius={0.06} />
              <Label position={[1.5, 0, -1.5]} tone={hit ? 'valid' : 'plain'} show={compact ? l.id === newestMatch : hit || nums}>
                {l.event === 'Approval' ? `Approval ${PEOPLE[l.to].name} ${l.value}` : logText(l)}
              </Label>
            </Anim>
          );
        })}
        <Label position={[0, 0.5 + LOG_SLOTS * 0.62, 0]} tone={atLeast('expert') ? 'mono' : 'default'}>
          {atLeast('expert') ? `eth_getLogs → ${matched.size}` : `${labels.event}: ${matched.size} / ${st.token.logs.length}`}
        </Label>
      </Anim>
      <Anim show={events}>
        <FlowLine points={[[C[0] - 1.1, 0.06, 1.7], [INDEXER[0] + 1.9, 0.06, 3.5]]} color="valid" dashed />
        <FlowLine points={[[INDEXER[0] - 0.8, 0.06, 3.5], [-5.6, 0.06, 1]]} color="valid" dashed />
        <Anim show={anyMatch}>
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
        </Anim>
        <Label position={[C[0] + 1.2, -0.2, 2.6]} minLevel="expert" tone="mono">
          topics[0] = keccak256(sig)
        </Label>
      </Anim>
    </Anim>
  );
}

/* ---------- Controls ---------- */

const ROW = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 12px', flexBasis: '100%' } as const;
const MONO = { fontFamily: 'var(--font-mono)', fontSize: '0.74rem', overflowWrap: 'anywhere', flexBasis: '100%', color: 'var(--ink-soft)' } as const;

/** One figure in the control panel: name and value on one line, so the panel stays low on a phone. */
function Stat({ name, tone, wrap = false, grow = false, children }: { name: string; tone?: 'good' | 'bad'; wrap?: boolean; grow?: boolean; children: ReactNode }) {
  return (
    <div className="ctl-stat" style={{ display: 'flex', alignItems: 'baseline', gap: 6, whiteSpace: wrap ? 'normal' : 'nowrap', ...(grow ? { flex: '1 1 110px', minWidth: 0 } : null) }}>
      <span style={{ whiteSpace: 'nowrap' }}>{name}</span>
      <strong style={{ fontSize: isSmall() ? '0.76rem' : '0.84rem' }} data-tone={tone}>
        {children}
      </strong>
    </div>
  );
}

const Stats = ({ children }: { children: ReactNode }) => (
  <div className="ctl-stats" style={{ gap: '2px 14px', flexBasis: '100%' }}>
    {children}
  </div>
);

/** True on a phone, where the panel has to stay as low as possible. */
const isSmall = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;
/** Narrower buttons for a phone. */
const TIGHT = { padding: '0 9px', fontSize: '0.82rem', minHeight: 32 } as const;

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)} style={isSmall() ? { padding: '0 6px', fontSize: '0.78rem', minHeight: 30 } : { padding: '0 8px' }}>
          {text}
        </button>
      ))}
    </div>
  );
}


export function Controls({ stepId, labels, level }: SceneProps) {
  const st = useDapp();
  const small = isSmall();
  const nums = level !== 'beginner';
  const expert = level === 'expert';
  const box = { gap: '4px 12px', maxWidth: 580 } as const;
  const field = { minWidth: 0, flex: '1 1 84px' } as const;
  const names = WHO.map((w) => [w, PEOPLE[w].name] as const);

  if (stepId === 'compare') {
    const o = outage(st.shutDown, st.otherFrontend);
    return (
      <div className="ctl" style={box}>
        {!small && <div className="ctl-title">{labels.tryCompare}</div>}
        <div style={ROW}>
          <label className="ctl-check">
            <input type="checkbox" checked={st.shutDown} onChange={(e) => st.setShutDown(e.target.checked)} />
            {labels.shutDown}
          </label>
          <button type="button" style={small ? TIGHT : undefined} className="btn" disabled={!st.shutDown} onClick={() => st.setOtherFrontend(!st.otherFrontend)}>
            {st.otherFrontend ? labels.closeOther : labels.openOther}
          </button>
        </div>
        <Stats>
          <Stat name={labels.normalApp} tone={o.normalApp ? 'good' : 'bad'}>
            {o.normalApp ? labels.works : labels.offline}
          </Stat>
          <Stat name={labels.dapp} tone={o.dapp ? 'good' : 'bad'} wrap>
            {!st.shutDown ? labels.works : o.dapp ? labels.viaOther : labels.noSite}
          </Stat>
        </Stats>
      </div>
    );
  }

  if (stepId === 'wallet') {
    const req = walletRequest(st.reqKind);
    const bad = st.reqKind === 'unlimited';
    const status = st.decision === 'pending' ? labels.waiting : st.decision === 'rejected' ? labels.rejectedMsg : bad ? labels.signedBad : labels.signedOk;
    return (
      <div className="ctl" style={box}>
        <div style={ROW}>
          <Seg
            label={labels.request}
            value={st.reqKind}
            options={[
              ['transfer', labels.reqA],
              ['unlimited', labels.reqB],
            ]}
            onChange={st.setReqKind}
          />
          {st.decision === 'pending' ? (
            <>
              <button type="button" style={small ? TIGHT : undefined} className="btn" onClick={() => st.decide('rejected')}>
                {labels.reject}
              </button>
              <button type="button" style={small ? TIGHT : undefined} className="btn btn-primary" onClick={() => st.decide('confirmed')}>
                {labels.confirm}
              </button>
            </>
          ) : (
            <button type="button" style={small ? TIGHT : undefined} className="btn" onClick={() => st.decide('pending')}>
              {labels.askAgain}
            </button>
          )}
        </div>
        {/* The wallet prompt: exactly what is about to be signed. */}
        <Stats>
          <Stat name={labels.reqTo}>
            {labels.tokenContract} {shortHex(TOKEN_ADDRESS)}
          </Stat>
          <Stat name={labels.reqFn}>{req.call.fn}</Stat>
          <Stat name={bad ? labels.spender : labels.recipient}>{bad ? `${shortHex(req.target)} (${labels.unknown})` : `Ben ${shortHex(req.target)}`}</Stat>
          <Stat name={labels.amount}>{bad ? labels.unlimited : '10 TKN'}</Stat>
        </Stats>
        <Stats>
          <Stat name={labels.status} tone={st.decision === 'pending' ? undefined : (st.decision === 'confirmed') === bad ? 'bad' : 'good'} wrap>
            {status}
          </Stat>
          {st.signature && nums && <Stat name={labels.signature}>{shortHex(st.signature.r, 10, 6)}</Stat>}
        </Stats>
      </div>
    );
  }

  if (stepId === 'rpc') {
    const provider = activeProvider(st.providerDown, st.switched);
    const facts = RPC[st.rpcMode];
    const dead = provider === null;
    return (
      <div className="ctl" style={box}>
        <div style={ROW}>
          <Seg
            label={labels.rpcNode}
            value={st.rpcMode}
            options={[
              ['read', labels.modeRead],
              ['write', labels.modeWrite],
            ]}
            onChange={st.setRpcMode}
          />
          <label className="ctl-check">
            <input type="checkbox" checked={st.providerDown} onChange={(e) => st.setProviderDown(e.target.checked)} />
            {labels.providerDown}
          </label>
          {(!small || st.providerDown) && (
            <button type="button" style={small ? TIGHT : undefined} className="btn" onClick={() => st.setSwitched(!st.switched)} disabled={!st.providerDown && !st.switched}>
              {st.switched ? labels.switchBack : labels.switchProvider}
            </button>
          )}
        </div>
        <Stats>
          {nums && <Stat name={labels.method}>{facts.method}</Stat>}
          <Stat name={labels.gasStat}>{facts.gas ? labels.paysGas : labels.free}</Stat>
          <Stat name={labels.signature}>{facts.signature ? labels.required : labels.notNeeded}</Stat>
          <Stat name={labels.answer} tone={dead ? 'bad' : 'good'}>
            {dead ? labels.noAnswer : facts.waitsForBlock ? labels.nextBlock : labels.instant}
          </Stat>
        </Stats>
      </div>
    );
  }

  if (stepId === 'contract') {
    const call = buildCall(st.fn, PEOPLE[st.target].address, st.amount);
    const last = st.last;
    const targetLabel = st.fn === 'transfer' ? labels.recipient : st.fn === 'approve' ? labels.spender : labels.account;
    const resultText = !last
      ? labels.notRun
      : last.outcome === 'transferred'
        ? labels.resTransferred
        : last.outcome === 'approved'
          ? labels.resApproved
          : last.outcome === 'read'
            ? `${labels.resRead} ${last.returned ?? 0}`
            : labels.resReverted;
    return (
      <div className="ctl" style={box}>
        {!small && <div className="ctl-title">{labels.tryContract}</div>}
        <div style={{ ...ROW, alignItems: 'end' }}>
          {nums && (
            <label className="ctl-field" style={{ ...field, flex: '1 1 104px' }}>
              {labels.reqFn}
              <select id="call-fn" value={st.fn} onChange={(e) => st.setFn(e.target.value as Fn)}>
                {FNS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="ctl-field" style={field}>
            {targetLabel}
            <select id="call-to" value={st.target} onChange={(e) => st.setTarget(e.target.value as Who)}>
              {names.map(([w, n]) => (
                <option key={w} value={w}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="ctl-field" style={{ ...field, flex: '1 1 64px' }}>
            {labels.amount}
            <input id="call-amount" type="number" inputMode="numeric" min={0} max={MAX_AMOUNT} step={1} value={st.amount} disabled={st.fn === 'balanceOf'} onChange={(e) => st.setAmount(e.target.value)} style={{ width: '100%', color: 'var(--ink)', opacity: st.fn === 'balanceOf' ? 0.4 : 1 }} />
          </label>
        </div>
        <div style={ROW}>
          <button type="button" style={small ? TIGHT : undefined} className="btn btn-primary" onClick={() => st.run()}>
            {labels.sendCall}
          </button>
          <Stat name={labels.resultStat} tone={!last ? undefined : last.ok ? 'good' : 'bad'} wrap grow>
            {resultText}
          </Stat>
          {nums && !small && <Stat name="selector">{call.selector}</Stat>}
        </div>
        {expert && !small && <code style={MONO}>{call.data}</code>}
      </div>
    );
  }

  if (stepId === 'events') {
    const hits = filterLogs(st.token.logs, st.filter);
    const topics = topicsFor(st.filter);
    return (
      <div className="ctl" style={box}>
        {!small && <div className="ctl-title">{labels.tryEvents}</div>}
        <div style={{ ...ROW, alignItems: 'end' }}>
          <Seg label={labels.filter} value={st.filter.kind} options={FILTERS.map((k) => [k, labels[`filter_${k}`]])} onChange={st.setFilterKind} />
          <label className="ctl-field" style={{ ...field, flex: '0 1 96px' }}>
            <span style={small ? { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' } : undefined}>{labels.address}</span>
            <select id="log-who" value={st.filter.who} disabled={st.filter.kind === 'all'} onChange={(e) => st.setFilterWho(e.target.value as Who)}>
              {names.map(([w, n]) => (
                <option key={w} value={w}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button type="button" style={small ? TIGHT : undefined} className="btn" onClick={() => st.run('transfer')}>
            {labels.sendAgain}
          </button>
        </div>
        <Stats>
          <Stat name={labels.returned} tone={hits.length > 0 ? 'good' : undefined}>
            {hits.length} / {st.token.logs.length}
          </Stat>
          <Stat name={labels.lastCall} tone={st.last && !st.last.ok ? 'bad' : undefined}>
            Ayşe → {PEOPLE[st.target].name} {st.amount}
          </Stat>
        </Stats>
        {expert && !small && <code style={MONO}>topics: [{topics.map((t) => (t === null ? 'null' : shortHex(t, 10, 4))).join(', ')}]</code>}
      </div>
    );
  }

  return null;
}
