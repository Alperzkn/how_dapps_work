import { useEffect, useRef, type ReactNode } from 'react';
import type { Group } from 'three';
import { Anim, Ball, Block, Box, ChainLink, Cyl, FlowLine, Label, Mat, MinerRig, Mover, Person, Platform, ShadowGround, ValidatorPillar, useLoop, type Vec3 } from '../../scene/kit';
import type { ColorKey } from '../../theme/tokens';
import type { SceneProps } from '../../scene/types';
import type { Lang } from '../../types';
import { balancesEth, effectiveEth, epochStatus, finalityDelay, isLeaking, MAX_STAKE, MIN_STAKE, participation, posAttack, powAttack, shares, slashOutcome, SLOTS_PER_EPOCH, type EpochStatus } from './logic';
import { ACCOMPLICES, COUNT, SKIP_EPOCHS, stakesWith, usePos, YOU } from './state';

const VZ = -2.5;
const V: Vec3[] = Array.from({ length: COUNT }, (_, i) => [-6 + 2 * i, 0, VZ]);

const BS = 1.1;
const CZ = 2.5;
const CX = [-5, -3, -1, 1, 3, 5];
const NEW = 2;

/** One coin on a pillar stands for 128 ETH; any stake at all shows at least one coin. */
const coins = (eth: number) => (eth > 0 ? Math.max(1, Math.round(eth / 128)) : 0);
/** Height of the top of a pillar's coin stack. */
const stackTop = (n: number) => 1.2 + n * 0.14;

