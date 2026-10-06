// Pure logic for the Proof of Stake lesson. Constants and formulas follow the Ethereum
// consensus specs (Altair/Bellatrix/Electra); every simplification is stated where it is made.

export const MIN_STAKE = 32;
export const MAX_STAKE = 2048;
export const SLOTS_PER_EPOCH = 32;

const GWEI = 1_000_000_000n;
const toGwei = (eth: number) => BigInt(Math.round((Number.isFinite(eth) ? Math.max(eth, 0) : 0) * 1e6)) * 1000n;
const toEth = (gwei: bigint) => Number(gwei) / 1e9;

/** The learner's stake, kept inside what one validator may hold (32 … 2,048 ETH, whole ETH). */
export function clampStake(v: number): number {
  if (!Number.isFinite(v)) return MIN_STAKE;
  return Math.min(MAX_STAKE, Math.max(MIN_STAKE, Math.round(v)));
}

const clean = (b: number) => (Number.isFinite(b) && b > 0 ? b : 0);

/** Each balance as a fraction of the total; all zeros when there is no stake. */
export function shares(balances: number[]): number[] {
  const total = balances.reduce((a, b) => a + clean(b), 0);
  return balances.map((b) => (total > 0 ? clean(b) / total : 0));
}

/** Small seeded generator (mulberry32). The real chain derives its randomness from RANDAO and SHA-256. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MAX_RANDOM_VALUE = 65535;

/**
 * Chooses the proposer of one slot the way `compute_proposer_index` does: take a candidate
 * at random, then accept it only if
 * `effective_balance × MAX_RANDOM_VALUE ≥ MAX_EFFECTIVE_BALANCE × random_value`,
 * otherwise try the next candidate. The chance of being chosen is therefore proportional to
 * effective balance. Simplified: candidates come from a seeded generator, not the swap-or-not shuffle.
 * Returns -1 when nobody has any stake.
 */
export function pickProposer(balances: number[], seed: number, slot: number): { index: number; tries: number } {
  const eff = balances.map((b) => Math.min(clean(b), MAX_STAKE));
  if (!eff.some((b) => b > 0)) return { index: -1, tries: 0 };
  const rng = mulberry32(Math.imul((seed | 0) ^ 0x9e3779b9, 2654435761) + Math.imul(slot | 0, 40503) + 1);
  for (let tries = 1; tries <= 100_000; tries++) {
    const candidate = Math.min(eff.length - 1, Math.floor(rng() * eff.length));
    const randomValue = Math.floor(rng() * (MAX_RANDOM_VALUE + 1));
    if (eff[candidate] * MAX_RANDOM_VALUE >= MAX_STAKE * randomValue) return { index: candidate, tries };
  }
  return { index: eff.indexOf(Math.max(...eff)), tries: 100_000 };
}

/** Proposers for `count` consecutive slots starting at `fromSlot`. */
export function runSlots(balances: number[], seed: number, fromSlot: number, count: number): number[] {
  const n = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
  return Array.from({ length: n }, (_, i) => pickProposer(balances, seed, fromSlot + i).index);
}

export interface Participation {
  online: number;
  total: number;
  /** Online stake / total stake, 0 … 1. */
  fraction: number;
  /** Stake needed for a two-thirds supermajority. */
  needed: number;
  /** True when online stake × 3 ≥ total stake × 2. */
  justified: boolean;
}

/** Stake that votes versus the two-thirds threshold Casper FFG needs to justify a checkpoint. */
export function participation(balances: number[], online: boolean[]): Participation {
  let on = 0;
  let total = 0;
  balances.forEach((b, i) => {
    total += clean(b);
    if (online[i]) on += clean(b);
  });
  return { online: on, total, fraction: total > 0 ? on / total : 0, needed: (total * 2) / 3, justified: total > 0 && on * 3 >= total * 2 };
}

/* ---------- Finality and the inactivity leak ---------- */

export const MIN_EPOCHS_TO_INACTIVITY_PENALTY = 4;
export const INACTIVITY_SCORE_BIAS = 4n;
export const INACTIVITY_SCORE_RECOVERY_RATE = 16n;
export const INACTIVITY_PENALTY_QUOTIENT = 1n << 24n; // INACTIVITY_PENALTY_QUOTIENT_BELLATRIX
const DOWNWARD_THRESHOLD = GWEI / 4n; // hysteresis: effective balance drops once balance is 0.25 ETH below it

