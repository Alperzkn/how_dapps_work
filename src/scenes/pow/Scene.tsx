import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Group } from 'three';
import { Anim, Ball, Block, Box, ChainLink, CoinStack, Cyl, FlowLine, Label, MinerRig, Mover, Packet, Platform, ShadowGround, useLoop, useScene, type Vec3 } from '../../scene/kit';
import type { SceneProps } from '../../scene/types';
import type { ColorKey } from '../../theme/tokens';
import { expectedAttempts } from '../../sim/pow';
import { attackSuccess, blockTime, expectedWins, minePeriod, replay, secretProgress, splitShares, staleChance } from './logic';
import { ATTACKER, BATCH, CONFIRMATIONS, DELAY, HASHRATE, MAX_ZEROS, MIN_ZEROS, RIVAL_GAP, SHARE, useLab, useMining } from './state';

const BS = 1.3;
const CHAIN_Z = -2.6;
const CHAIN_X = [-5, -2.6, -0.2];
const SLOT: Vec3 = [2.2, 0, CHAIN_Z];
const MINERS: Vec3[] = [
  [-4.4, 0, 3],
  [0, 0, 3],
  [4.4, 0, 3],
];
const YOU = 1;
/** Candidate block, relative to its miner. */
const CAND: Vec3 = [0, 0, -1.9];
const SHARES = ['25', '45', '30'];
const NAMES = ['A', 'B', 'C'];

const GAUGE_H = 3.2;
/** Height of the "valid" zone on the gauge. A picture of the idea, not to scale: the real zone shrinks 16x per zero. */
const zoneHeight = (zeros: number) => 1.5 * 0.62 ** (zeros - 1);

const locale = (lang: string) => (lang === 'tr' ? 'tr-TR' : 'en-US');
const fmt = (n: number, lang: string) => (Number.isFinite(n) ? Math.round(n).toLocaleString(locale(lang)) : '0');
/** A number with a fixed count of decimals. */
const dec = (n: number, digits: number, lang: string) =>
  (Number.isFinite(n) ? n : 0).toLocaleString(locale(lang), { minimumFractionDigits: digits, maximumFractionDigits: digits });
/** "45%" in English, "%45" in Turkish. */
const pct = (text: string, lang: string) => (lang === 'tr' ? `%${text}` : `${text}%`);
/** A probability as a percentage that stays readable from 100% down to one in a million. */
const chance = (p: number, lang: string) => {
  const x = Math.min(1, Math.max(0, Number.isFinite(p) ? p : 0)) * 100;
  if (x > 0 && x < 0.001) return `< ${pct(dec(0.001, 3, lang), lang)}`;
  return pct(x >= 10 ? dec(x, 1, lang) : x >= 1 ? dec(x, 2, lang) : dec(x, 3, lang), lang);
};
const fill = (template: string, value: string | number) => template.replace('{n}', String(value));
const between = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const PILE_SLABS = 20;
const RIVAL_Z = CHAIN_Z + 1.9;
const NEXT_X = 4.5;

