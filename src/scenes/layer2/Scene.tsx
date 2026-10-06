import { useThree } from '@react-three/fiber';
import { Fragment, type ReactNode } from 'react';
import {
  Anim,
  Ball,
  Block,
  Box,
  ChainLink,
  CoinStack,
  ContractMachine,
  FlowLine,
  Label,
  Packet,
  Person,
  ShadowGround,
  Token,
  type Vec3,
} from '../../scene/kit';
import type { SceneProps } from '../../scene/types';
import { shortHash } from '../../sim/sha256';
import type { ColorKey } from '../../theme/tokens';
import type { Lang, Level } from '../../types';
import {
  BATCH_SIZES,
  BLOB_EXP_MAX,
  BLOB_EXP_MIN,
  BLOB_MAX,
  BLOB_RETENTION_DAYS,
  BLOB_TARGET,
  CHALLENGE_DAYS,
  FORCE_WINDOW_H,
  MAX_DEMAND,
  MAX_FILL,
  OPT_DELAY_H,
  TRACE_STEPS,
  ZK_BATCH,
  ZK_DELAY_H,
  ZK_VERIFY_GAS,
  batchCost,
  batchSizeAt,
  blobGweiAt,
  blockFill,
  effectiveBlobGwei,
  gweiToUsd,
  leftOut,
  seqOnL1,
  withdrawal,
  TRANSFER_GAS,
  type Corruption,
  type DataMode,
  type SeqPhase,
} from './logic';
import { GAS_MAX, GAS_MIN, MAX_DAYS_OLD, useL2 } from './state';

type Labels = Record<string, string>;

const U = Math.SQRT1_2;
/** Ground point given in screen terms: `sx` to the right, `d` toward the viewer. */
const at = (sx: number, d: number, y = 0): Vec3 => [(sx + d) * U, y, (d - sx) * U];

/** Depth of the two strips: Ethereum behind, the rollup in front. */
const ZL1 = -2.6;
const ZL2 = 1.4;

const lines = (text: string) =>
  text.split('\n').map((l, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {l}
    </Fragment>
  ));

const locale = (lang: Lang) => (lang === 'tr' ? 'tr-TR' : 'en-US');
const safe = (n: number) => (Number.isFinite(n) ? n : 0);
const fmt = (n: number, lang: Lang, digits = 0) => safe(n).toLocaleString(locale(lang), { minimumFractionDigits: digits, maximumFractionDigits: digits });
const sig = (n: number, lang: Lang, digits = 3) => safe(n).toLocaleString(locale(lang), { maximumSignificantDigits: digits });

/** A price in gwei; very small ones are shown in wei. */
function gwei(g: number, lang: Lang): string {
  const v = safe(g);
  return v < 0.001 ? `${sig(v * 1e9, lang)} wei` : `${sig(v, lang)} gwei`;
}

function usd(v: number, lang: Lang): string {
  const x = safe(v);
  if (x > 0 && x < 0.0001) return `< $${fmt(0.0001, lang, 4)}`;
  return `$${x >= 1 ? fmt(x, lang, 2) : sig(x, lang, 2)}`;
}

/** How full a blob is; a nearly empty one is not shown as 0%. */
const pctFill = (pct: number, lang: Lang) => (pct > 0 && pct < 1 ? '< 1%' : `${fmt(pct, lang)}%`);

function span(hours: number, labels: Labels): string {
  const h = Math.max(0, Math.round(safe(hours)));
  const d = Math.floor(h / 24);
  return d > 0 ? `${d} ${labels.dayShort} ${h % 24} ${labels.hourShort}` : `${h} ${labels.hourShort}`;
}

interface PartProps {
  focus: boolean;
  level: Level;
  lang: Lang;
  labels: Labels;
  compact: boolean;
}

/** A translucent case with a solid fill inside, e.g. how full a block is. */
function Gauge({ size, fill, color, markAt }: { size: Vec3; fill: number; color: ColorKey; markAt?: number }) {
  const [w, h, d] = size;
  const f = Math.min(1, Math.max(0.02, fill));
  return (
    <group>
      <Box size={[w, h, d]} position={[0, h / 2, 0]} color="neutral" opacity={0.28} radius={0.06} />
      <Anim scale={[1, f, 1]} speed={7}>
        <Box size={[w - 0.14, h, d - 0.14]} position={[0, h / 2, 0]} color={color} radius={0.05} />
      </Anim>
      {markAt !== undefined && <Box size={[w + 0.24, 0.05, d + 0.24]} position={[0, h * markAt, 0]} color="ink" radius={0.02} />}
    </group>
  );
}

/* ---------- Step 1: scarce block space ---------- */

const QUEUE = 12;

function Scarce({ focus, level, lang, labels, compact }: PartProps) {
  const demand = useL2((s) => s.demand);
  const baseFee = useL2((s) => s.baseFee);
  const fill = blockFill(demand);
  const out = leftOut(demand);
  const waiting = Math.round((demand / MAX_DEMAND) * QUEUE);
  const fits = Math.round((MAX_FILL / MAX_DEMAND) * QUEUE);
  const coins = Math.min(26, Math.max(1, Math.round(4 + 3 * Math.log2(Math.max(0.01, baseFee) / 2))));
  return (
    <>
      {/* The next block: half full is the target, full is the hard limit. */}
      <group position={[0, 0, ZL1]}>
        <Gauge size={[1.7, 2.2, 1.7]} fill={fill / MAX_FILL} color={fill >= MAX_FILL ? 'invalid' : 'block'} markAt={0.5} />
        <Label position={[0, 3.0, 0]} show={focus} tone={fill >= MAX_FILL ? 'invalid' : 'block'}>
          {fill >= MAX_FILL ? labels.blockFull : `${labels.blockUsed} ${fill}%`}
          {level !== 'beginner' && !compact && (
            <>
              <br />
              <span style={{ fontWeight: 400 }}>{labels.ofTarget}</span>
            </>
          )}
        </Label>
      </group>
      {[1, 2, 3].map((i) => (
        <group key={i} position={[0.6 + i * 1.7, 0, ZL1]}>
          <Block size={0.95} />
          <ChainLink from={[-1.2, 0.5, 0]} to={[-0.5, 0.5, 0]} />
        </group>
      ))}
      {/* Transactions wanting in. The ones that cannot fit are red. */}
      {Array.from({ length: QUEUE }, (_, i) => (
        <Anim key={i} show={i < waiting} position={[-1.5 - i * 0.42, 0, ZL1]} speed={8}>
          <Packet size={0.28} color={i < fits ? 'tx' : 'invalid'} />
        </Anim>
      ))}
      <Label position={[-1.5 - 9.5 * 0.42, -0.5, ZL1 + 1.3]} show={focus && out > 0} tone="invalid">
        {labels.leftOut}
      </Label>
      {/* What one transfer costs right now. */}
      <group position={[-1.6, 0, ZL1 + 2.6]}>
        <Person />
        <group position={[1.1, 0, 0]}>
          <CoinStack count={coins} />
        </group>
        <Label position={[0.9, -0.75, 0.9]} show={focus} tone="tx">
          {labels.transferCosts} {usd(gweiToUsd(baseFee * TRANSFER_GAS), lang)}
          {level !== 'beginner' && (
            <>
              <br />
              <span style={{ fontWeight: 400 }}>
                {labels.baseFee} {gwei(baseFee, lang)}
              </span>
            </>
          )}
        </Label>
      </group>
      <Label position={[3.4, 2.4, ZL1]} show={focus && !compact} minLevel="expert" tone="mono">
        base ×= 1 + (used − target) / target / 8
      </Label>
    </>
  );
}