const locale = (lang: Lang) => (lang === 'tr' ? 'tr-TR' : 'en-US');
function num(n: number, digits: number, lang: Lang): string {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString(locale(lang), { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
/** A fraction as a percentage, e.g. 0.667 -> 66.7%. */
function pct(fraction: number, digits: number, lang: Lang): string {
  return `${num((Number.isFinite(fraction) ? fraction : 0) * 100, digits, lang)}%`;
}
/** ETH with only as many decimals as the amount needs. */
function eth(n: number, lang: Lang): string {
  const v = Number.isFinite(n) ? n : 0;
  const digits = Number.isInteger(v) ? 0 : Math.abs(v) < 1 ? 4 : 2;
  return `${num(v, digits, lang)} ETH`;
}

/** Stake lost to the leak: small amounts keep their decimals, and zero is plain zero. */
function lost(n: number, lang: Lang): string {
  const v = Number.isFinite(n) && n > 0 ? n : 0;
  return v === 0 ? '0 ETH' : `−${num(v, v < 1 ? 4 : 1, lang)} ETH`;
}

/** A cone of light from above with a lamp at its tip. */
function Spotlight() {
  return (
    <group>
      <mesh position={[0, 3.1, 0]}>
        <coneGeometry args={[0.95, 4, 28, 1, true]} />
        <Mat color="actor" opacity={0.26} glow />
      </mesh>
      <Ball radius={0.2} position={[0, 5.1, 0]} color="actor" glow />
      <Cyl radius={0.95} height={0.04} position={[0, 0.03, 0]} color="actor" opacity={0.4} />
    </group>
  );
}

/** A small flag on a pole: marks a checkpoint. */
function Flag({ color }: { color: ColorKey }) {
  return (
    <group>
      <Cyl radius={0.04} height={1} position={[0, 0.5, 0]} color="chain" segments={8} />
      <Box size={[0.5, 0.32, 0.06]} position={[0.27, 0.82, 0]} color={color} glow={color !== 'neutral'} radius={0.02} />
    </group>
  );
}

function Padlock() {
  return (
    <group>
      <Box size={[0.42, 0.34, 0.2]} position={[0, 0.17, 0]} color="valid" glow radius={0.05} />
      <mesh position={[0, 0.36, 0]}>
        <torusGeometry args={[0.13, 0.04, 8, 16, Math.PI]} />
        <Mat color="chain" />
      </mesh>
    </group>
  );
}

/** A vote: a small green token. */
function Tick() {
  return <Ball radius={0.13} color="valid" glow />;
}

const METER_H = 2.4;

/** A column filled to `fraction`, with marks at the given heights (fractions of the column). */
function Meter({ fraction, marks, color }: { fraction: number; marks: number[]; color: ColorKey }) {
  const f = Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0));
  return (
    <group>
      <Box size={[0.9, 0.14, 0.9]} position={[0, 0.07, 0]} color="platform" radius={0.04} />
      <Box size={[0.4, METER_H, 0.4]} position={[0, 0.14 + METER_H / 2, 0]} color="neutral" radius={0.06} />
      <Anim position={[0, 0.14, 0]} scale={[1, Math.max(0.01, f), 1]} speed={5}>
        <Box size={[0.5, METER_H, 0.5]} position={[0, METER_H / 2, 0]} color={color} glow radius={0.04} />
      </Anim>
      {marks.map((m) => (
        <Box key={m} size={[0.64, 0.05, 0.64]} position={[0, 0.14 + METER_H * m, 0]} color="ink" radius={0.02} />
      ))}
    </group>
  );
}

/** Mechanical counter with spinning drums: the nonce search, for the comparison step. */
function Counter({ spin }: { spin: boolean }) {
  const drums = useRef<(Group | null)[]>([]);
  useLoop((_, dt) => {
    drums.current.forEach((d, i) => {
      if (d) d.rotation.x += dt * (4 + i * 3.1);
    });
  }, spin);
  return (
    <group>
      <Box size={[1.14, 0.46, 0.34]} color="ink" radius={0.06} />
      {[-0.39, -0.13, 0.13, 0.39].map((x, i) => (
        <group
          key={x}
          position={[x, 0, 0.08]}
          ref={(g) => {
            drums.current[i] = g;
          }}
        >
          <Cyl radius={0.17} height={0.21} rotation={[0, 0, Math.PI / 2]} segments={6} color="platform" />
          <Box size={[0.22, 0.05, 0.1]} position={[0, 0.15, 0]} color="actor" radius={0.01} />
        </group>
      ))}
    </group>
  );
}

const arc = (from: Vec3, to: Vec3, lift: number): Vec3[] => [from, [(from[0] + to[0]) / 2, Math.max(from[1], to[1]) + lift, (from[2] + to[2]) / 2], to];

const two = (text: string) => {
  const [a, b] = text.split(' · ');
  return (
    <>
      {a}
      {b && <br />}
      {b}
    </>
  );
};

const STATUS_COLOR: Record<EpochStatus, ColorKey> = { finalized: 'valid', justified: 'block', missed: 'invalid', voting: 'neutral' };
const STATUS_TONE = { finalized: 'valid', justified: 'block', missed: 'invalid', voting: 'plain' } as const;

export default function Scene({ stepId, labels, lang, level }: SceneProps) {
  const isStake = stepId === 'stake';
  const isProposer = stepId === 'proposer';
  const isAttest = stepId === 'attest';
  const isFinal = stepId === 'finality';
  const isSlash = stepId === 'slashing';
  const isCompare = stepId === 'compare';
  const chainShown = isProposer || isAttest || isFinal || isSlash;
  const lv = level !== 'beginner';

  const stake = usePos((s) => s.stake);
  const last = usePos((s) => s.last);
  const slots = usePos((s) => s.slots);
  const tally = usePos((s) => s.tally);
  const offline = usePos((s) => s.offline);
  const chain = usePos((s) => s.chain);
  const slashedOn = usePos((s) => s.slashed);
  const slashedCount = usePos((s) => s.slashedCount);
  const attackShare = usePos((s) => s.attackShare);
  const attackSide = usePos((s) => s.attackSide);

  const stakes = stakesWith(stake);
  const total = stakes.reduce((a, b) => a + b, 0);
  const online = offline.map((o) => !o);

  // Steps 3 and 4: who votes, and whether that reaches two thirds.
  const effective = effectiveEth(chain);
  const balances = balancesEth(chain);
  const part = participation(effective, online);
  const delay = finalityDelay(chain);
  const leaked = stakes.reduce((a, b) => a + b, 0) - balances.reduce((a, b) => a + b, 0);
  const votesShown = isAttest || isFinal;
  const proposer = last >= 0 ? last : YOU;

  // Step 5: who is slashed, and what is left of their stake.
  const slashedSet = isSlash && slashedOn ? [YOU, ...ACCOMPLICES.slice(0, slashedCount - 1)] : [];
  const slashedTotal = slashedSet.reduce((a, i) => a + stakes[i], 0);
  const outcome = slashOutcome(stake, slashedTotal, total);
  const baseCoins = Math.max(5, coins(stake));
  const youCoins = slashedOn ? Math.max(outcome.remaining > 0 ? 1 : 0, Math.floor(baseCoins * (1 - outcome.lostFraction))) : baseCoins;

  const shownStake = (i: number): number => {
    if (isFinal || isAttest) return balances[i];
    if (isSlash && slashedSet.includes(i)) return slashOutcome(stakes[i], slashedTotal, total).remaining;
    return stakes[i];
  };
  const coinCount = (i: number) => (isSlash && i === YOU ? youCoins : coins(shownStake(i)));

  const blockShown = (b: number) => (isFinal ? true : b < NEW ? chainShown : b === NEW ? isProposer || isAttest || isSlash : false);
  const newAt: Vec3 = isProposer ? [V[proposer][0], 0, -0.4] : [CX[NEW], 0, CZ];
  const blockTop: Vec3 = [CX[NEW], BS + 0.25, CZ];
  const slashedAt: Vec3 = [V[YOU][0], 0, -0.3];
  const FORK_A: Vec3 = [1.5, 0, 0.9];
  const FORK_B: Vec3 = [1.5, 0, 4.1];
  const PIT: Vec3 = [6.6, 0, 0.8];
  const epochs = [chain.epoch - 2, chain.epoch - 1, chain.epoch];
  const status = epochs.map((e) => epochStatus(chain, e));

  const pow = powAttack(attackShare);
  const pos = posAttack(attackShare);
  const attackCoins = Math.max(1, Math.round(pos.share / 8));
  const keptCoins = Math.round((attackCoins * pos.keptPercent) / 100);

  return (
    <>
      <ShadowGround />

      {/* The validators: pillars holding their stake. */}
      <Anim show={!isCompare}>
        <Platform size={[14.4, 2.2]} position={[0, 0, VZ]} color="ground" height={0.25} />
      </Anim>
      {V.map((p, i) => {
        const you = i === YOU;
        const red = slashedSet.includes(i);
        const off = votesShown && offline[i];
        const n = coinCount(i);
        const lit = (isStake && you) || (isProposer && i === proposer) || red;
        return (
          <Anim key={i} position={red && you ? slashedAt : p} show={!isCompare} speed={4}>
            <ValidatorPillar stake={n} color={red ? 'invalid' : off ? 'neutral' : 'actor'} coin={off ? 'neutral' : 'tx'} glow={lit} />
            {/* Step 1: every validator's deposit. */}
            <Label position={you ? [0.9, stackTop(n) + 1, -0.9] : [0, stackTop(n) + 0.45, 0]} show={isStake && (you || lv)} tone={you ? 'actor' : 'plain'}>
              {you ? `${labels.you} · ${eth(stake, lang)}` : num(stakes[i], 0, lang)}
            </Label>
            {/* Step 2: how often each one has been chosen. */}
            <Label position={you ? [0.9, stackTop(n) + 1, -0.9] : [0, stackTop(n) + 0.45, 0]} show={isProposer} tone={you ? 'actor' : i === proposer ? 'block' : 'plain'}>
              {you ? `${labels.you} · ${tally[i]}` : `${tally[i]}`}
            </Label>
            {/* Steps 3 and 4: the learner's own validator, and what the leak has taken. */}
            <Label position={[0, stackTop(n) + 0.45, 0]} show={votesShown && (you || (off && lv && isFinal && stakes[i] - balances[i] >= 0.01))} tone={off ? 'invalid' : 'actor'}>
              {you && labels.you}
              {off && lv && isFinal && stakes[i] - balances[i] >= 0.01 && `${you ? ' · ' : ''}−${num(stakes[i] - balances[i], 1, lang)}`}
            </Label>
            <Label position={[0, stackTop(n) + 0.45, 0]} show={isSlash && you && !slashedOn} tone="actor">
              {labels.you}
            </Label>
            <Label position={[0, stackTop(n) + 0.6, 0]} show={isSlash && you && slashedOn} tone="invalid">
              {lv ? (
                <>
                  {labels.slashedEjected}
                  <br />
                  {num(stake, 0, lang)} → {eth(outcome.remaining, lang)}
                </>
              ) : (
                labels.slashed
              )}
            </Label>
          </Anim>
        );
      })}

      {/* Step 1: the learner locks up coins; the mining machine is not needed. */}
      <Anim show={isStake}>
        <group position={[V[YOU][0], 0, 0.2]} rotation={[0, Math.PI, 0]}>
          <Person glow />
        </group>
        {isStake && (
          <Mover path={arc([V[YOU][0], 1.3, 0.2], [V[YOU][0], stackTop(coins(stake)), VZ], 1)} duration={1.5}>
            <Cyl radius={0.26} height={0.1} color="tx" glow />
          </Mover>
        )}
        <Label position={[V[YOU][0], 0.1, 1.4]} maxLevel="beginner" tone="tx">
          {labels.deposit}
        </Label>
        <Label position={[V[YOU][0], 0.1, 1.4]} minLevel="intermediate" tone="tx">
          {labels.yourShare} {pct(stake / total, 1, lang)}
        </Label>
        <Label position={[V[0][0], stackTop(coins(stakes[0])) + 0.5, VZ]} maxLevel="beginner" tone="plain">
          {labels.validator}
        </Label>
        <Label position={[4.9, 0, 1.3]} minLevel="expert" tone="mono">
          effective_balance:
          <br />
          {MIN_STAKE} … {MAX_STAKE} ETH
        </Label>
        <group position={[-4.6, 0, 1.6]}>
          <Platform size={[2.4, 1.9]} position={[0, 0, 0]} color="ground" height={0.2} />
          <MinerRig color="neutral" active={false} />
          <group position={[0, 0.5, 0.75]}>
            <Box size={[1.5, 0.14, 0.1]} rotation={[0, 0, Math.PI / 4]} color="invalid" radius={0.03} />
            <Box size={[1.5, 0.14, 0.1]} rotation={[0, 0, -Math.PI / 4]} color="invalid" radius={0.03} />
          </group>
          <Label position={[0, 1.7, 0]} tone="plain">
            {labels.noMining}
          </Label>
        </group>
      </Anim>

      {/* Step 2: the spotlight lands on the proposer of the latest slot. */}
      <Anim show={isProposer} position={[V[proposer][0], 0, VZ]} speed={10}>
        <Spotlight />
        <Label position={[1.9, 4.3, 0]} maxLevel="beginner" tone="actor">
          {proposer === YOU ? labels.chosen : labels.picked}
        </Label>
        <Label position={[1.9, 4.3, 0]} minLevel="intermediate" tone="actor">
          slot {num(slots, 0, lang)} · {labels.proposer}
        </Label>
      </Anim>
      <Label position={[4.6, 0, 1.6]} show={isProposer} minLevel="expert" tone="mono">
        RANDAO mix → proposer
        <br />P ∝ effective_balance
      </Label>

      {/* The chain. */}
      <Anim show={chainShown}>
        <Platform size={[isFinal ? 12.4 : 8.6, 2]} position={[isFinal ? 0 : -1.9, 0, CZ]} color="ground" height={0.25} />
      </Anim>
      {CX.map((x, b) => {
        const e = Math.floor(b / 2);
        return (
          <group key={b}>
            <Anim position={b === NEW ? newAt : [x, 0, CZ]} show={blockShown(b)} speed={b === NEW ? 3.5 : 5 + b}>
              <Block size={BS} color="block" glow={b === NEW && (isProposer || (isAttest && part.justified))} />
              <Label position={[0, BS + 0.75, 0]} show={b === NEW && isProposer} tone="block">
                {labels.newBlock}
              </Label>
              <Anim show={isFinal && b % 2 === 0} position={[0, BS, 0]}>
                <Flag color={STATUS_COLOR[status[e]]} />
              </Anim>
              <Anim show={isFinal && b % 2 === 1 && status[e] === 'finalized'} position={[0, BS, 0]}>
                <Padlock />
              </Anim>
            </Anim>
            {b > 0 && (
              <Anim show={blockShown(b) && blockShown(b - 1) && !(b === NEW && isProposer)}>
                <ChainLink from={[CX[b - 1] + BS / 2, BS / 2, CZ]} to={[x - BS / 2, BS / 2, CZ]} />
              </Anim>
            )}
          </group>
        );
      })}

      {/* Step 3: every validator that is online votes for the block. */}
      {isAttest &&
        V.map((p, i) =>
          offline[i] ? null : (
            <Mover key={i} path={arc([p[0], stackTop(coinCount(i)), VZ], blockTop, 1.1)} duration={1.5} delay={i * 0.24}>
              <Tick />
            </Mover>
          ),
        )}
      <Label position={[CX[NEW], BS + 1.2, CZ]} show={isAttest} maxLevel="beginner" tone="valid">
        {labels.votes}
      </Label>
      <Label position={[CX[NEW], BS + 1.2, CZ]} show={isAttest} minLevel="intermediate" tone="valid">
        {labels.attestations}
      </Label>
      <Label position={[5.8, 0, 0.4]} show={isAttest} minLevel="expert" tone="mono">
        head: beacon_block_root
        <br />
        FFG: source → target
      </Label>
      <Label position={[V[6][0], stackTop(coinCount(6)) + 0.5, VZ]} show={isAttest && !offline[6]} minLevel="intermediate" tone="actor">
        {labels.committee}
      </Label>

      {/* Steps 3 and 4: stake that votes, against the two-thirds mark. */}
      <Anim show={votesShown} position={isFinal ? [7, 0, CZ] : [3.2, 0, CZ + 0.4]} speed={5}>
        <Meter fraction={part.fraction} marks={[2 / 3]} color={part.justified ? 'valid' : 'invalid'} />
        <Label position={[0, 3.3, 0]} tone={part.justified ? 'valid' : 'invalid'}>
          {labels.online} {pct(part.fraction, 1, lang)}
          <br />
          {part.justified ? '≥' : '<'} {isFinal ? '2/3' : labels.twoThirds}
        </Label>
      </Anim>

      {/* Step 4: epochs, checkpoints and whether they were justified. */}
      <Anim show={isFinal}>
        {[0, 1, 2].map((e) => (
          <group key={e}>
            <Platform size={[3.7, 0.7]} position={[-4 + e * 4, 0.02, CZ + 1.7]} color={STATUS_COLOR[status[e]]} height={0.2} />
            <Label position={[-3 + e * 4, -0.2, CZ + 2.3]} tone={STATUS_TONE[status[e]]} maxLevel="beginner">
              {labels[status[e]]}
            </Label>
            <Label position={[-3 + e * 4, -0.2, CZ + 2.3]} tone={STATUS_TONE[status[e]]} minLevel="intermediate">
              {labels.epoch} {num(epochs[e], 0, lang)} · {labels[status[e]]}
            </Label>
          </group>
        ))}
        <Anim show={status[1] !== 'missed'}>
          <FlowLine points={arc([CX[0], BS + 1, CZ], [CX[2], BS + 1, CZ], 0.9)} color="valid" curved />
        </Anim>
        <FlowLine points={arc([CX[2], BS + 1, CZ], [CX[4], BS + 1, CZ], 0.9)} color={part.justified ? 'valid' : 'invalid'} curved dashed />
        <Label position={[CX[1], BS + 2.3, CZ]} show={delay > 1} tone="invalid">
          {labels.noFinality}: {num(delay - 1, 0, lang)} {labels.epochs}
          {lv && isLeaking(chain) && (
            <>
              <br />
              {labels.leak}: {lost(leaked, lang)}
            </>
          )}
        </Label>
        <Label position={[3, 0, 7]} minLevel="expert" tone="mono">
          source → target · ≥ ⅔ {labels.ofStake}
        </Label>
      </Anim>
      {isFinal &&
        V.map((p, i) =>
          offline[i] ? null : (
            <Mover key={i} path={arc([p[0], stackTop(coinCount(i)), VZ], [CX[4], BS + 1, CZ], 1.2)} duration={1.7} delay={i * 0.25}>
              <Tick />
            </Mover>
          ),
        )}

      {/* Step 5: the learner signs two blocks for the same slot and is slashed. */}
      <Anim show={isSlash}>
        {[FORK_A, FORK_B].map((f, k) => {
          const shown = k === 0 || slashedOn;
          return (
            <Anim key={k} show={shown}>
              <group position={f}>
                <Block size={BS} color={slashedOn ? 'invalid' : 'block'} glow />
              </group>
              <ChainLink from={[CX[NEW] + BS / 2, BS / 2, CZ]} to={[f[0] - BS / 2, BS / 2, f[2]]} color={slashedOn ? 'invalid' : 'chain'} />
              <FlowLine points={[[slashedOn ? slashedAt[0] : V[YOU][0], 1.3, slashedOn ? slashedAt[2] : VZ], [f[0] + 0.5, BS + 0.25, f[2]]]} color={slashedOn ? 'invalid' : 'actor'} dashed />
            </Anim>
          );
        })}
        <Label position={[FORK_A[0] + 1.3, BS + 0.5, FORK_A[2]]} show={!slashedOn} tone="block">
          {labels.oneBlock}
        </Label>
        <Label position={[FORK_B[0], -0.3, FORK_B[2] + 1]} show={slashedOn} tone="invalid" maxLevel="beginner">
          {labels.twoBlocks}
        </Label>
        <Label position={[FORK_B[0], -0.3, FORK_B[2] + 1]} show={slashedOn} tone="invalid" minLevel="intermediate">
          {labels.sameSlot}
        </Label>
        <group position={PIT}>
          <Cyl radius={0.8} height={0.12} position={[0, 0.06, 0]} color="ink" />
          <Label position={[0, 0.9, 0]} tone="tx">
            {labels.burned}
            {lv && slashedOn && ` ${eth(outcome.initial + outcome.correlation, lang)}`}
          </Label>
        </group>
        <Label position={[5.2, 0, 3.6]} minLevel="expert" tone="mono">
          {slashedOn ? (
            <>
              penalty = eff × min(3·S, T) / T
              <br />S / T = {pct(outcome.slashedShare, 1, lang)}
            </>
          ) : (
            <>
              double vote: t₁ = t₂
              <br />
              surround: s₁ &lt; s₂ &lt; t₂ &lt; t₁
            </>
          )}
        </Label>
      </Anim>
      {isSlash &&
        slashedOn &&
        [0, 1].map((k) => (
          <Mover key={k} path={arc([slashedAt[0], stackTop(youCoins), slashedAt[2]], [PIT[0], 0.2, PIT[2]], 1.2)} duration={1.4} delay={k * 0.7}>
            <Cyl radius={0.26} height={0.1} color="tx" glow />
          </Mover>
        ))}

      {/* Step 6: the same attacker under both designs. */}
      <Side show={isCompare} position={[-2.3, 0, 2.3]} active={attackSide === 'pow'} title="Proof of Work">
        <group position={[-1.1, 0, -0.9]}>
          <Meter fraction={pow.share / 100} marks={[0.5]} color={pow.canRewrite ? 'invalid' : 'actor'} />
        </group>
        <group position={[0.5, 0, 0.9]}>
          <MinerRig active={isCompare} color={pow.canRewrite ? 'invalid' : 'actor'} glow={pow.canRewrite} />
        </group>
        <group position={[0.9, 0, -1]}>
          <Block size={0.9} color="block" />
          <group position={[0, 1.3, 0]}>
            <Counter spin={isCompare} />
          </group>
        </group>
        <Label position={[-1.1, 3.2, -0.9]} show={attackSide === 'pow'} tone={pow.canRewrite ? 'invalid' : 'actor'}>
          {num(pow.share, 0, lang)}% · {pow.canRewrite ? '>' : '≤'} 50% hashrate
        </Label>
        <Label position={[1.3, -0.6, 1.4]} show={attackSide === 'pow'} tone="tx" maxLevel="intermediate">
          {two(labels.powKeeps)}
        </Label>
        <Label position={[1.3, -0.6, 1.4]} show={attackSide === 'pow'} tone="mono" minLevel="expert">
          {two(labels.powExpert)}
        </Label>
      </Side>
      <Side show={isCompare} position={[2.3, 0, -2.3]} active={attackSide === 'pos'} title="Proof of Stake">
        <group position={[-1.1, 0, -0.9]}>
          <Meter fraction={pos.share / 100} marks={[1 / 3, 2 / 3]} color={pos.canStall ? 'invalid' : 'actor'} />
        </group>
        <group position={[0.2, 0, 0.9]}>
          <ValidatorPillar stake={keptCoins} color={pos.canStall ? 'invalid' : 'actor'} glow={pos.canStall} />
        </group>
        <group position={[1.4, 0, -0.6]}>
          <Cyl radius={0.55} height={0.12} position={[0, 0.06, 0]} color="ink" />
          <Anim position={[0, 0.12, 0]} scale={[1, Math.max(0.01, attackCoins - keptCoins), 1]} speed={5}>
            <Cyl radius={0.28} height={0.14} position={[0, 0.07, 0]} color="invalid" opacity={0.55} />
          </Anim>
        </group>
        <Label position={[-1.1, 3.2, -0.9]} show={attackSide === 'pos'} tone={pos.canStall ? 'invalid' : 'actor'}>
          {num(pos.share, 0, lang)}% · {pos.canRewrite ? '≥ 2/3 stake' : pos.canStall ? '≥ 1/3 stake' : '< 1/3 stake'}
        </Label>
        <Label position={[1.3, -0.6, 1.4]} show={attackSide === 'pos'} tone="tx" maxLevel="intermediate">
          {labels.burned} {num(pos.lostPercent, 0, lang)}%
        </Label>
        <Label position={[1.3, -0.6, 1.4]} show={attackSide === 'pos'} tone="mono" minLevel="expert">
          {two(labels.posExpert)}
        </Label>
      </Side>
    </>
  );
}

/** One of the two platforms on the comparison step; the one being examined stands forward. */
function Side({ show, position, active, title, children }: { show: boolean; position: Vec3; active: boolean; title: string; children: ReactNode }) {
  return (
    <Anim show={show} position={[position[0], active ? 0.35 : 0, position[2]]} scale={active ? 1 : 0.86}>
      <Platform size={[4, 4]} color="ground" height={0.25} />
      {children}
      <Label position={[-1.1, 4.7, -0.9]} tone={active ? 'default' : 'plain'}>
        {title}
      </Label>
    </Anim>
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

const row = { display: 'flex', alignItems: 'center', gap: '4px 8px', flexBasis: '100%', flexWrap: 'wrap' } as const;
const sliderRow = { display: 'flex', alignItems: 'center', gap: 10, flexBasis: '100%' } as const;

/** Slider for the learner's own stake, shared by the first two steps. */
function StakeSlider({ labels, lang }: { labels: Record<string, string>; lang: Lang }) {
  const stake = usePos((s) => s.stake);
  const setStake = usePos((s) => s.setStake);
  return (
    <label className="ctl-field" style={sliderRow}>
      <span style={{ whiteSpace: 'nowrap', minWidth: '10.5em' }}>
        {labels.yourStake}: {eth(stake, lang)}
      </span>
      <input id="pos-stake" type="range" min={MIN_STAKE} max={MAX_STAKE} step={32} value={stake} onChange={(e) => setStake(Number(e.target.value))} aria-valuetext={eth(stake, lang)} style={{ flex: 1, minWidth: 0 }} />
    </label>
  );
}

/** One toggle per validator, in the same order as the pillars. Pressed means offline. */
function OfflineToggles({ labels, lang }: { labels: Record<string, string>; lang: Lang }) {
  const offline = usePos((s) => s.offline);
  const toggle = usePos((s) => s.toggleOffline);
  const stake = usePos((s) => s.stake);
  const stakes = stakesWith(stake);
  return (
    <div style={row}>
      <span className="ctl-title" style={{ flexBasis: 'auto' }}>
        {labels.takeOffline}
      </span>
      <div className="seg" role="group" aria-label={labels.takeOffline} style={{ maxWidth: '100%' }}>
        {stakes.map((s, i) => (
          <button key={i} type="button" data-offline={i} aria-pressed={offline[i]} aria-label={`${i === YOU ? labels.you : `${labels.validator} ${i + 1}`}, ${eth(s, lang)}`} onClick={() => toggle(i)} style={{ padding: '0 5px', fontSize: '0.78rem', textDecoration: offline[i] ? 'line-through' : undefined }}>
            {i === YOU ? labels.you : num(s, 0, lang)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Controls({ stepId, labels, lang, level }: SceneProps) {
  const s = usePos();
  const lv = level !== 'beginner';
  // The slashing is undone when the learner leaves the step, so every other step shows the whole row.
  useEffect(() => {
    if (stepId !== 'slashing') usePos.getState().setSlashed(false);
  }, [stepId]);

  const stakes = stakesWith(s.stake);
  const total = stakes.reduce((a, b) => a + b, 0);

  if (stepId === 'stake') {
    const share = shares(stakes)[YOU];
    return (
      <div className="ctl" style={{ gap: '4px 14px', maxWidth: 560 }}>
        <StakeSlider labels={labels} lang={lang} />
        <div className="ctl-stats" style={{ gap: '2px 14px' }}>
          <Stat name={labels.totalStake}>{eth(total, lang)}</Stat>
          <Stat name={labels.yourShare}>{pct(share, 1, lang)}</Stat>
          <Stat name={labels.yourTurn}>{labels.everyN.replace('{n}', num(share > 0 ? 1 / share : 0, 1, lang))}</Stat>
        </div>
      </div>
    );
  }

  if (stepId === 'proposer') {
    const share = shares(stakes)[YOU];
    const mine = s.tally[YOU];
    return (
      <div className="ctl" style={{ gap: '4px 14px', maxWidth: 560 }}>
        <StakeSlider labels={labels} lang={lang} />
        <div style={row}>
          <button type="button" className="btn btn-primary" data-pos="slot" onClick={() => s.draw(1)}>
            {labels.nextSlot}
          </button>
          <button type="button" className="btn" data-pos="epoch" onClick={() => s.draw(SLOTS_PER_EPOCH)}>
            {labels.runEpoch}
          </button>
          <button type="button" className="btn" data-pos="reset-draw" onClick={s.resetDraw} disabled={s.slots <= 1}>
            {labels.reset}
          </button>
        </div>
        <div className="ctl-stats" style={{ gap: '2px 14px' }}>
          <Stat name={labels.slotsDrawn}>{num(s.slots, 0, lang)}</Stat>
          <Stat name={labels.yourBlocks}>
            {num(mine, 0, lang)} ({pct(s.slots > 0 ? mine / s.slots : 0, 1, lang)})
          </Stat>
          <Stat name={labels.expected}>{pct(share, 1, lang)}</Stat>
        </div>
      </div>
    );
  }

  if (stepId === 'attest' || stepId === 'finality') {
    const eff = effectiveEth(s.chain);
    const part = participation(
      eff,
      s.offline.map((o) => !o),
    );
    const delay = finalityDelay(s.chain);
    const leaked = total - balancesEth(s.chain).reduce((a, b) => a + b, 0);
    return (
      <div className="ctl" style={{ gap: '4px 14px', maxWidth: 600 }}>
        <OfflineToggles labels={labels} lang={lang} />
        {stepId === 'finality' && (
          <div style={row}>
            <button type="button" className="btn btn-primary" data-pos="next-epoch" onClick={() => s.advance(1)}>
              {labels.nextEpoch}
            </button>
            <button type="button" className="btn" data-pos="skip" onClick={() => s.advance(SKIP_EPOCHS)}>
              {labels.skip}
            </button>
            <button type="button" className="btn" data-pos="reset-chain" onClick={s.resetChain}>
              {labels.reset}
            </button>
          </div>
        )}
        <div className="ctl-stats" style={{ gap: '2px 14px' }}>
          <Stat name={stepId === 'attest' ? labels.votingNeeded : labels.onlineStake} tone={part.justified ? 'good' : 'bad'}>
            {stepId === 'attest' ? `${num(part.online, 0, lang)} / ${num(Math.ceil(part.needed), 0, lang)} ETH` : `${pct(part.fraction, 1, lang)} · ${part.justified ? '≥' : '<'} 2/3`}
          </Stat>
          {stepId === 'attest' ? (
            <>
              <Stat name={labels.checkpoint} tone={part.justified ? 'good' : 'bad'}>
                {part.justified ? labels.justified : labels.missed}
              </Stat>
            </>
          ) : (
            <>
              <Stat name={labels.noFinality} tone={delay > 1 ? 'bad' : 'good'}>
                {num(Math.max(0, delay - 1), 0, lang)} {labels.epochs}
              </Stat>
              {lv && (
                <Stat name={labels.leak} tone={leaked > 0 ? 'bad' : undefined}>
                  {lost(leaked, lang)}
                </Stat>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (stepId === 'slashing') {
    const set = s.slashed ? [YOU, ...ACCOMPLICES.slice(0, s.slashedCount - 1)] : [];
    const o = slashOutcome(
      s.stake,
      set.reduce((a, i) => a + stakes[i], 0),
      total,
    );
    return (
      <div className="ctl" style={{ gap: '4px 14px', maxWidth: 560 }}>
        <div style={row}>
          <button type="button" className={s.slashed ? 'btn' : 'btn btn-primary'} data-pos="equivocate" onClick={() => s.setSlashed(!s.slashed)}>
            {s.slashed ? labels.undo : labels.signTwo}
          </button>
          <label className="ctl-field" style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 210 }}>
            <span style={{ whiteSpace: 'nowrap' }}>
              {labels.slashedTogether}: {s.slashed ? s.slashedCount : 0} · {pct(o.slashedShare, 1, lang)} stake
            </span>
            <input id="pos-slashed" type="range" min={1} max={COUNT} step={1} value={s.slashedCount} disabled={!s.slashed} onChange={(e) => s.setSlashedCount(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
          </label>
        </div>
        <div className="ctl-stats" style={{ gap: '2px 14px' }}>
          <Stat name={labels.initialPenalty}>{s.slashed ? `−${eth(o.initial, lang)}` : '—'}</Stat>
          <Stat name={labels.correlationPenalty} tone={s.slashed ? 'bad' : undefined}>
            {s.slashed ? `−${eth(o.correlation, lang)}` : '—'}
          </Stat>
          <Stat name={labels.youKeep} tone={s.slashed ? (o.remaining > 0 ? undefined : 'bad') : 'good'}>
            {eth(s.slashed ? o.remaining : s.stake, lang)}
          </Stat>
        </div>
      </div>
    );
  }

  if (stepId === 'compare') {
    const isPow = s.attackSide === 'pow';
    const a = isPow ? powAttack(s.attackShare) : posAttack(s.attackShare);
    const can = isPow ? (a.canRewrite ? labels.canRewrite : labels.cannot) : a.canRewrite ? labels.canFinalize : a.canStall ? labels.canStall : labels.cannotStall;
    return (
      <div className="ctl" style={{ gap: '4px 14px', maxWidth: 560 }}>
        <div style={row}>
          <div className="seg" role="group" aria-label={labels.design}>
            <button type="button" data-side="pow" aria-pressed={isPow} onClick={() => s.setAttackSide('pow')}>
              Proof of Work
            </button>
            <button type="button" data-side="pos" aria-pressed={!isPow} onClick={() => s.setAttackSide('pos')}>
              Proof of Stake
            </button>
          </div>
          <label className="ctl-field" style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 210 }}>
            <span style={{ whiteSpace: 'nowrap', minWidth: '8.5em' }}>
              {labels.attacker}: {num(a.share, 0, lang)}% {isPow ? 'hashrate' : 'stake'}
            </span>
            <input id="pos-attack" type="range" min={0} max={100} step={1} value={s.attackShare} onChange={(e) => s.setAttackShare(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
          </label>
        </div>
        <div className="ctl-stats" style={{ gap: '2px 14px' }}>
          <Stat name={labels.canDo} tone={a.canRewrite || a.canStall ? 'bad' : 'good'}>
            {can}
          </Stat>
          <Stat name={isPow ? labels.lostMachines : labels.lostStake} tone={a.lostPercent > 0 ? 'good' : 'bad'}>
            {num(a.lostPercent, 0, lang)}%
          </Stat>
          <Stat name={labels.leftOver}>{num(a.keptPercent, 0, lang)}%</Stat>
        </div>
      </div>
    );
  }
  return null;
}