/** Mechanical counter with four drums that spin while nonces are being tried. */
function Counter({ spin, rate = 1 }: { spin: boolean; rate?: number }) {
  const drums = useRef<(Group | null)[]>([]);
  useLoop((_, dt) => {
    drums.current.forEach((d, i) => {
      if (d) d.rotation.x += dt * (3 + i * 3.1) * rate;
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

/**
 * A gauge for one hash: the marker shows where the hash landed, the green zone at the
 * bottom is "below the target". Every try throws the marker somewhere new.
 */
function Gauge({ active, labels }: { active: boolean; labels: Record<string, string> }) {
  const zeros = useMining((s) => s.zeros);
  const status = useMining((s) => s.status);
  const zone = zoneHeight(zeros);
  const marker = useRef<Group>(null);
  const found = status === 'found';
  const rest = found ? zone * 0.5 : zone + (GAUGE_H - zone) * 0.55;
  useLoop((t, dt) => {
    const g = marker.current;
    if (!g) return;
    const s = useMining.getState();
    let goal = rest;
    if (s.status === 'mining' && s.hash) {
      const f = parseInt(s.hash.slice(2, 8), 16) / 0xffffff;
      goal = zone + 0.25 + (Number.isFinite(f) ? f : 0.5) * (GAUGE_H - zone - 0.45);
    } else if (s.status === 'idle') {
      // Nothing is running: show slow example throws so the idea is visible.
      const k = Math.floor(t * 1.6);
      const f = Math.abs(Math.sin(k * 12.9898) * 43758.5453) % 1;
      goal = zone + 0.25 + f * (GAUGE_H - zone - 0.45);
    }
    g.position.y += (goal - g.position.y) * Math.min(1, dt * 14);
  }, active);
  return (
    <group>
      <Box size={[0.9, 0.16, 0.9]} position={[0, 0.08, 0]} color="platform" radius={0.05} />
      <Box size={[0.42, GAUGE_H, 0.42]} position={[0, GAUGE_H / 2 + 0.16, 0]} color="neutral" radius={0.08} />
      <Anim position={[0, 0.16, 0]} scale={[1, zone, 1]} speed={8}>
        <Box size={[0.52, 1, 0.52]} position={[0, 0.5, 0]} color="valid" glow radius={0.04} />
      </Anim>
      <group ref={marker} position={[0, rest, 0]}>
        <group position={[0, 0.16, 0.42]}>
          <Ball radius={0.2} color={found ? 'platform' : status === 'mining' ? 'invalid' : 'chain'} glow={found} />
          <Box size={[0.5, 0.06, 0.06]} position={[0, 0, -0.2]} color="ink" radius={0.02} />
        </group>
      </group>
      <Label position={[1.5, GAUGE_H * 0.85, 0.3]} tone="plain" maxLevel="beginner">
        {labels.gaugeTop}
      </Label>
      <Label position={[1.5, GAUGE_H * 0.85, 0.3]} tone="mono" minLevel="intermediate">
        {labels.hashValue}
      </Label>
      <Label position={[0.9, 0.16 + zone / 2, 0.3]} tone="valid" maxLevel="beginner">
        {labels.winZone}
      </Label>
      <Label position={[0.9, 0.16 + zone / 2, 0.3]} tone="valid" minLevel="intermediate" maxLevel="intermediate">
        {labels.belowTarget}
      </Label>
      <Label position={[0.9, 0.16 + zone / 2, 0.3]} tone="valid" minLevel="expert">
        hash ≤ target
      </Label>
    </group>
  );
}

/** Live numbers from the running search, shown over your candidate block. */
function Readout({ position, labels, lang, idleText }: { position: Vec3; labels: Record<string, string>; lang: string; idleText: string }) {
  const status = useMining((s) => s.status);
  const nonce = useMining((s) => s.nonce);
  const hash = useMining((s) => s.hash);
  if (status === 'idle' || !hash) {
    return (
      <Label position={position} tone="actor">
        {idleText}
      </Label>
    );
  }
  const found = status === 'found';
  const head = `${hash.slice(0, 10)}…`;
  return (
    <>
      <Label position={position} tone={found ? 'valid' : 'mono'} maxLevel="beginner">
        {labels.attempt} {fmt(nonce + (found ? 1 : 0), lang)}
        {found && ' ✓'}
        <br />
        {head}
      </Label>
      <Label position={position} tone={found ? 'valid' : 'mono'} minLevel="intermediate">
        nonce {fmt(nonce, lang)}
        {found && ' ✓'}
        <br />
        {head}
      </Label>
    </>
  );
}

/** Blocks on a timeline whose spacing follows the block time; the column is the difficulty. */
function Retarget({ active, labels, lang }: { active: boolean; labels: Record<string, string>; lang: string }) {
  const { compact } = useScene();
  const hashrate = useLab((s) => s.hashrate);
  const difficulty = useLab((s) => s.difficulty);
  const last = useLab((s) => s.last);
  const minutes = blockTime(difficulty, hashrate) / 60;
  const pace = minutes < 9.5 ? 'fast' : minutes > 10.5 ? 'slow' : 'ok';
  const gap = between(1.45 * (minutes / 10) ** 0.3, 0.8, 2.4);
  const rigs = between(Math.round(hashrate * 2), 1, 8);
  const column = between(difficulty, 0.15, 4.2) * 0.85;
  const BAR: Vec3 = [6.4, 0, 0.4];
  const tone = pace === 'ok' ? 'valid' : 'invalid';
  return (
    <>
      <Platform size={[10.4, 2]} position={[0, 0, 1.6]} color="ground" height={0.25} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Anim key={i} position={[(i - 2) * gap, 0, 1.6]} speed={3.5}>
          <Block size={0.85} color={i === 4 ? (pace === 'ok' ? 'valid' : 'invalid') : 'block'} glow={i === 4} />
        </Anim>
      ))}
      <Label position={[0, 1.75, 1.6]} tone={tone} maxLevel="beginner">
        {pace === 'fast' ? labels.tooFast : pace === 'slow' ? labels.tooSlow : labels.steady}
      </Label>
      <Label position={[0, 1.75, 1.6]} tone={tone} minLevel="intermediate">
        {fill(labels.pace, dec(minutes, minutes < 20 ? 1 : 0, lang))}
      </Label>

      <Platform size={[10.8, 2.2]} position={[-0.4, 0, -2.4]} color="ground" height={0.25} />
      {Array.from({ length: 8 }, (_, i) => (
        <Anim key={i} position={[-0.4 + (i - (rigs - 1) / 2) * 1.3, 0, -2.4]} scale={0.7} show={i < rigs} speed={5}>
          <MinerRig active={active && i < rigs} glow={i >= 2} />
        </Anim>
      ))}
      <Label position={[-0.4, 1.7, -2.4]} tone="actor" maxLevel="beginner">
        {hashrate < 1 ? labels.minersLeave : hashrate > 1 ? labels.moreMiners : labels.fewMiners}
      </Label>
      <Label position={[-0.4, 1.7, -2.4]} tone="actor" minLevel="intermediate">
        {labels.hashrateWord} ×{dec(hashrate, 2, lang)}
      </Label>

      <group position={BAR}>
        <Box size={[1.3, 0.16, 1.3]} position={[0, 0.08, 0]} color="platform" radius={0.05} />
        <Anim position={[0, 0.16, 0]} scale={[1, column, 1]} speed={3}>
          <Box size={[0.9, 1.1, 0.9]} position={[0, 0.55, 0]} color="contract" glow={pace === 'ok'} radius={0.05} />
        </Anim>
        <Anim position={[0, 0.16 + 1.1 * column + 0.75, 0]} speed={3}>
          <Label maxLevel="beginner">{difficulty > 1.02 ? labels.harder : difficulty < 0.98 ? labels.easier : labels.difficulty}</Label>
          <Label minLevel="intermediate">
            {labels.difficulty} ×{dec(difficulty, 2, lang)}
            {last && last.limit !== 'none' && ` ${labels.clampTag}`}
          </Label>
        </Anim>
      </group>
      <Label position={[2.2, 2.4, -5.4]} show={!compact} tone="mono" minLevel="expert">
        target′ = target × T / 1 209 600 s
        <br />T ∈ [3.5 d, 8 w] → ×¼ … ×4
      </Label>
    </>
  );
}

const ROW = 13;
const AX0 = -6.2;
const ASTEP = 0.95;
const ABS = 0.72;
const HONEST_Z = -2;
const SECRET_Z = 1.5;

/** One chain of the double-spend race: up to 13 blocks growing to the right. */
function RaceRow({ count, z, color, glow }: { count: number; z: number; color: ColorKey; glow: boolean }) {
  return (
    <>
      {Array.from({ length: ROW }, (_, i) => (
        <Anim key={i} position={[AX0 + (i + 1) * ASTEP, 0, z]} show={i < count} speed={9}>
          <Box size={[ASTEP - ABS + 0.1, 0.1, 0.1]} position={[-ASTEP / 2, ABS / 2, 0]} color={color === 'invalid' ? 'invalid' : 'chain'} radius={0.03} />
          <Block size={ABS} color={color} glow={glow && i === count - 1} />
        </Anim>
      ))}
    </>
  );
}

/** The public chain against the attacker's secret one. */
function Attack({ active, labels, lang, reducedMotion }: { active: boolean; labels: Record<string, string>; lang: string; reducedMotion: boolean }) {
  const { compact } = useScene();
  const q = useLab((s) => s.attacker);
  const z = useLab((s) => s.confirmations);
  const attempt = useLab((s) => s.attempt);
  const [head, setHead] = useState(0);
  const began = useRef<number | null>(null);
  useEffect(() => {
    began.current = null;
    setHead(0);
  }, [attempt]);
  const total = attempt ? attempt.events.length : 0;
  // Played back against the clock, so a slow device skips blocks instead of falling behind.
  useLoop((time) => {
    began.current ??= time;
    const next = Math.min(total, Math.floor((time - began.current) * Math.max(7, total / 4.5)));
    if (next !== head) setHead(next);
  }, active && total > 0 && head < total);
  const shown = reducedMotion ? total : Math.min(head, total);
  const done = attempt !== null && shown >= total;
  const lambda = secretProgress(q / 100, z);
  const counts = attempt ? replay(attempt.events, shown) : { honest: z, attacker: Math.round(lambda) };
  const offset = Math.max(0, Math.max(counts.honest, counts.attacker) - ROW);
  const honest = Math.max(0, counts.honest - offset);
  const secret = Math.max(0, counts.attacker - offset);
  const success = attackSuccess(q / 100, z);
  const endX = (n: number) => AX0 + Math.max(1, n) * ASTEP;
  return (
    <>
      <Platform size={[14, 2.2]} position={[0.2, 0, HONEST_Z]} color="ground" height={0.25} />
      <group position={[AX0, 0, HONEST_Z]}>
        <Block size={ABS} color="neutral" />
        <Label position={[-0.5, ABS + 0.7, -0.5]} show={offset > 0} tone="plain">
          … +{offset}
        </Label>
      </group>
      <RaceRow count={honest} z={HONEST_Z} color={done && attempt?.caughtUp ? 'neutral' : 'block'} glow />
      <Anim position={[endX(honest), ABS + 0.7, HONEST_Z]} speed={9}>
        <Label tone="valid">
          {labels.publicChain} · {counts.honest}
        </Label>
      </Anim>
      {[-3.4, -0.9, 1.6].map((x) => (
        <group key={x} position={[x, 0, -5.4]} scale={0.85}>
          <MinerRig active={active} />
        </group>
      ))}
      <Label position={[-0.9, 1.7, -5.4]} show={!compact} tone="actor">
        {fill(labels.honestPct, pct(String(100 - q), lang))}
      </Label>

      <Platform size={[14, 2.2]} position={[0.2, 0, SECRET_Z]} color="ground" height={0.25} />
      <ChainLink from={[AX0 + 0.2, ABS / 2, HONEST_Z + ABS / 2]} to={[AX0 + ASTEP - ABS / 2 - 0.1, ABS / 2, SECRET_Z - 0.1]} color="invalid" />
      <RaceRow count={secret} z={SECRET_Z} color="invalid" glow />
      <Anim position={[endX(secret) + 1.7, 0.5, SECRET_Z + 0.3]} speed={9}>
        <Label tone={done && !attempt?.caughtUp ? 'valid' : 'invalid'}>
          {labels.attackerChain} · {attempt ? counts.attacker : `≈ ${dec(lambda, 1, lang)}`}
          {done && (
            <>
              <br />
              {attempt?.caughtUp ? labels.caught : labels.gaveUp}
            </>
          )}
        </Label>
      </Anim>
      <group position={[-3.2, 0, 5.2]} scale={0.85}>
        <MinerRig active={active} color="invalid" glow />
        <group position={[1.7, 0, 0]}>
          <CoinStack count={6} radius={0.3} />
        </group>
      </group>
      {active && (
        <Mover path={COIN_PATH} duration={1.1} arc={0.9}>
          <Cyl radius={0.26} height={0.11} color="tx" />
        </Mover>
      )}
      <Label position={[-3.2, 1.7, 5.4]} show={!compact} tone="invalid">
        {fill(labels.attackerPct, pct(String(q), lang))}
      </Label>
      <Label position={[0, 1.1, 6.1]} show={!compact} tone="tx" maxLevel="intermediate">
        {labels.cost}
      </Label>
      <Label position={[3.2, 0.2, 4.6]} show={!compact} minLevel="expert" tone="mono">
        P = 1 − Σ Pois(k; λ)·(1 − (q/p)^(z−k))
        <br />λ = z·q/p = {dec(lambda, 2, lang)} → P {success > 0 && success < 0.00001 ? '' : '= '}
        {chance(success, lang)}
      </Label>
    </>
  );
}
const COIN_PATH: Vec3[] = [
  [-1.8, 0.8, 5.2],
  [-0.4, 0.3, 6.1],
];

export default function Scene({ stepId, labels, lang, reducedMotion }: SceneProps) {
  const status = useMining((s) => s.status);
  const isWho = stepId === 'who';
  const isPuzzle = stepId === 'puzzle';
  const isRace = stepId === 'race';
  const isOdds = stepId === 'odds';
  const isCast = stepId === 'broadcast';
  const isRetarget = stepId === 'retarget';
  const isAttack = stepId === 'attack';
  const main = isWho || isPuzzle || isRace || isOdds || isCast;
  const interactive = isPuzzle || isRace;
  const found = interactive && status === 'found';
  const mining = status === 'mining';
  // On a phone the controls cover the lower part of the canvas, so the scene moves up and shrinks a little.
  const { compact } = useScene();
  const lift = !compact ? 0 : isPuzzle ? 2.1 : isRace ? 3.6 : isOdds ? 3.4 : isCast ? 3.3 : isRetarget ? 3 : isAttack ? 1.8 : 0;
  const fit = !compact ? 1 : isPuzzle ? 0.95 : isRace ? 0.9 : isOdds ? 0.8 : isCast ? 0.8 : isRetarget ? 0.8 : isAttack ? 0.8 : 1;

  // The lottery: shares and blocks won.
  const share = useLab((s) => s.share);
  const wins = useLab((s) => s.wins);
  const rounds = useLab((s) => s.rounds);
  const shares = splitShares(share / 100);
  const mine = expectedWins(share / 100, rounds);
  // Broadcast: how long the block travels and what became of miner C's competing block.
  const delay = useLab((s) => s.delay);
  const rival = useLab((s) => s.rival);
  const forked = isCast && (rival === 'fork' || rival === 'youWin' || rival === 'rivalWins');
  const settled = isCast && (rival === 'youWin' || rival === 'rivalWins');
  const lost = isCast && rival === 'rivalWins';
  const travel = 0.8 + delay * 0.14;

  return (
    <Anim position={[0, lift, 0]} scale={fit} speed={5}>
      <ShadowGround />

      {/* The chain so far, with an empty place for the next block. */}
      <Anim show={main && !isPuzzle}>
        <Platform size={[12.6, 2.6]} position={[-0.3, 0, CHAIN_Z]} color="ground" height={0.25} />
        {CHAIN_X.map((x, i) => (
          <group key={x}>
            <group position={[x, 0, CHAIN_Z]}>
              <Block size={BS} />
            </group>
            {i > 0 && <ChainLink from={[CHAIN_X[i - 1] + BS / 2, BS / 2, CHAIN_Z]} to={[x - BS / 2, BS / 2, CHAIN_Z]} />}
          </group>
        ))}
        <Anim show={!isCast} position={SLOT}>
          <Box size={[BS, BS, BS]} position={[0, BS / 2, 0]} color="neutral" opacity={0.35} radius={0.1} />
          <Label position={[0, BS + 0.8, 0]} show={isWho}>
            {labels.nextBlock}
          </Label>
          <Label position={[0, BS + 0.8, 0]} show={isRace || isOdds} tone="plain">
            {labels.emptySlot}
          </Label>
        </Anim>
        <Anim show={isCast}>
          <ChainLink from={[CHAIN_X[2] + BS / 2, BS / 2, CHAIN_Z]} to={[SLOT[0] - BS / 2, BS / 2, CHAIN_Z]} />
        </Anim>
        <Label position={[CHAIN_X[1], BS + 0.9, CHAIN_Z]} show={isWho || isCast} tone="block" minLevel="intermediate">
          {labels.chain}
        </Label>
      </Anim>

      {/* Three miners, each with its own candidate block. */}
      {MINERS.map((m, i) => {
        const you = i === YOU;
        const shown = main && (you || !isPuzzle);
        const won = you && ((isCast && !lost) || found);
        const candAt: Vec3 = you && isCast ? SLOT : you && isPuzzle ? [0.2, 0, 0.3] : [m[0] + CAND[0], 0, m[2] + CAND[2]];
        const candScale = you && isCast ? 1 : you && isPuzzle ? 1.05 : 0.7;
        return (
          <group key={i}>
            <Anim position={m} show={shown} speed={5}>
              <MinerRig active={shown && (isRace || isOdds || isCast || (isPuzzle && mining))} glow={won || (isOdds && you) || (i === 2 && forked)} />
              <Anim show={you && isCast && !lost} position={[0.2, 0.98, 0]}>
                <CoinStack count={4} radius={0.26} glow />
              </Anim>
              <Label position={[0, 1.75, 0.4]} show={isWho || isRace} tone="actor" maxLevel="beginner">
                {you && isRace ? labels.you : `${labels.miner} ${NAMES[i]}`}
              </Label>
              <Label position={[0, 1.75, 0.4]} show={isWho || isRace} tone="actor" minLevel="intermediate">
                {you && isRace ? labels.you : `${labels.miner} ${NAMES[i]}`}
                {isRace && ` · ${pct(SHARES[i], lang)}`}
              </Label>
              <Label position={[0, 1.75, 0.4]} show={isOdds} tone="actor">
                {you ? labels.you : `${labels.miner} ${NAMES[i]}`} · {pct(dec(shares[i] * 100, 0, lang), lang)}
              </Label>
              <Label position={[0, 1.75, 0.4]} show={you && isPuzzle} tone="actor">
                {labels.miner}
              </Label>
              <Label position={[0.8, -0.6, 1.2]} show={you && isPuzzle} minLevel="expert" tone="mono">
                SHA256d(version ‖ prev ‖ merkle
                <br />‖ time ‖ bits ‖ nonce)
              </Label>
              <Label position={[0, 2.2, 0]} show={you && isCast && !lost} tone="tx" maxLevel="beginner">
                {labels.reward}
              </Label>
              <Label position={[0, 2.2, 0]} show={you && isCast && !lost} tone="tx" minLevel="intermediate">
                {labels.rewardAmount}
              </Label>
              <Label position={[0, -0.45, 1.3]} show={!you && isCast && (i === 0 || rival === 'none')} tone="plain">
                {labels.startOver}
              </Label>
              <Label position={[0, -0.45, 1.3]} show={i === 2 && isCast && rival === 'late'} tone="valid">
                {labels.lateTag}
              </Label>
              <Label position={[0, -0.45, 1.3]} show={i === 2 && forked} tone="actor">
                {fill(labels.rivalTag, RIVAL_GAP)}
              </Label>
            </Anim>

            {/* The lottery: blocks won pile up in front of each miner. */}
            <Anim position={[m[0], 0, m[2] - 1.9]} show={isOdds} speed={6}>
              <Box size={[1.2, 0.14, 1.2]} position={[0, 0.07, 0]} color="platform" radius={0.05} />
              {Array.from({ length: PILE_SLABS }, (_, j) => (
                <Anim key={j} position={[0, 0.25 + j * 0.21, 0]} show={j < Math.round((wins[i] / Math.max(1, rounds)) * PILE_SLABS)} speed={8}>
                  <Box size={[0.95, 0.17, 0.95]} color={you ? 'valid' : 'block'} glow={you} radius={0.04} />
                </Anim>
              ))}
              <Anim position={[0, 0.75 + Math.round((wins[i] / Math.max(1, rounds)) * PILE_SLABS) * 0.21, 0]} speed={8}>
                <Label tone={you ? 'valid' : 'block'}>
                  {fmt(wins[i], lang)}
                  {!compact && ` · ${pct(dec((wins[i] / Math.max(1, rounds)) * 100, 1, lang), lang)}`}
                </Label>
              </Anim>
            </Anim>

            <Anim position={candAt} scale={candScale} show={shown && !isOdds && (you || !isCast)} speed={you ? 4 : 6}>
              <Block size={BS} color={won ? 'valid' : 'neutral'} glow={won} />
              <Anim show={!isCast} position={[0, BS + 0.5, 0]}>
                <Counter spin={shown && !won && (isRace || (isPuzzle && mining))} rate={0.6 + i * 0.5} />
              </Anim>
              {you && interactive && (
                <Readout position={[0, BS + (isPuzzle ? 1.55 : 1.9), 0]} labels={labels} lang={lang} idleText={isPuzzle ? labels.pressMine : labels.yourBlock} />
              )}
              <Label position={[0, BS + 0.75, 0]} show={you && isCast} tone={lost ? 'invalid' : 'valid'}>
                {lost ? labels.staleTag : labels.newBlock}
              </Label>
            </Anim>
          </group>
        );
      })}

      {/* Step 2: where did this try land? */}
      <Anim show={isPuzzle} position={[3.2, 0, 0.2]}>
        <Gauge active={isPuzzle} labels={labels} />
      </Anim>

      {/* Step 3: hash attempts streaming from each rig into its candidate. */}
      {isRace &&
        MINERS.map((m, i) => (
          <Mover key={i} path={[[m[0], 1.1, m[2] - 0.3], [m[0], 0.7 * BS + 0.2, m[2] + CAND[2] + 0.2]]} duration={0.5 + (2 - i) * 0.12} arc={0.5} delay={i * 0.17}>
            <Ball radius={0.09} color="actor" glow />
          </Mover>
        ))}

      {/* The winner sends the finished block to everyone; the slower it travels, the likelier a rival block. */}
      {isCast &&
        CAST_PATHS.map((path, i) => (
          <group key={i}>
            <FlowLine points={path} color="valid" dashed curved />
            <Mover key={delay} path={path} duration={travel} delay={0.4 + i * 0.2}>
              <Packet color="valid" size={0.34} />
            </Mover>
          </group>
        ))}
      <Label position={[CAST_PATHS[1][1][0] + 0.9, 3.1, CAST_PATHS[1][1][2] - 0.9]} show={isCast} tone="plain">
        {delay} {labels.seconds}
      </Label>
      <Anim show={forked} position={[SLOT[0], 0, RIVAL_Z]} speed={7}>
        <Platform size={[5.4, 1.9]} position={[1.3, 0, 0]} color="ground" height={0.25} />
        <ChainLink from={[CHAIN_X[2] - SLOT[0] + BS / 2, BS / 2, CHAIN_Z - RIVAL_Z + BS / 2]} to={[-0.5, BS / 2, -0.5]} color={rival === 'youWin' ? 'neutral' : 'chain'} />
        <group scale={0.85}>
          <Block size={BS} color={rival === 'youWin' ? 'neutral' : rival === 'rivalWins' ? 'valid' : 'actor'} glow={rival !== 'youWin'} />
        </group>
        <Label position={[0, BS + 0.5, 0]} tone={rival === 'youWin' ? 'invalid' : rival === 'rivalWins' ? 'valid' : 'actor'}>
          {rival === 'youWin' ? labels.staleTag : rival === 'rivalWins' ? `${labels.miner} C ✓` : labels.sameHeight}
        </Label>
      </Anim>
      <Anim show={settled} position={[NEXT_X, 0, lost ? RIVAL_Z : CHAIN_Z]} speed={7}>
        <Box size={[NEXT_X - SLOT[0] - BS * 0.8, 0.12, 0.12]} position={[-(NEXT_X - SLOT[0]) / 2, BS * 0.4, 0]} color="chain" radius={0.04} />
        <group scale={0.8}>
          <Block size={BS} color="block" glow />
        </group>
        <Label position={[0.9, 0.2, 0.9]} tone="block">
          {labels.builtOn}
        </Label>
      </Anim>
      <Label position={[-6.6, 0.4, 0.6]} show={isCast && !compact} minLevel="expert" tone="mono">
        inv → getdata → block · {labels.verifyOnce}
      </Label>
      <Label position={[-6.4, 0.4, 0.2]} show={isOdds && !compact} minLevel="expert" tone="mono">
        E = n·p = {dec(mine.mean, 0, lang)}
        <br />σ = √(n·p·(1−p)) = {dec(mine.sd, 1, lang)}
      </Label>

      {/* Step 5: difficulty follows the hashrate. */}
      <Anim show={isRetarget}>
        <Retarget active={isRetarget} labels={labels} lang={lang} />
      </Anim>

      {/* An attacker's private fork against the rest of the network. */}
      <Anim show={isAttack}>
        <Attack active={isAttack} labels={labels} lang={lang} reducedMotion={reducedMotion} />
      </Anim>
    </Anim>
  );
}

const CAST_PATHS: Vec3[][] = MINERS.filter((_, i) => i !== YOU).map((m) => [
  [SLOT[0], BS + 0.3, SLOT[2]],
  [(SLOT[0] + m[0]) / 2, 2.6, (SLOT[2] + m[2]) / 2],
  [m[0], 1.2, m[2]],
]);

const srOnly = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' } as const;

function MiningControls({ stepId, labels, lang }: SceneProps) {
  const { zeros, status, attempts, nonce, hash, elapsedMs, setZeros, start, stop, reset } = useMining();
  if (stepId !== 'puzzle' && stepId !== 'race') return null;

  const mining = status === 'mining';
  const found = status === 'found';
  const seconds = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) / 1000 : 0;
  const message = found ? labels.found : status === 'capped' ? labels.capped : status === 'stopped' ? labels.paused : mining ? labels.searching : labels.ready;
  // The state is shown inside the stat captions so the panel keeps the same height on a phone.
  const mark = (on: boolean, text: string) => (on ? ` · ${text}` : '');
  return (
    <div className="ctl">
      <label className="ctl-field">
        <span>
          {labels.zeros}: {zeros} · {labels.average} {fmt(expectedAttempts(zeros), lang)}
        </span>
        <input type="range" min={MIN_ZEROS} max={MAX_ZEROS} step={1} value={zeros} onChange={(e) => setZeros(Number(e.target.value))} aria-valuetext={`${zeros}`} />
      </label>
      {mining ? (
        <button type="button" className="btn btn-primary" data-mine="stop" onClick={stop}>
          {labels.stop}
        </button>
      ) : (
        <button type="button" className="btn btn-primary" data-mine="start" onClick={start}>
          {status === 'stopped' ? labels.resume : status === 'idle' ? labels.mine : labels.mineAgain}
        </button>
      )}
      <button type="button" className="btn" data-mine="reset" onClick={reset} disabled={status === 'idle'}>
        {labels.reset}
      </button>
      <div className="ctl-stats">
        <div className="ctl-stat">
          <span>
            {labels.attempts}
            {mark(status === 'capped', labels.limit)}
          </span>
          <strong>{fmt(attempts, lang)}</strong>
        </div>
        <div className="ctl-stat">
          <span>
            {labels.time}
            {mark(status === 'stopped', labels.paused)}
          </span>
          <strong>{seconds.toFixed(2)} s</strong>
        </div>
        <div className="ctl-stat">
          <span>{found ? `${labels.winningNonce} ✓` : labels.nonce}</span>
          <strong>{fmt(nonce, lang)}</strong>
        </div>
        <div className="ctl-stat" title={hash || undefined}>
          <span>{found ? `${labels.winningHash} ✓` : labels.lastHash}</span>
          <strong>{hash ? `${hash.slice(0, 8)}…` : '—'}</strong>
        </div>
      </div>
      <span role="status" style={srOnly}>
        {message}
      </span>
    </div>
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

const PANEL = { gap: '4px 12px', maxWidth: 600 } as const;
const STATS = { flexBasis: '100%', gap: '2px 14px' } as const;

function OddsControls({ labels, lang }: SceneProps) {
  const share = useLab((s) => s.share);
  const wins = useLab((s) => s.wins);
  const rounds = useLab((s) => s.rounds);
  const setShare = useLab((s) => s.setShare);
  const runBlocks = useLab((s) => s.runBlocks);
  const mine = expectedWins(share / 100, rounds);
  return (
    <div className="ctl" style={PANEL}>
      <div className="ctl-title">{labels.tryOdds}</div>
      <label className="ctl-field" style={{ minWidth: 140 }}>
        <span>
          {labels.yourShare}: {pct(String(share), lang)}
        </span>
        <input type="range" min={SHARE.min} max={SHARE.max} step={1} value={share} onChange={(e) => setShare(Number(e.target.value))} />
      </label>
      <button type="button" className="btn btn-primary" onClick={runBlocks} disabled={rounds >= 100_000}>
        {fill(labels.runBlocks, BATCH)}
      </button>
      <div className="ctl-stats" style={STATS}>
        <Stat name={labels.blocksMined}>{fmt(rounds, lang)}</Stat>
        <Stat name={labels.youWon}>
          {fmt(wins[YOU], lang)} ({pct(dec((wins[YOU] / Math.max(1, rounds)) * 100, 1, lang), lang)})
        </Stat>
        <Stat name={labels.expected}>
          {dec(mine.mean, 0, lang)} ± {dec(mine.sd, 1, lang)}
        </Stat>
      </div>
    </div>
  );
}

function CastControls({ labels, lang }: SceneProps) {
  const delay = useLab((s) => s.delay);
  const rival = useLab((s) => s.rival);
  const setDelay = useLab((s) => s.setDelay);
  const advanceRival = useLab((s) => s.advanceRival);
  const outcome = { none: labels.outNone, late: labels.outLate, fork: labels.outFork, youWin: labels.outYou, rivalWins: labels.outRival }[rival];
  const button = rival === 'none' ? fill(labels.rivalFinds, RIVAL_GAP) : rival === 'fork' ? labels.nextBlockBtn : labels.startOverBtn;
  return (
    <div className="ctl" style={PANEL}>
      <div className="ctl-title">{labels.tryCast}</div>
      <label className="ctl-field" style={{ minWidth: 110 }}>
        <span>
          {labels.delayLabel}: {delay} {labels.seconds}
        </span>
        <input type="range" min={DELAY.min} max={DELAY.max} step={1} value={delay} onChange={(e) => setDelay(Number(e.target.value))} />
      </label>
      <button type="button" className={rival === 'late' || rival === 'youWin' || rival === 'rivalWins' ? 'btn' : 'btn btn-primary'} data-rival={rival} onClick={advanceRival}>
        {button}
      </button>
      <div className="ctl-stats" style={STATS}>
        <Stat name={labels.staleStat}>{chance(staleChance(delay), lang)}</Stat>
        <Stat name={labels.outcome} tone={rival === 'late' || rival === 'youWin' ? 'good' : rival === 'rivalWins' || rival === 'fork' ? 'bad' : undefined}>
          {outcome}
        </Stat>
      </div>
    </div>
  );
}

function RetargetControls({ labels, lang }: SceneProps) {
  const hashrate = useLab((s) => s.hashrate);
  const difficulty = useLab((s) => s.difficulty);
  const setHashrate = useLab((s) => s.setHashrate);
  const nextPeriod = useLab((s) => s.nextPeriod);
  const p = minePeriod(difficulty, hashrate);
  const minutes = p.spacing / 60;
  return (
    <div className="ctl" style={PANEL}>
      <div className="ctl-title">{labels.tryRetarget}</div>
      <label className="ctl-field" style={{ minWidth: 110 }}>
        <span>
          {labels.hashrateSlider}: ×{dec(hashrate, 2, lang)}
        </span>
        <input type="range" min={HASHRATE.min} max={HASHRATE.max} step={HASHRATE.step} value={hashrate} onChange={(e) => setHashrate(Number(e.target.value))} />
      </label>
      <button type="button" className="btn btn-primary" onClick={nextPeriod}>
        {labels.minePeriod}
      </button>
      <div className="ctl-stats" style={STATS}>
        <Stat name={labels.blockTimeStat} tone={minutes >= 9.5 && minutes <= 10.5 ? 'good' : 'bad'}>
          {dec(minutes, minutes < 20 ? 1 : 0, lang)} {labels.min}
        </Stat>
        <Stat name={labels.periodTakes}>
          {dec(p.duration / 86_400, 1, lang)} {labels.days}
        </Stat>
        <Stat name={labels.diffNext}>
          ×{dec(difficulty, 2, lang)} → ×{dec(p.difficulty, 2, lang)}
          {p.limit !== 'none' && ` ${labels.clampTag}`}
        </Stat>
      </div>
    </div>
  );
}

function AttackControls({ labels, lang }: SceneProps) {
  const q = useLab((s) => s.attacker);
  const z = useLab((s) => s.confirmations);
  const attempts = useLab((s) => s.attempts);
  const successes = useLab((s) => s.successes);
  const setAttacker = useLab((s) => s.setAttacker);
  const setConfirmations = useLab((s) => s.setConfirmations);
  const raceOnce = useLab((s) => s.raceOnce);
  const success = attackSuccess(q / 100, z);
  const forfeited = secretProgress(q / 100, z) * 3.125;
  return (
    <div className="ctl" style={PANEL}>
      <div className="ctl-title">{labels.tryAttack}</div>
      <label className="ctl-field" style={{ minWidth: 100 }}>
        <span>
          {labels.attackerSlider}: {pct(String(q), lang)}
        </span>
        <input type="range" min={ATTACKER.min} max={ATTACKER.max} step={1} value={q} onChange={(e) => setAttacker(Number(e.target.value))} />
      </label>
      <label className="ctl-field" style={{ minWidth: 100 }}>
        <span>
          {labels.confSlider}: {z}
        </span>
        <input type="range" min={CONFIRMATIONS.min} max={CONFIRMATIONS.max} step={1} value={z} onChange={(e) => setConfirmations(Number(e.target.value))} />
      </label>
      <button type="button" className="btn btn-primary" onClick={raceOnce}>
        {labels.raceBtn}
      </button>
      <div className="ctl-stats" style={STATS}>
        <Stat name={labels.successStat} tone={success >= 0.01 ? 'bad' : 'good'}>
          {chance(success, lang)}
        </Stat>
        <Stat name={labels.atRisk}>{q >= 50 ? labels.noRisk : `≈ ${dec(forfeited, 1, lang)} BTC`}</Stat>
        <Stat name={labels.attemptsWon}>
          {successes} / {attempts}
        </Stat>
      </div>
    </div>
  );
}

export function Controls(props: SceneProps) {
  const mining = props.stepId === 'puzzle' || props.stepId === 'race';
  useEffect(() => {
    if (!mining) useMining.getState().stop();
  }, [mining]);
  useEffect(() => () => useMining.getState().stop(), []);
  switch (props.stepId) {
    case 'puzzle':
    case 'race':
      return <MiningControls {...props} />;
    case 'odds':
      return <OddsControls {...props} />;
    case 'broadcast':
      return <CastControls {...props} />;
    case 'retarget':
      return <RetargetControls {...props} />;
    case 'attack':
      return <AttackControls {...props} />;
    default:
      return null;
  }
}