/* ---------- Step 2: the rollup idea ---------- */

const GRID_COLS = 10;
const GRID_MAX = 40;

function BatchGrid({ n }: { n: number }) {
  const shown = Math.min(GRID_MAX, n);
  return (
    <>
      {Array.from({ length: GRID_MAX }, (_, i) => (
        <Anim key={i} show={i < shown} position={[-5.6 + (i % GRID_COLS) * 0.4, 0, ZL2 - 0.6 + Math.floor(i / GRID_COLS) * 0.4]} speed={9}>
          <Packet size={0.24} glow={false} />
        </Anim>
      ))}
    </>
  );
}

function Rollup({ focus, level, lang, labels, compact }: PartProps) {
  const n = batchSizeAt(useL2((s) => s.batchIndex));
  const gas = useL2((s) => s.gasGwei);
  const blobExp = useL2((s) => s.blobExp);
  const mode = useL2((s) => s.mode);
  const c = batchCost(n, gas, blobGweiAt(blobExp), mode);
  const ratio = c.l1TxUsd > 0 ? c.perTxUsd / c.l1TxUsd : 1;
  const share = Math.min(3, Math.max(0.08, 2.1 + 0.5 * Math.log10(Math.max(1e-6, ratio))));
  const crate = 0.5 + 0.22 * Math.log10(n);
  return (
    <>
      <BatchGrid n={n} />
      <Label position={[-3.8, 0.9, ZL2 - 0.9]} show={focus && !compact} tone="tx">
        {fmt(n, lang)} {labels.txsOnL2}
      </Label>
      <FlowLine points={[[-1.5, 0.3, ZL2], [-0.4, 0.3, ZL2]]} color="tx" />
      {/* The batch: all of them squeezed into one parcel of data. */}
      <Anim position={[0.6, 0, ZL2]} scale={crate} speed={7}>
        <Box size={[1.2, 1, 1.2]} position={[0, 0.5, 0]} color="tx" radius={0.1} />
      </Anim>
      <Label position={[0.6, -0.75, ZL2 + 1.1]} show={focus} minLevel="intermediate" tone="plain">
        {labels.batch} · {fmt(c.bytes / 1000, lang, c.bytes < 10_000 ? 1 : 0)} kB
      </Label>
      <FlowLine points={[[0.6, 1.3, ZL2 - 0.6], [0.3, 2.2, -0.6], [0, 1.8, ZL1 + 0.3]]} color="tx" curved />
      {/* On Ethereum: the data and a commitment to the new state. */}
      <group position={[0, 0, ZL1]}>
        <Block size={1.3} />
        <Box size={[0.5, 0.5, 0.5]} position={[0.95, 0.25, 0.2]} color="tokenB" radius={0.08} />
        <Box size={[0.42, 0.3, 0.42]} position={[0, 1.45, 0]} color="contract" radius={0.06} />
        <Label position={[0, 2.5, 0]} show={focus} tone="block">
          {lines(level === 'beginner' ? labels.onL1B : labels.onL1)}
        </Label>
      </group>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.9, 0, ZL1]}>
          <Block size={0.9} />
          <ChainLink from={[-side * 0.5, 0.5, 0]} to={[-side * 1.2, 0.5, 0]} />
        </group>
      ))}
      {/* The bill: one L1 transfer next to one user's share of the batch. */}
      <group position={[3.6, 0, ZL2]}>
        <Box size={[0.7, 2.1, 0.7]} position={[0, 1.05, 0]} color="block" radius={0.06} />
        <Label position={[0, 2.75, 0]} show={focus} tone="block">
          {compact ? 'L1' : labels.sameOnL1} {usd(c.l1TxUsd, lang)}
        </Label>
      </group>
      <group position={[5.2, 0, ZL2]}>
        <Anim scale={[1, share / 2.1, 1]} speed={7}>
          <Box size={[0.7, 2.1, 0.7]} position={[0, 1.05, 0]} color="valid" glow radius={0.06} />
        </Anim>
        <Label position={[0.5, -0.7, 0.9]} show={focus} tone="valid">
          {compact ? 'L2' : labels.eachPays} {usd(c.perTxUsd, lang)}
        </Label>
      </group>
      <Label position={[4.4, 3.6, ZL2]} show={focus && !compact} minLevel="expert" tone="mono">
        fee ≈ (fixed L1 cost + data) / N
      </Label>
    </>
  );
}

/* ---------- Step 3: the sequencer ---------- */

const USER: Vec3 = [-5.2, 0, ZL2];
const SEQ: Vec3 = [-1.2, 0, ZL2];
const L2BLOCK: Vec3 = [2.6, 0, ZL2];
const INBOX: Vec3 = [-3.2, 0, ZL1];
const L1BLOCK: Vec3 = [2.6, 0, ZL1];
const up = (p: Vec3, y: number): Vec3 => [p[0], y, p[2]];

const SEQ_SPOT: Record<SeqPhase, Vec3> = {
  idle: [USER[0] + 0.7, 0, USER[2]],
  stuck: [-3.2, 0, ZL2],
  soft: up(L2BLOCK, 0.85),
  batched: up(L1BLOCK, 1.15),
  final: up(L1BLOCK, 1.15),
  queued: up(INBOX, 0.75),
  included: up(L2BLOCK, 0.85),
  forced: up(L2BLOCK, 0.85),
};
const SEQ_TONE: Record<SeqPhase, 'tx' | 'valid' | 'invalid' | 'actor'> = {
  idle: 'tx',
  stuck: 'invalid',
  soft: 'actor',
  batched: 'tx',
  final: 'valid',
  queued: 'tx',
  included: 'valid',
  forced: 'valid',
};