export interface ChainState {
  /** The epoch being voted on now. */
  epoch: number;
  finalizedEpoch: number;
  /** Justified epochs newer than the finalized one, oldest first. */
  justified: number[];
  /** Actual balances in Gwei. */
  balances: bigint[];
  /** Effective balances in Gwei: the voting weight. */
  effective: bigint[];
  inactivityScores: bigint[];
}

/** A healthy chain: epoch 12 is being voted on, 11 is justified, 10 is finalized. */
export function initialChain(stakesEth: number[], epoch = 12): ChainState {
  const balances = stakesEth.map(toGwei);
  return { epoch, finalizedEpoch: epoch - 2, justified: [epoch - 1], balances, effective: [...balances], inactivityScores: balances.map(() => 0n) };
}

export const effectiveEth = (s: ChainState): number[] => s.effective.map(toEth);
export const balancesEth = (s: ChainState): number[] => s.balances.map(toEth);
/** Epochs since the last finalized one, counted from the epoch being voted on. */
export const finalityDelay = (s: ChainState): number => s.epoch - 1 - s.finalizedEpoch;
export const isLeaking = (s: ChainState): boolean => finalityDelay(s) > MIN_EPOCHS_TO_INACTIVITY_PENALTY;

export type EpochStatus = 'finalized' | 'justified' | 'missed' | 'voting';
export function epochStatus(s: ChainState, epoch: number): EpochStatus {
  if (epoch >= s.epoch) return 'voting';
  if (epoch <= s.finalizedEpoch) return 'finalized';
  return s.justified.includes(epoch) ? 'justified' : 'missed';
}

/**
 * Closes the current epoch and opens the next.
 * - The epoch's checkpoint is justified if online effective balance × 3 ≥ total × 2.
 * - A justified checkpoint whose direct child is justified becomes finalized.
 * - Inactivity scores and penalties follow `process_inactivity_updates` and
 *   `get_inactivity_penalty_deltas`: an offline validator's score rises by 4 per epoch, and it pays
 *   `effective_balance × score / (4 × 2^24)`; outside a leak scores fall by 16 per epoch.
 * Simplified: ordinary attestation rewards and penalties, ejection at 16 ETH and the
 * two-epoch finalization variants are left out, and validators that are online always vote correctly.
 */
export function advanceEpoch(s: ChainState, online: boolean[]): ChainState {
  const total = s.effective.reduce((a, b) => a + b, 0n);
  const voting = s.effective.reduce((a, b, i) => (online[i] ? a + b : a), 0n);
  const justifiedNow = total > 0n && voting * 3n >= total * 2n;

  let finalizedEpoch = s.finalizedEpoch;
  let justified = s.justified;
  if (justifiedNow) {
    if (justified.includes(s.epoch - 1)) finalizedEpoch = s.epoch - 1;
    justified = [...justified, s.epoch].filter((e) => e > finalizedEpoch);
  }
  const leaking = s.epoch - finalizedEpoch > MIN_EPOCHS_TO_INACTIVITY_PENALTY;

  const inactivityScores = s.inactivityScores.map((score, i) => {
    let next = online[i] ? (score > 0n ? score - 1n : 0n) : score + INACTIVITY_SCORE_BIAS;
    if (!leaking) next = next > INACTIVITY_SCORE_RECOVERY_RATE ? next - INACTIVITY_SCORE_RECOVERY_RATE : 0n;
    return next;
  });
  const balances = s.balances.map((bal, i) => {
    if (online[i]) return bal;
    const penalty = (s.effective[i] * inactivityScores[i]) / (INACTIVITY_SCORE_BIAS * INACTIVITY_PENALTY_QUOTIENT);
    return penalty >= bal ? 0n : bal - penalty;
  });
  const effective = s.effective.map((eff, i) => (balances[i] + DOWNWARD_THRESHOLD < eff ? balances[i] - (balances[i] % GWEI) : eff));

  return { epoch: s.epoch + 1, finalizedEpoch, justified, balances, effective, inactivityScores };
}