function Sequencer({ focus, labels, compact }: PartProps) {
  const online = useL2((s) => s.sequencerOnline);
  const seq = useL2((s) => s.seq);
  const p = seq.phase;
  const viaL1 = p === 'queued' || p === 'included' || p === 'forced';
  const done = p === 'final' || p === 'included' || p === 'forced';
  return (
    <>
      <group position={USER}>
        <Person />
      </group>
      <group position={SEQ}>
        <ContractMachine color={online ? 'actor' : 'neutral'} active={online} glow={online && p === 'soft'} size={0.85} />
        <Label position={[0.4, -0.7, 1.2]} show={focus} tone={online ? 'actor' : 'invalid'}>
          {online ? labels.sequencer : labels.sequencerOff}
        </Label>
      </group>
      <group position={L2BLOCK}>
        <Block size={0.8} color={p === 'soft' ? 'neutral' : 'block'} />
        <group position={[1.3, 0, 0]}>
          <Block size={0.8} />
          <ChainLink from={[-0.4, 0.4, 0]} to={[-0.9, 0.4, 0]} />
        </group>
        <Label position={[1.6, -0.7, 1.0]} show={focus && !compact} tone="plain">
          {labels.l2Chain}
        </Label>
      </group>
      <group position={INBOX}>
        <ContractMachine size={0.7} active={viaL1} glow={p === 'queued'} />
        <Label position={[-1.2, 1.6, -0.6]} show={focus} tone={viaL1 ? 'tx' : 'default'}>
          {labels.l1Inbox}
        </Label>
      </group>
      <group position={L1BLOCK}>
        <Block size={1.1} color={p === 'final' ? 'valid' : 'block'} glow={p === 'final'} />
        <group position={[1.6, 0, 0]}>
          <Block size={0.9} />
          <ChainLink from={[-0.45, 0.5, 0]} to={[-1.05, 0.5, 0]} />
        </group>
      </group>
      {/* Normal route: user → sequencer → L2 block → batch on L1. */}
      <FlowLine points={[up(USER, 0.3), [SEQ[0] - 0.9, 0.3, ZL2]]} color={online ? 'actor' : 'neutral'} dashed={!online} />
      <FlowLine points={[[SEQ[0] + 0.9, 0.3, ZL2], [L2BLOCK[0] - 0.6, 0.3, ZL2]]} color={online ? 'actor' : 'neutral'} dashed={!online} />
      <FlowLine points={[[L2BLOCK[0], 0.3, ZL2 - 0.6], [L1BLOCK[0], 0.3, ZL1 + 0.8]]} color={online ? 'actor' : 'neutral'} dashed={!online} />
      {/* Escape route: user → L1 inbox → derived into the L2 chain. */}
      <FlowLine points={[[USER[0] + 0.3, 0.3, ZL2 - 0.6], [INBOX[0] - 0.3, 0.3, ZL1 + 0.8]]} color={viaL1 ? 'tx' : 'chain'} dashed={!viaL1} />
      <FlowLine points={[[INBOX[0] + 0.8, 0.3, ZL1 + 0.5], [L2BLOCK[0] - 0.5, 0.3, ZL2 - 0.7]]} color={viaL1 ? 'tx' : 'chain'} dashed={!viaL1} />

      <Anim position={SEQ_SPOT[p]} speed={5}>
        <Packet size={0.36} color={p === 'stuck' ? 'invalid' : done ? 'valid' : 'tx'} />
      </Anim>
      <Label position={[SEQ_SPOT[p][0], SEQ_SPOT[p][1] + 1.5, SEQ_SPOT[p][2]]} show={focus} tone={SEQ_TONE[p]}>
        {labels[`seq_${p}`]}
        {p === 'queued' && (
          <>
            <br />
            <span style={{ fontWeight: 400 }}>
              {labels.waited} {seq.waited} / {FORCE_WINDOW_H} {labels.hourShort}
            </span>
          </>
        )}
      </Label>
      <Label position={[L1BLOCK[0] + 0.8, 2.1, ZL1]} show={focus && !compact} minLevel="intermediate" tone={seqOnL1(p) ? 'valid' : 'plain'}>
        {seqOnL1(p) ? labels.dataOnL1 : labels.dataNotOnL1}
      </Label>
      <Label position={[1.2, -0.9, ZL2 + 1.6]} show={focus && !compact} minLevel="expert" tone="mono">
        L2 state = derive(L1 batches + L1 deposits)
      </Label>
    </>
  );
}

/* ---------- Step 4: optimistic rollups ---------- */

const TRACE_X = (i: number) => -4.3 + i * 0.5;

function Optimistic({ focus, labels, compact }: PartProps) {
  const opt = useL2((s) => s.opt);
  const { status, dispute, bad, day } = opt;
  const decided = status === 'rejected' || status === 'defended' || (status === 'finalized' && dispute !== null);
  const badFinal = status === 'finalized' && bad;
  const rootColor: ColorKey =
    status === 'none' ? 'neutral' : status === 'rejected' || badFinal ? 'invalid' : status === 'finalized' ? 'valid' : status === 'disputed' ? 'tx' : 'block';
  const proposerBond = status === 'none' ? 0 : status === 'rejected' ? 0 : status === 'defended' || (status === 'finalized' && dispute) ? 2 : 1;
  const challengerBond = dispute ? (status === 'rejected' ? 2 : status === 'disputed' ? 1 : 0) : 0;
  const stepColor = (i: number): ColorKey => {
    if (!dispute) return 'neutral';
    if (decided && i === dispute.hi) return status === 'rejected' ? 'invalid' : 'valid';
    if (i <= dispute.lo) return 'valid';
    if (i <= dispute.hi) return 'tx';
    return 'neutral';
  };
  const narrowed = dispute ? dispute.hi - dispute.lo === 1 : false;
  return (
    <>
      {/* On Ethereum: the rollup's contract, the proposed state root and the challenge window. */}
      <group position={[-4.6, 0, ZL1]}>
        <ContractMachine size={0.8} active={status === 'disputed'} />
        <Label position={[0, 1.9, 0]} show={focus && !compact} tone="plain">
          {labels.rollupContract}
        </Label>
      </group>
      <Anim position={[-2.4, 0, ZL1]} scale={status === 'none' ? 0.6 : status === 'rejected' ? 0.75 : 1} rotation={[0, 0, status === 'rejected' ? 0.5 : 0]} speed={6}>
        <Block size={1.1} color={rootColor} glow={status === 'finalized' || status === 'rejected'} />
      </Anim>
      <Label position={[-2.4, 2.3, ZL1]} show={focus} tone={status === 'rejected' || badFinal ? 'invalid' : status === 'finalized' ? 'valid' : 'block'}>
        {labels[`opt_${badFinal ? 'badFinal' : status}`]}
      </Label>
      {Array.from({ length: CHALLENGE_DAYS }, (_, i) => (
        <Box key={i} size={[0.5, i < day ? 0.6 : 0.2, 0.9]} position={[0.2 + i * 0.68, i < day ? 0.3 : 0.1, ZL1]} color={i < day ? (status === 'finalized' ? rootColor : 'actor') : 'neutral'} glow={i < day} radius={0.05} />
      ))}
      <Label position={[0.2 + 3 * 0.68, 1.5, ZL1]} show={focus && status !== 'none' && !compact} tone="actor">
        {labels.window}: {labels.dayWord} {day} / {CHALLENGE_DAYS}
      </Label>

      {/* On the rollup: the execution the root claims to summarise, step by step. */}
      {Array.from({ length: TRACE_STEPS }, (_, k) => {
        const i = k + 1;
        const c = stepColor(i);
        return (
          <Anim key={i} position={[TRACE_X(i), 0, ZL2]} scale={c === 'neutral' ? 0.8 : 1} speed={8}>
            <Box size={[0.36, c === 'neutral' ? 0.36 : 0.6, 0.6]} position={[0, c === 'neutral' ? 0.18 : 0.3, 0]} color={c} glow={c === 'tx' || c === 'invalid'} radius={0.05} />
          </Anim>
        );
      })}
      <Label position={[TRACE_X(dispute ? (dispute.lo + dispute.hi + 1) / 2 : 8.5), 1.4, ZL2]} show={focus && status !== 'none'} tone={dispute ? (decided ? (status === 'rejected' ? 'invalid' : 'valid') : 'tx') : 'plain'}>
        {!dispute
          ? labels.trace
          : decided
            ? `${labels.l1Ran} ${dispute.hi}: ${status === 'rejected' ? labels.wasWrong : labels.wasRight}`
            : narrowed
              ? `${labels.oneStepLeft} ${dispute.hi}`
              : `${labels.inDispute} ${dispute.lo + 1}–${dispute.hi}`}
      </Label>
      <group position={[-5.6, 0, ZL2]}>
        <Person color={bad && status !== 'none' ? 'invalid' : 'actor'} />
        <group position={[0, 0, 0.9]}>
          <CoinStack count={proposerBond * 3} radius={0.22} />
        </group>
        <Label position={[0, -0.8, 1.5]} show={focus && !compact} tone="actor">
          {labels.proposer}
        </Label>
      </group>
      <group position={[5.0, 0, ZL2]}>
        <Person color={dispute ? 'valid' : 'neutral'} glow={status === 'disputed'} />
        <group position={[0, 0, 0.9]}>
          <CoinStack count={challengerBond * 3} radius={0.22} />
        </group>
        <Label position={[0, -0.8, 1.5]} show={focus} tone={dispute ? 'valid' : 'default'}>
          {labels.challenger}
        </Label>
      </group>
    </>
  );
}

/* ---------- Step 5: zk rollups ---------- */

function Zk({ focus, level, lang, labels, compact }: PartProps) {
  const corruption = useL2((s) => s.corruption);
  const zk = useL2((s) => s.zk);
  const ran = zk !== null;
  const ok = zk?.accepted ?? false;
  return (
    <>
      {ZK_BATCH.map((_, i) => (
        <group key={i} position={[-5.4 + (i % 2) * 0.5, 0, ZL2 - 0.25 + Math.floor(i / 2) * 0.5]}>
          <Packet size={0.32} glow={false} />
        </group>
      ))}
      <Label position={[-5.2, 1.1, ZL2]} show={focus} tone="tx">
        {labels.zkBatch}
      </Label>
      <FlowLine points={[[-4.3, 0.3, ZL2], [-3.2, 0.3, ZL2]]} color="tx" />
      <group position={[-2.1, 0, ZL2]}>
        <ContractMachine color="actor" active={!ran} glow={ran && zk.proved} />
        <Label position={[0, 2.4, 0]} show={focus} tone="actor">
          {labels.prover}
        </Label>
      </group>
      {/* The proof: tiny compared with the work it vouches for. */}
      <Anim show={ran} position={ran ? [1.5, 2.3, ZL1] : [-2.1, 1.9, ZL2]} speed={3}>
        <Ball radius={0.22} color={zk?.proved ? 'valid' : 'invalid'} glow />
      </Anim>
      <FlowLine points={[[-1.4, 1.5, ZL2 - 0.5], [0.4, 2.6, -0.6], [1.5, 2.0, ZL1 + 0.3]]} color={ran ? (ok ? 'valid' : 'invalid') : 'chain'} dashed={!ran} curved />
      <Label position={[0.2, 3.3, -0.6]} show={focus && ran} tone={zk?.proved ? 'valid' : 'invalid'}>
        {zk?.proved ? labels.proofMade : labels.noProof}
      </Label>

      <group position={[1.5, 0, ZL1]}>
        <ContractMachine size={0.85} active={ran} glow={ran && ok} />
        <Label position={[0.3, -0.8, 1.3]} show={focus} tone={ran ? (ok ? 'valid' : 'invalid') : 'default'}>
          {labels.verifier}
          {level !== 'beginner' && !compact && (
            <>
              <br />
              <span style={{ fontWeight: 400 }}>
                ≈ {fmt(ZK_VERIFY_GAS, lang)} gas
              </span>
            </>
          )}
        </Label>
      </group>
      {/* The batch data posted next to the proof. */}
      <group position={[-0.6, 0, ZL1]}>
        <Box size={[0.8, 0.6, 0.8]} position={[0, 0.3, 0]} color={corruption === 'data' ? 'invalid' : 'tokenB'} glow={corruption === 'data'} radius={0.08} />
        <Label position={[-0.3, 1.3, 0]} show={focus && (corruption === 'data' || !compact)} tone={corruption === 'data' ? 'invalid' : 'tokenB'}>
          {corruption === 'data' ? labels.dataAltered : labels.dataPosted}
        </Label>
      </group>
      <group position={[4.2, 0, ZL1]}>
        <Anim scale={ran && !ok ? 0.7 : 1} rotation={[0, 0, ran && !ok ? 0.5 : 0]} speed={6}>
          <Block size={1.1} color={!ran ? (corruption === 'root' ? 'invalid' : 'neutral') : ok ? 'valid' : 'invalid'} glow={ran} />
        </Anim>
        <Label position={[0, 2.2, 0]} show={focus} tone={!ran ? (corruption === 'root' ? 'invalid' : 'block') : ok ? 'valid' : 'invalid'}>
          {!ran ? (corruption === 'root' ? labels.rootWrong : labels.rootClaimed) : ok ? labels.rootAccepted : labels.rootRejected}
        </Label>
      </group>
      <Label position={[3.4, -0.9, ZL2 + 0.6]} show={focus && !compact && ran} minLevel="expert" tone="mono">
        verify(π, {shortHash(zk?.statement.pre ?? '', 4, 0)} {shortHash(zk?.statement.post ?? '', 4, 0)} {shortHash(zk?.statement.data ?? '', 4, 0)}) = {String(ok)}
      </Label>
    </>
  );
}