export function advanceEpochs(s: ChainState, online: boolean[], count: number): ChainState {
  const n = Math.max(0, Math.min(100_000, Math.floor(Number.isFinite(count) ? count : 0)));
  let cur = s;
  for (let i = 0; i < n; i++) cur = advanceEpoch(cur, online);
  return cur;
}

/* ---------- Slashing ---------- */

export const MIN_SLASHING_PENALTY_QUOTIENT = 4096n; // MIN_SLASHING_PENALTY_QUOTIENT_ELECTRA
export const PROPORTIONAL_SLASHING_MULTIPLIER = 3n; // PROPORTIONAL_SLASHING_MULTIPLIER_BELLATRIX

export interface SlashOutcome {
  /** Taken at once: effective_balance / 4096. */
  initial: number;
  /** Taken halfway through the withdrawal delay; grows with everything slashed in the window. */
  correlation: number;
  /** What is left of the balance, never below zero. */
  remaining: number;
  /** Total lost as a fraction of the starting balance, 0 … 1. */
  lostFraction: number;
  /** Slashed stake as a fraction of all stake, 0 … 1. */
  slashedShare: number;
}

/**
 * What one slashed validator loses, in ETH, following `slash_validator` and `process_slashings`:
 *   initial     = effective_balance // 4096
 *   correlation = (min(3 × S, T) // (T // 1 ETH)) × (effective_balance // 1 ETH)
 * with S the stake slashed in the window and T the total active stake.
 * Simplified: T is the total before the slashings, and the balance equals the effective balance.
 */
export function slashOutcome(effectiveEthValue: number, slashedTotalEth: number, totalEth: number): SlashOutcome {
  const eff = toGwei(effectiveEthValue);
  const total = toGwei(totalEth);
  const slashed = toGwei(Math.min(Math.max(slashedTotalEth, 0), Math.max(totalEth, 0)));
  if (eff === 0n || total < GWEI) return { initial: 0, correlation: 0, remaining: toEth(eff), lostFraction: 0, slashedShare: 0 };
  const initial = eff / MIN_SLASHING_PENALTY_QUOTIENT;
  const adjusted = slashed * PROPORTIONAL_SLASHING_MULTIPLIER < total ? slashed * PROPORTIONAL_SLASHING_MULTIPLIER : total;
  const perIncrement = adjusted / (total / GWEI);
  const correlationRaw = perIncrement * (eff / GWEI);
  const afterInitial = eff - initial;
  const correlation = correlationRaw > afterInitial ? afterInitial : correlationRaw;
  const remaining = afterInitial - correlation;
  return {
    initial: toEth(initial),
    correlation: toEth(correlation),
    remaining: toEth(remaining),
    lostFraction: Number(eff - remaining) / Number(eff),
    slashedShare: Number(slashed) / Number(total),
  };
}

/* ---------- Attacking Proof of Work versus Proof of Stake ---------- */

export interface AttackView {
  /** Attacker's share of the resource, whole percent 0 … 100. */
  share: number;
  /** PoW: more than half of the hashrate. PoS: at least two thirds of the stake. */
  canRewrite: boolean;
  /** PoS only: at least one third of the stake can stop finality. */
  canStall: boolean;
  /** Percent of the attacker's own resource destroyed if it attacks by signing conflicting votes. */
  lostPercent: number;
  /** Percent of the attacker's resource still usable for another attack. */
  keptPercent: number;
}

const clampShare = (p: number) => (Number.isFinite(p) ? Math.min(100, Math.max(0, Math.round(p))) : 0);

/** A miner with more than half the hashrate can out-build the honest chain, and keeps every machine afterwards. */
export function powAttack(sharePercent: number): AttackView {
  const share = clampShare(sharePercent);
  return { share, canRewrite: share > 50, canStall: false, lostPercent: 0, keptPercent: 100 };
}

/**
 * Stake thresholds of Gasper: 1/3 stalls finality, 2/3 finalizes anything. Equivocating stake is
 * slashed by the correlation penalty, min(3 × share, 100%) of the attacker's stake.
 */
export function posAttack(sharePercent: number): AttackView {
  const share = clampShare(sharePercent);
  const lostPercent = Math.min(100, 3 * share);
  return { share, canRewrite: 3 * share >= 200, canStall: 3 * share >= 100, lostPercent, keptPercent: 100 - lostPercent };
}