/* ---------- Step 6: data availability and blobs ---------- */

const SLOT_X = (i: number) => -3.3 + i * 0.44;

function Blobs({ focus, level, lang, labels, compact }: PartProps) {
  const n = batchSizeAt(useL2((s) => s.batchIndex));
  const gas = useL2((s) => s.gasGwei);
  const blobExp = useL2((s) => s.blobExp);
  const mode = useL2((s) => s.mode);
  const days = useL2((s) => s.daysOld);
  const c = batchCost(n, gas, blobGweiAt(blobExp), mode);
  const pruned = mode === 'blob' && days > BLOB_RETENTION_DAYS;
  const bulge = mode === 'calldata' ? 0.25 + 0.18 * Math.log10(n) : 0;
  return (
    <>
      <group position={[-5.0, 0, ZL1]}>
        <Block size={1.4} />
        {/* Calldata lives inside the block, for good. */}
        <Anim show={mode === 'calldata'} position={[0, 1.4, 0]} scale={[1, Math.max(0.2, bulge), 1]} speed={7}>
          <Box size={[1.2, 1, 1.2]} position={[0, 0.5, 0]} color="tx" glow radius={0.08} />
        </Anim>
        {/* The commitment to the data: always kept. */}
        <Box size={[0.4, 0.3, 0.4]} position={[0, 0.5, 0.85]} color="contract" radius={0.06} />
        <Label position={[-0.6, mode === 'calldata' ? (compact ? 2.3 : 2.9) : 2.4, 0]} show={focus && (mode === 'calldata' || !compact)} tone={mode === 'calldata' ? 'tx' : 'block'}>
          {mode === 'calldata' ? labels.calldataIn : labels.commitmentIn}
        </Label>
      </group>
      {/* Blob slots beside the block: up to the maximum, priced around the target. */}
      {Array.from({ length: BLOB_MAX }, (_, i) => (
        <group key={i} position={[SLOT_X(i), 0, ZL1]}>
          <Box size={[0.34, 0.06, 1.2]} position={[0, 0.03, 0]} color="neutral" radius={0.02} />
          <Anim show={i < c.blobs} speed={8}>
            <Box size={[0.3, 0.9, 1.1]} position={[0, 0.51, 0]} color="tokenB" glow={!pruned} opacity={pruned ? 0.22 : 1} radius={0.05} />
          </Anim>
        </group>
      ))}
      <Box size={[0.06, 0.5, 1.5]} position={[SLOT_X(BLOB_TARGET) - 0.22, 0.25, ZL1]} color="chain" radius={0.02} />
      <Label position={[SLOT_X(BLOB_TARGET) + 2.6, 1.6, ZL1 - 0.6]} show={focus && !compact} minLevel="intermediate" tone="plain">
        {labels.targetMax}
      </Label>
      <Label position={[SLOT_X(Math.max(0, c.blobs - 1)), 1.6, ZL1]} show={focus && mode === 'blob'} tone={pruned ? 'invalid' : 'tokenB'}>
        {pruned ? labels.blobPruned : `${c.blobs} blob · ${pctFill(c.blobFillPct, lang)} ${labels.full}`}
      </Label>

      {/* On the rollup: the batch that has to be published. */}
      <BatchGrid n={n} />
      <Label position={[-3.8, 0.9, ZL2 - 0.9]} show={focus} tone="tx">
        {fmt(n, lang)} tx · {fmt(c.bytes / 1000, lang, c.bytes < 10_000 ? 1 : 0)} kB
      </Label>
      <FlowLine points={[[-3.8, 0.4, ZL2 - 1.0], [mode === 'calldata' ? -4.8 : -3.2, 0.9, ZL1 + 0.9]]} color={mode === 'calldata' ? 'tx' : 'tokenB'} />
      {/* A new node that wants to rebuild the rollup's state from L1. */}
      <group position={[3.2, 0, ZL2]}>
        <Person color={pruned ? 'neutral' : 'actor'} />
        <Label position={[0.6, -0.8, 1.2]} show={focus} tone={pruned ? 'invalid' : 'valid'}>
          {lines(pruned ? labels.cantDownload : labels.canDownload)}
        </Label>
      </group>
      <Label position={[1.6, 2.6, ZL2]} show={focus} tone="valid">
        {labels.perTx} {usd(c.perTxUsd, lang)}
        {level !== 'beginner' && mode === 'blob' && !compact && (
          <>
            <br />
            <span style={{ fontWeight: 400 }}>blob {gwei(effectiveBlobGwei(blobGweiAt(blobExp), gas), lang)}</span>
          </>
        )}
      </Label>
      <Label position={[5.6, 1.5, ZL1 + 1.5]} show={focus && !compact} minLevel="expert" tone="mono">
        4096 × 32 B = 131072 B · KZG
      </Label>
    </>
  );
}

/* ---------- Step 7: bridging and withdrawals ---------- */

const TRACK_FROM = -3.4;
const TRACK_TO = 3.2;
const TRACK_Z = { zk: ZL2 - 0.7, opt: ZL2 + 0.9 };
const along = (t: number) => TRACK_FROM + (TRACK_TO - TRACK_FROM) * Math.min(1, Math.max(0, t));

function Bridge({ focus, labels, compact }: PartProps) {
  const elapsed = useL2((s) => s.elapsed);
  const w = withdrawal(elapsed ?? 0);
  const started = elapsed !== null;
  const track = (key: 'zk' | 'opt', progress: number, done: boolean, left: number, ticks: number) => {
    const z = TRACK_Z[key];
    return (
      <group key={key}>
        <Box size={[TRACK_TO - TRACK_FROM, 0.08, 0.5]} position={[(TRACK_FROM + TRACK_TO) / 2, 0.04, z]} color="neutral" radius={0.03} />
        {Array.from({ length: ticks + 1 }, (_, i) => (
          <Box key={i} size={[0.05, 0.14, 0.6]} position={[along(i / ticks), 0.07, z]} color="chain" radius={0.01} />
        ))}
        <Anim show={started} position={[along(progress), 0.1, z]} scale={0.6} speed={5}>
          <Token color={done ? 'tokenA' : 'tokenB'} />
        </Anim>
        <Label position={[TRACK_FROM - 0.3, compact && key === 'zk' ? 1.9 : 0.9, z]} show={focus} tone={key === 'zk' ? 'actor' : 'block'}>
          {compact ? (key === 'zk' ? 'zk' : 'optimistic') : labels[`${key}Rollup`]}
        </Label>
        <Label position={[along(progress) + 0.3, 1.3, z]} show={focus && started} tone={done ? 'valid' : 'default'}>
          {done ? labels.arrived : `${labels.left} ${span(left, labels)}`}
        </Label>
      </group>
    );
  };
  return (
    <>
      <group position={[-5.4, 0, ZL2]}>
        <Person />
        <Label position={[0, -0.8, 1.4]} show={focus && !compact} tone="actor">
          {labels.you}
        </Label>
      </group>
      {track('zk', w.zkProgress, w.zkDone, w.zkLeftH, 3)}
      {track('opt', w.optProgress, w.optDone, w.optLeftH, 7)}
      {/* The bridge contract on Ethereum holds the real coins. */}
      <group position={[4.6, 0, ZL1]}>
        <ContractMachine size={0.9} active={started} glow={w.optDone} />
        <group position={[-1.4, 0, 0]}>
          <CoinStack count={8 - (w.zkDone ? 2 : 0) - (w.optDone ? 2 : 0)} radius={0.26} />
        </group>
        <Label position={[0, 2.2, 0]} show={focus} tone="block">
          {lines(labels.bridgeContract)}
        </Label>
      </group>
      <FlowLine points={[[TRACK_TO + 0.2, 0.3, TRACK_Z.zk], [4.2, 0.3, ZL1 + 0.9]]} color={w.zkDone ? 'valid' : 'chain'} dashed={!w.zkDone} />
      <FlowLine points={[[TRACK_TO + 0.2, 0.3, TRACK_Z.opt], [5.0, 0.3, ZL1 + 0.9]]} color={w.optDone ? 'valid' : 'chain'} dashed={!w.optDone} />
      {/* Whoever can change the contract can change the rules. */}
      <group position={[0.4, 0, ZL1]}>
        <Box size={[1.2, 0.5, 0.8]} position={[0, 0.25, 0]} color="contract" radius={0.08} />
        <Box size={[0.5, 0.35, 0.5]} position={[0, 0.67, 0]} color="tx" radius={0.08} />
        <Label position={[0, 1.6, 0]} show={focus && !compact} minLevel="intermediate" tone="plain">
          {lines(labels.upgradeKeys)}
        </Label>
      </group>
      <Label position={[-3.4, 1.4, ZL1]} show={focus && !compact} minLevel="expert" tone="mono">
        withdraw: L2 message → proven against a final root on L1
      </Label>
    </>
  );
}

/* ---------- Scene ---------- */

/** Model size and how far up the screen it moves on a phone, per step. */
const COMPACT: Record<string, { scale: number; lift: number }> = {
  scarce: { scale: 0.8, lift: 3.4 },
  rollup: { scale: 0.72, lift: 4.4 },
  sequencer: { scale: 0.7, lift: 5 },
  optimistic: { scale: 0.7, lift: 5 },
  zk: { scale: 0.72, lift: 4.4 },
  blobs: { scale: 0.72, lift: 4.4 },
  bridge: { scale: 0.72, lift: 4.4 },
};

export default function Scene({ stepId, level, lang, labels }: SceneProps) {
  const compact = useThree((s) => s.size.width) < 560;
  const fit = compact ? COMPACT[stepId] : undefined;
  const part = (id: string): PartProps => ({ focus: stepId === id, level, lang, labels, compact });
  const l2 = stepId !== 'scarce';
  const parts: [string, (p: PartProps) => ReactNode][] = [
    ['scarce', Scarce],
    ['rollup', Rollup],
    ['sequencer', Sequencer],
    ['optimistic', Optimistic],
    ['zk', Zk],
    ['blobs', Blobs],
    ['bridge', Bridge],
  ];
  return (
    <>
      <ShadowGround />
      {/* On a phone the panel covers the lower part of the canvas: shrink the model and move it up the screen. */}
      <Anim position={fit ? at(0, -fit.lift) : [0, 0, 0]} scale={fit ? fit.scale : 1} speed={5}>
        <Box size={[13.4, 0.3, 2.8]} position={[0, -0.15, ZL1]} color="ground" radius={0.14} />
        <Label position={[-7.3, 0.2, ZL1]} tone="block">
          {compact ? 'L1' : labels.l1}
        </Label>
        <Anim show={l2} speed={5}>
          <Box size={[13.4, 0.3, 3.6]} position={[0, -0.15, ZL2 + 0.2]} color="platform" radius={0.14} />
          <Label position={[-7.3, 0.2, ZL2 + 0.4]} tone="tx">
            {compact ? 'L2' : labels.l2}
          </Label>
        </Anim>
        {parts.map(([id, Part]) => (
          <Anim key={id} show={stepId === id} speed={7}>
            <Part {...part(id)} />
          </Anim>
        ))}
      </Anim>
    </>
  );
}

/* ---------- Controls ---------- */

function Stat({ name, tone, children }: { name: string; tone?: 'good' | 'bad'; children: ReactNode }) {
  return (
    <span className="ctl-stat">
      <span>{name}</span>
      <strong data-tone={tone}>{children}</strong>
    </span>
  );
}

function Seg<T extends string>({ value, options, onPick, label }: { value: T; options: [T, string][]; onPick: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label} style={{ flexWrap: 'wrap' }}>
      {options.map(([id, text]) => (
        <button key={id} type="button" data-opt={id} aria-pressed={value === id} onClick={() => onPick(id)} style={{ minHeight: 32, padding: '0 8px', fontSize: '0.8rem' }}>
          {text}
        </button>
      ))}
    </div>
  );
}

function Range({ id, label, value, min, max, step = 1, onChange }: { id: string; label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <label className="ctl-field" style={{ minWidth: 96 }}>
      <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
      <input id={id} type="range" min={min} max={max} step={step} value={value} aria-valuetext={label} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Btn({ id, primary, disabled, onClick, children }: { id: string; primary?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button id={id} type="button" className={primary ? 'btn btn-primary' : 'btn'} disabled={disabled} onClick={onClick} style={{ minHeight: 32, padding: '0 9px', fontSize: '0.82rem' }}>
      {children}
    </button>
  );
}

const PANEL = { gap: '4px 10px', maxWidth: 620 };
const ROW = { display: 'flex', gap: 10, flexBasis: '100%' };
const STATS = { gap: '2px 12px', flexBasis: '100%' };

function ScarceControls({ labels, lang }: SceneProps) {
  const s = useL2();
  const out = leftOut(s.demand);
  return (
    <div className="ctl" style={PANEL}>
      <Range id="l2-demand" label={`${labels.demand}: ${s.demand}%`} value={s.demand} min={0} max={MAX_DEMAND} step={10} onChange={s.setDemand} />
      <Btn id="l2-block" primary onClick={() => s.produce(1)}>
        {labels.nextBlock}
      </Btn>
      <Btn id="l2-block10" onClick={() => s.produce(10)}>
        {labels.tenBlocks}
      </Btn>
      <Btn id="l2-fee-reset" onClick={s.resetFee}>
        {labels.reset}
      </Btn>
      <div className="ctl-stats" style={STATS}>
        <Stat name={labels.blocksMade}>{s.blocks}</Stat>
        <Stat name={labels.baseFee} tone={s.demand > 100 ? 'bad' : s.demand < 100 ? 'good' : undefined}>
          {gwei(s.baseFee, lang)}
        </Stat>
        <Stat name={labels.oneTransfer}>{usd(gweiToUsd(s.baseFee * TRANSFER_GAS), lang)}</Stat>
        <Stat name={labels.leftOutStat} tone={out > 0 ? 'bad' : 'good'}>
          {out > 0 ? `${Math.round((out / s.demand) * 100)}%` : labels.nobody}
        </Stat>
      </div>
    </div>
  );
}

function RollupControls({ labels, lang }: SceneProps) {
  const s = useL2();
  const n = batchSizeAt(s.batchIndex);
  const c = batchCost(n, s.gasGwei, blobGweiAt(s.blobExp), s.mode);
  return (
    <div className="ctl" style={PANEL}>
      <div style={ROW}>
        <Range id="l2-batch" label={`${labels.batchSize}: ${fmt(n, lang)}`} value={s.batchIndex} min={0} max={BATCH_SIZES.length - 1} onChange={s.setBatchIndex} />
        <Range id="l2-gas" label={`${labels.gasPrice}: ${sig(s.gasGwei, lang)} gwei`} value={s.gasGwei} min={GAS_MIN} max={GAS_MAX} step={0.1} onChange={s.setGasGwei} />
      </div>
      <div className="ctl-stats" style={STATS}>
        <Stat name={labels.batchOnL1}>{usd(gweiToUsd(c.totalGwei), lang)}</Stat>
        <Stat name={labels.feePerUser} tone={c.timesCheaper > 1 ? 'good' : 'bad'}>
          {usd(c.perTxUsd, lang)}
        </Stat>
        <Stat name={labels.sameOnL1}>{usd(c.l1TxUsd, lang)}</Stat>
        <Stat name={labels.cheaper} tone={c.timesCheaper > 1 ? 'good' : 'bad'}>
          {c.timesCheaper >= 1 ? `${sig(c.timesCheaper, lang, 2)}×` : labels.notCheaper}
        </Stat>
      </div>
    </div>
  );
}

function SequencerControls({ labels }: SceneProps) {
  const s = useL2();
  const p = s.seq.phase;
  const done = p === 'final' || p === 'included' || p === 'forced';
  const canSend = p === 'idle' || p === 'stuck';
  const canForce = canSend || p === 'soft';
  return (
    <div className="ctl" style={PANEL}>
      <label className="ctl-check" style={{ minHeight: 32, fontSize: '0.82rem' }}>
        <input id="seq-off" type="checkbox" checked={!s.sequencerOnline} onChange={(e) => s.setSequencerOnline(!e.target.checked)} />
        {labels.seqOffline}
      </label>
      <Btn id="seq-send" primary disabled={!canSend} onClick={() => s.seqDo('send')}>
        {labels.sendViaSeq}
      </Btn>
      <Btn id="seq-force" disabled={!canForce} onClick={() => s.seqDo('force')}>
        {labels.sendViaL1}
      </Btn>
      <Btn id="seq-next" disabled={p === 'idle'} onClick={() => s.seqDo('next')}>
        {done ? labels.again : p === 'queued' && !s.sequencerOnline ? labels.wait4h : labels.nextStep}
      </Btn>
      <div className="ctl-stats" style={STATS}>
        <Stat name={labels.sequencer} tone={s.sequencerOnline ? 'good' : 'bad'}>
          {s.sequencerOnline ? labels.stOnline : labels.stOffline}
        </Stat>
        <Stat name={labels.txStatus} tone={p === 'stuck' ? 'bad' : done ? 'good' : undefined}>
          {labels[`seq_${p}`]}
        </Stat>
        <Stat name={labels.dataWhere} tone={seqOnL1(p) ? 'good' : p === 'idle' ? undefined : 'bad'}>
          {seqOnL1(p) ? labels.dataOnL1 : labels.dataNotOnL1}
        </Stat>
        <Stat name={labels.inboxWait}>
          {s.seq.waited} / {FORCE_WINDOW_H} {labels.hourShort}
        </Stat>
      </div>
    </div>
  );
}

function OptimisticControls({ labels }: SceneProps) {
  const s = useL2();
  const { status, dispute, bad, day } = s.opt;
  const badFinal = status === 'finalized' && bad;
  const open = status === 'pending';
  const narrowed = dispute ? dispute.hi - dispute.lo === 1 : false;
  return (
    <div className="ctl" style={PANEL}>
      <Btn id="opt-honest" onClick={() => s.propose(false)}>
        {labels.proposeHonest}
      </Btn>
      <Btn id="opt-bad" onClick={() => s.propose(true)}>
        {labels.proposeBad}
      </Btn>
      <Btn id="opt-challenge" primary disabled={!(open || status === 'disputed')} onClick={s.challenge}>
        {open ? labels.challenge : status === 'disputed' && narrowed ? labels.runStep : status === 'disputed' ? labels.bisect : labels.challenge}
      </Btn>
      <Btn id="opt-day" disabled={!(open || status === 'defended')} onClick={s.waitDay}>
        {labels.plusDay}
      </Btn>
      <div className="ctl-stats" style={STATS}>
        <Stat name={labels.window}>
          {labels.dayWord} {day} / {CHALLENGE_DAYS}
        </Stat>
        <Stat name={labels.rootStatus} tone={status === 'rejected' || badFinal ? 'bad' : status === 'finalized' || status === 'defended' ? 'good' : undefined}>
          {labels[`opt_${badFinal ? 'badFinal' : status}`]}
        </Stat>
        <Stat name={labels.disputed}>{dispute ? (narrowed ? `${labels.stepWord} ${dispute.hi}` : `${dispute.lo + 1}–${dispute.hi}`) : '–'}</Stat>
        <Stat name={labels.bisections}>{dispute ? dispute.rounds : 0} / 4</Stat>
      </div>
    </div>
  );
}

function ZkControls({ labels, lang }: SceneProps) {
  const s = useL2();
  const n = batchSizeAt(s.batchIndex);
  const options: [Corruption, string][] = [
    ['none', labels.zkHonest],
    ['root', labels.zkBadRoot],
    ['data', labels.zkBadData],
  ];
  return (
    <div className="ctl" style={PANEL}>
      <Seg value={s.corruption} options={options} onPick={s.setCorruption} label={labels.zkWhat} />
      <Btn id="zk-run" primary onClick={s.proveAndVerify}>
        {labels.proveVerify}
      </Btn>
      <div className="ctl-stats" style={STATS}>
        <Stat name={labels.proofStat} tone={s.zk ? (s.zk.proved ? 'good' : 'bad') : undefined}>
          {s.zk ? (s.zk.proved ? labels.proofMade : labels.noProof) : '–'}
        </Stat>
        <Stat name={labels.l1Says} tone={s.zk ? (s.zk.accepted ? 'good' : 'bad') : undefined}>
          {s.zk ? (s.zk.accepted ? labels.rootAccepted : labels.rootRejected) : '–'}
        </Stat>
        <Stat name={labels.verifyGas.replace('{n}', fmt(n, lang))}>
          {fmt(ZK_VERIFY_GAS / n, lang)} gas
        </Stat>
      </div>
    </div>
  );
}

function BlobControls({ labels, lang }: SceneProps) {
  const s = useL2();
  const n = batchSizeAt(s.batchIndex);
  const blob = blobGweiAt(s.blobExp);
  const eff = effectiveBlobGwei(blob, s.gasGwei);
  const c = batchCost(n, s.gasGwei, blob, s.mode);
  const pruned = s.mode === 'blob' && s.daysOld > BLOB_RETENTION_DAYS;
  const modes: [DataMode, string][] = [
    ['blob', labels.modeBlob],
    ['calldata', labels.modeCalldata],
  ];
  return (
    <div className="ctl" style={PANEL}>
      <Seg value={s.mode} options={modes} onPick={s.setMode} label={labels.postAs} />
      <div className="ctl-stats" style={{ gap: '2px 12px' }}>
        <Stat name={labels.dataStatus} tone={pruned ? 'bad' : 'good'}>
          {pruned ? labels.stPruned : s.mode === 'calldata' ? labels.stForever : labels.stAvailable}
        </Stat>
      </div>
      <div style={ROW}>
        <Range id="l2-batch6" label={`${labels.batchShort}: ${fmt(n, lang)}`} value={s.batchIndex} min={0} max={BATCH_SIZES.length - 1} onChange={s.setBatchIndex} />
        <Range id="l2-blobprice" label={`${labels.blobShort}: ${gwei(blob, lang)}`} value={s.blobExp} min={BLOB_EXP_MIN} max={BLOB_EXP_MAX} step={0.5} onChange={s.setBlobExp} />
        <Range id="l2-days" label={`${labels.daysLater}: ${s.daysOld}`} value={s.daysOld} min={0} max={MAX_DAYS_OLD} onChange={s.setDaysOld} />
      </div>
      <div className="ctl-stats" style={STATS}>
        <Stat name={labels.feePerUser}>{usd(c.perTxUsd, lang)}</Stat>
        <Stat name={labels.blobsUsed}>{s.mode === 'blob' ? `${c.blobs} · ${pctFill(c.blobFillPct, lang)}` : '0'}</Stat>
        <Stat name={labels.blobPaid}>{s.mode === 'blob' ? gwei(eff, lang) : '–'}</Stat>
      </div>
    </div>
  );
}

function BridgeControls({ labels }: SceneProps) {
  const s = useL2();
  const w = withdrawal(s.elapsed ?? 0);
  const started = s.elapsed !== null;
  return (
    <div className="ctl" style={PANEL}>
      <Btn id="wd-start" primary onClick={s.startWithdrawal}>
        {started ? labels.restart : labels.startWithdraw}
      </Btn>
      <Btn id="wd-hour" disabled={!started} onClick={() => s.advance(1)}>
        {labels.plusHour}
      </Btn>
      <Btn id="wd-day" disabled={!started} onClick={() => s.advance(24)}>
        {labels.plusDay}
      </Btn>
      <div className="ctl-stats" style={STATS}>
        <Stat name={labels.elapsed}>{started ? span(s.elapsed ?? 0, labels) : '–'}</Stat>
        <Stat name={`${labels.zkRollup} (≈ ${ZK_DELAY_H} ${labels.hourShort})`} tone={started && w.zkDone ? 'good' : undefined}>
          {!started ? '–' : w.zkDone ? labels.arrived : `${labels.left} ${span(w.zkLeftH, labels)}`}
        </Stat>
        <Stat name={`${labels.optRollup} (≈ ${OPT_DELAY_H / 24} ${labels.dayShort})`} tone={started && w.optDone ? 'good' : undefined}>
          {!started ? '–' : w.optDone ? labels.arrived : `${labels.left} ${span(w.optLeftH, labels)}`}
        </Stat>
      </div>
    </div>
  );
}

export function Controls(props: SceneProps) {
  switch (props.stepId) {
    case 'scarce':
      return <ScarceControls {...props} />;
    case 'rollup':
      return <RollupControls {...props} />;
    case 'sequencer':
      return <SequencerControls {...props} />;
    case 'optimistic':
      return <OptimisticControls {...props} />;
    case 'zk':
      return <ZkControls {...props} />;
    case 'blobs':
      return <BlobControls {...props} />;
    case 'bridge':
      return <BridgeControls {...props} />;
    default:
      return null;
  }
}
