import { useMemo, useRef, type ReactNode } from 'react';
import type { Group } from 'three';
import { Anim, Ball, Block, Box, ChainLink, CoinStack, Cyl, FlowLine, Label, Mover, Packet, Person, Platform, ShadowGround, useLoop, type Vec3 } from '../../scene/kit';
import type { SceneProps } from '../../scene/types';
import { sha256, shortHash } from '../../sim/sha256';
import type { Lang } from '../../types';
import { attackerExpectedBlocks, bitDiff, brokenCount, catchUpFromBehind, catchUpProbability, firstBroken, hexDiff, MAX_DEPTH, MAX_SHARE, MIN_DEPTH, MIN_SHARE, USES, type UseId } from './logic';
import { computeChain, MAX_TEXT, ORIGINAL, useChain } from './state';

const XS = [-4.5, -1.5, 1.5, 4.5];
const SIZE = 1.4;
const FACE: Vec3 = [0, Math.PI / 4, 0];

const READERS: { pos: Vec3; rot: number }[] = [
  { pos: [-3.4, 0, 0.4], rot: Math.PI / 2 },
  { pos: [3.2, 0, -0.6], rot: -Math.PI / 2 },
  { pos: [0.2, 0, 3.6], rot: Math.PI },
];

// Fingerprint step: a bench behind the chain where any text is hashed live.
const BENCH: Vec3 = [-0.2, 0, -3.9];
const BARS = 32;
const BAR_STEP = 0.2;
const BAR_X0 = -2.1;

// History step: two rows racing away from the camera (towards -z), so the growing ends stay at the top of
// the picture, clear of the control panel. A big block holds the payment; small ones are built on top.
const RACE_Z0 = 4.2;
const RACE_STEP = 0.78;
const SMALL = 0.66;
const HONEST_X = -1.7;
const ATTACK_X = 1.7;
/** Distance of small block i from the row's big block, and its world z. */
const raceAt = (i: number) => 1.5 + i * RACE_STEP;
const raceZ = (i: number) => RACE_Z0 - raceAt(i);
const ALONG_Z: Vec3 = [0, Math.PI / 2, 0];

// Uses step: six kinds of record around the same chain.
// Uses step: six kinds of record in two rows behind a smaller chain.
const USE_POS: Record<UseId, Vec3> = {
  payments: [-2.2, 0, -5.8],
  ownership: [-3.5, 0, -3.6],
  identity: [-0.3, 0, -3.6],
  supply: [1, 0, -5.8],
  votes: [2.9, 0, -3.6],
  games: [4.2, 0, -5.8],
};
const CHAIN_SMALL = 0.7;

const locale = (lang: Lang) => (lang === 'tr' ? 'tr-TR' : 'en-US');

function num(n: number, digits: number, lang: Lang): string {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString(locale(lang), { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** A whole-number percentage, written the way each language writes it. */
const percent = (text: string, lang: Lang) => (lang === 'tr' ? `%${text}` : `${text}%`);

/** A probability as a percentage with enough digits to stay readable when it gets tiny. */
function chance(p: number, lang: Lang): string {
  const v = (Number.isFinite(p) ? Math.min(Math.max(p, 0), 1) : 0) * 100;
  if (v > 0 && v < 0.0001) return `< ${percent(num(0.0001, 4, lang), lang)}`;
  const digits = v >= 10 ? 1 : v >= 1 ? 2 : v >= 0.01 ? 3 : 4;
  return percent(num(v, digits, lang), lang);
}

const fill = (template: string, n: number) => template.replace('{n}', String(n));
const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** A page of the ledger: a sheet with a few written lines. */
function Sheet({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <Box size={[2, 0.08, 2.7]} position={[0, 0.04, 0]} color="platform" radius={0.03} />
      {[-0.9, -0.45, 0, 0.45, 0.9].map((z, i) => (
        <Box key={z} size={[i % 2 ? 1.1 : 1.5, 0.03, 0.14]} position={[i % 2 ? -0.2 : 0, 0.09, z]} color={i === 2 ? 'tx' : 'neutral'} radius={0.01} />
      ))}
    </group>
  );
}

/** Bobs up and down: a block that is being worked on. `rate` sets how fast. */
function Pulse({ rate = 2.2, amp = 0.5, active = true, children }: { rate?: number; amp?: number; active?: boolean; children: ReactNode }) {
  const ref = useRef<Group>(null);
  useLoop((t) => {
    if (ref.current) ref.current.position.y = active ? Math.max(0, Math.sin(t * rate)) * amp : 0;
  });
  return <group ref={ref}>{children}</group>;
}

/** The 256-bit fingerprint drawn as a skyline: one bar per byte. Changed bytes light up. */
function Skyline({ hash, prev }: { hash: string; prev: string | null }) {
  return (
    <group>
      {Array.from({ length: BARS }, (_, i) => {
        const byte = parseInt(hash.slice(i * 2, i * 2 + 2), 16) || 0;
        const changed = prev !== null && prev.slice(i * 2, i * 2 + 2) !== hash.slice(i * 2, i * 2 + 2);
        return (
          <Anim key={i} position={[BAR_X0 + i * BAR_STEP, 0, 0]} scale={[1, 0.12 + (byte / 255) * 0.95, 1]} speed={9}>
            <Box size={[0.14, 1, 0.5]} position={[0, 0.5, 0]} color={changed ? 'tx' : 'block'} glow={changed} radius={0.03} />
          </Anim>
        );
      })}
    </group>
  );
}

/** A row of the race: small blocks built on top of the block that holds the payment. */
function RaceRow({ count, partial, color, rate }: { count: number; partial: number; color: 'valid' | 'invalid'; rate: number }) {
  return (
    <group>
      {Array.from({ length: MAX_DEPTH }, (_, i) => {
        const full = i < count;
        const growing = i === count && partial > 0.04;
        return (
          <Anim key={i} position={[raceAt(i), 0, 0]} show={full || growing} scale={full ? 1 : Math.max(partial, 0.2)} speed={7}>
            <Pulse rate={rate} amp={0.28} active={growing || (full && i === count - 1 && partial <= 0.04)}>
              <Block color={color} size={SMALL} glow={growing} />
            </Pulse>
            <Cyl radius={0.05} height={RACE_STEP - SMALL + 0.1} position={[-RACE_STEP / 2, SMALL * 0.45, 0]} rotation={[0, 0, Math.PI / 2]} color="chain" segments={8} />
          </Anim>
        );
      })}
    </group>
  );
}

/** Small models for the kinds of record a chain can hold. Each stands on y = 0. */
function UseModel({ id, glow }: { id: UseId; glow: boolean }) {
  switch (id) {
    case 'payments':
      return (
        <group>
          <group position={[-0.3, 0, 0]}>
            <CoinStack count={5} color="tx" radius={0.34} glow={glow} />
          </group>
          <group position={[0.4, 0, 0.25]}>
            <CoinStack count={2} color="tx" radius={0.34} glow={glow} />
          </group>
        </group>
      );
    case 'ownership':
      // A framed picture: one unique item with one owner.
      return (
        <group rotation={FACE}>
          <Box size={[0.9, 0.1, 0.5]} position={[0, 0.05, 0]} color="neutral" radius={0.03} />
          <Box size={[1.3, 1.3, 0.14]} position={[0, 0.8, 0]} color="neutral" radius={0.05} />
          <Box size={[1, 1, 0.06]} position={[0, 0.8, 0.07]} color="tokenA" glow={glow} radius={0.03} />
          <Ball radius={0.2} position={[0.15, 0.95, 0.12]} color="platform" />
        </group>
      );
    case 'identity':
      // An ID card: a head, a few lines and a seal.
      return (
        <group rotation={FACE}>
          <Box size={[0.9, 0.1, 0.5]} position={[0, 0.05, 0]} color="neutral" radius={0.03} />
          <Box size={[1.6, 1.05, 0.12]} position={[0, 0.72, 0]} color="platform" glow={glow} radius={0.08} />
          <Ball radius={0.2} position={[-0.45, 0.85, 0.08]} color="actor" glow={glow} />
          <Box size={[0.4, 0.2, 0.05]} position={[-0.45, 0.48, 0.07]} color="actor" radius={0.04} />
          <Box size={[0.6, 0.09, 0.04]} position={[0.32, 0.95, 0.07]} color="chain" radius={0.02} />
          <Box size={[0.45, 0.09, 0.04]} position={[0.25, 0.75, 0.07]} color="neutral" radius={0.02} />
          <Cyl radius={0.14} height={0.05} position={[0.5, 0.45, 0.07]} rotation={[Math.PI / 2, 0, 0]} color="valid" glow={glow} />
        </group>
      );
    case 'supply':
      // Crates on a pallet, each with a tag.
      return (
        <group rotation={FACE}>
          <Box size={[1.7, 0.14, 1.1]} position={[0, 0.07, 0]} color="chain" radius={0.03} />
          <Box size={[0.75, 0.7, 0.8]} position={[-0.4, 0.49, 0]} color="neutral" glow={glow} radius={0.05} />
          <Box size={[0.75, 0.7, 0.8]} position={[0.42, 0.49, 0]} color="neutral" glow={glow} radius={0.05} />
          <Box size={[0.7, 0.6, 0.7]} position={[0, 1.14, 0]} color="neutral" glow={glow} radius={0.05} />
          <Box size={[0.3, 0.2, 0.04]} position={[0, 1.14, 0.36]} color="tokenB" glow={glow} radius={0.02} />
          <Box size={[0.3, 0.2, 0.04]} position={[-0.4, 0.5, 0.41]} color="tokenB" radius={0.02} />
        </group>
      );
    case 'votes':
      // A ballot box with a ballot going in.
      return (
        <group rotation={FACE}>
          <Box size={[1.3, 0.95, 1]} position={[0, 0.475, 0]} color="neutral" glow={glow} radius={0.07} />
          <Box size={[1.36, 0.12, 1.06]} position={[0, 1, 0]} color="platform" radius={0.04} />
          <Box size={[0.7, 0.04, 0.1]} position={[0, 1.07, 0]} color="ink" radius={0.01} />
          <Box size={[0.55, 0.5, 0.04]} position={[0, 1.3, 0]} rotation={[0, 0, 0.12]} color="platform" glow={glow} radius={0.02} />
          <Box size={[0.3, 0.06, 0.05]} position={[0.02, 1.38, 0.01]} rotation={[0, 0, 0.12]} color="valid" radius={0.01} />
        </group>
      );
    case 'games':
      // A sword and a shield: items a player can hold.
      return (
        <group rotation={FACE}>
          <Cyl radius={0.55} height={0.12} position={[0, 0.06, 0]} color="neutral" />
          <group position={[-0.25, 0.12, 0]}>
            <Box size={[0.16, 1.1, 0.07]} position={[0, 0.95, 0]} color="platform" glow={glow} radius={0.03} />
            <Box size={[0.5, 0.1, 0.14]} position={[0, 0.4, 0]} color="actor" glow={glow} radius={0.03} />
            <Box size={[0.12, 0.36, 0.12]} position={[0, 0.2, 0]} color="chain" radius={0.03} />
          </group>
          <group position={[0.35, 0.55, 0.15]}>
            <Cyl radius={0.4} height={0.1} rotation={[Math.PI / 2, 0, 0]} color="tokenB" glow={glow} />
            <Cyl radius={0.16} height={0.14} rotation={[Math.PI / 2, 0, 0]} color="platform" />
          </group>
        </group>
      );
  }
}

export default function Scene({ stepId, level, lang, labels }: SceneProps) {
  const detail = level !== 'beginner';
  const data = useChain((s) => s.data);
  const redone = useChain((s) => s.redone);
  const selected = useChain((s) => s.selected);
  const typed = useChain((s) => s.text);
  const prevText = useChain((s) => s.prevText);
  const share = useChain((s) => s.share);
  const depth = useChain((s) => s.depth);
  const use = useChain((s) => s.use);

  const live = useMemo(() => computeChain(data, redone), [data, redone]);
  const clean = useMemo(() => computeChain(ORIGINAL), []);

  const isLedger = stepId === 'ledger';
  const isFingerprint = stepId === 'fingerprint';
  const isTamper = stepId === 'tamper';
  const isHistory = stepId === 'history';
  const isUses = stepId === 'uses';
  const showChain = !isLedger && !isHistory;
  const linked = isFingerprint || isTamper || isUses;
  // Only the tamper step shows the user's edit on the main chain.
  const chain = isTamper ? live : clean;
  const showHashes = isFingerprint || isTamper;

  // Tamper: what is still wrong, and what repairing it did to the newest hash.
  const broken = firstBroken(live);
  const left = brokenCount(live);
  const anyRedone = live.some((b) => b.redone);
  const tip = live[live.length - 1].hash;
  const cleanTip = clean[clean.length - 1].hash;

  // Fingerprint: the typed text and its hash, compared with the hash one edit ago.
  const text = typed ?? labels.sampleText;
  const hash = useMemo(() => sha256(text), [text]);
  const prevHash = useMemo(() => (prevText === null ? null : sha256(prevText)), [prevText]);

  // History: how far the attacker is expected to get while the honest chain adds `depth` blocks.
  const lambda = attackerExpectedBlocks(share, depth);
  const whole = Math.min(Math.floor(lambda + 1e-9), MAX_DEPTH);
  const partial = whole >= MAX_DEPTH ? 0 : lambda - whole;
  const probability = catchUpProbability(share, depth);
  const attackTip = raceZ(Math.max(whole - (partial > 0.04 ? 0 : 1), 0));

  return (
    <>
      <ShadowGround />

      {/* Step 1: one shared page, and everyone holding a copy of it. */}
      <Anim show={isLedger} position={[0, 0, 0.4]}>
        <Platform size={[3, 3.6]} position={[0, 0.2, 0]} color="ground" height={0.2} />
        <group position={[0, 0.2, 0]}>
          <Sheet />
        </group>
        <Label position={[0, 1.5, 0]}>{labels.sharedLedger}</Label>
        {READERS.map((r, i) => (
          <group key={i}>
            <group position={r.pos} rotation={[0, r.rot, 0]}>
              <Person color="actor" />
              <group position={[0, 0.55, 0.55]} rotation={[0.5, 0, 0]}>
                <Sheet scale={0.3} />
              </group>
            </group>
            <FlowLine points={[[0, 0.5, 0], [r.pos[0] * 0.78, 0.5, r.pos[2] * 0.78]]} color="chain" dashed />
            <Label position={[r.pos[0], 1.9, r.pos[2]]} minLevel="intermediate" tone="plain">
              {labels.copy}
            </Label>
          </group>
        ))}
      </Anim>

      {/* The chain itself. */}
      <Anim show={showChain} scale={isUses ? CHAIN_SMALL : 1}>
        <Platform size={[12.4, 3]} position={[0, 0, 0]} color="ground" height={0.25} />
        {chain.map((b, i) => {
          const bad = !b.linked;
          const tone = b.edited ? 'tx' : bad ? 'invalid' : b.redone ? 'valid' : 'default';
          const color = b.edited ? 'tx' : bad ? 'invalid' : b.redone ? 'valid' : 'block';
          return (
            <Anim key={i} position={[XS[i], 0, 0]} show={showChain} speed={4 + i}>
              <Block color={color} size={SIZE} glow={b.edited || bad || b.redone} />
              {[-0.3, 0, 0.3].map((dx) => (
                <group key={dx} position={[dx, SIZE, 0.25]}>
                  <Packet size={0.2} glow={false} />
                </group>
              ))}
              <Anim show={isTamper && i === selected} speed={8}>
                <Box size={[SIZE + 0.5, 0.08, SIZE + 0.5]} position={[0, 0.04, 0]} color="actor" glow radius={0.03} />
              </Anim>
              <Label position={[0, SIZE + 0.95, 0]} show={!isUses} tone={tone}>
                {i === 0 ? labels.genesis : `${labels.block} ${i + 1}`}
                {b.edited && ` · ${labels.edited}`}
                {bad && !b.edited && ` · ${labels.broken}`}
                {b.redone && !bad && !b.edited && ` · ${labels.redone}`}
              </Label>
              <Label position={[0, -0.55, 1.1]} show={showHashes} minLevel="intermediate" maxLevel="intermediate" tone="mono">
                {labels.prev} {i === 0 ? '0000…' : shortHash(b.storedPrev, 4, 0)}
                <br />
                {labels.hash} {shortHash(b.hash, 4, 0)}
              </Label>
              <Label position={[0, -0.75, 1.1]} show={showHashes} minLevel="expert" tone="mono">
                prevHash {i === 0 ? '0x0000…' : `0x${shortHash(b.storedPrev, 6, 0)}`}
                <br />
                data "{clip(b.data, 16)}"
                <br />
                hash 0x{shortHash(b.hash, 6, 0)}
              </Label>
            </Anim>
          );
        })}
        {XS.slice(1).map((x, i) => (
          <Anim key={x} show={linked} speed={5}>
            <ChainLink from={[XS[i] + SIZE / 2, SIZE * 0.5, 0]} to={[x - SIZE / 2, SIZE * 0.5, 0]} broken={!chain[i + 1].linkOk} />
          </Anim>
        ))}
        <Label position={[3.7, -0.6, 5.8]} show={isFingerprint} minLevel="expert" tone="mono">
          hash = SHA-256(index ‖ prevHash ‖ data)
        </Label>

        {/* Step 4: what is still wrong after the edit, and what a full repair changed. */}
        <Label position={[-3.5, 1.5, -6.3]} show={isTamper && (broken >= 0 || anyRedone)} tone={broken >= 0 ? 'invalid' : 'valid'}>
          {broken >= 0 ? `${left} ${left === 1 ? labels.toRedoOne : labels.toRedo}` : labels.repaired}
          {detail && tip !== cleanTip && (
            <>
              <br />
              {labels.tipWas} {shortHash(cleanTip, 6, 0)}
              <br />
              {labels.tipNow} {shortHash(tip, 6, 0)}
            </>
          )}
        </Label>
      </Anim>

      {/* Step 3: type anything and watch its fingerprint. */}
      <Anim show={isFingerprint} position={BENCH}>
        <Platform size={[8.8, 1.9]} position={[0.2, 0, 0]} color="ground" height={0.25} />
        <group position={[-3.3, 0, 0]}>
          <Sheet scale={0.52} />
        </group>
        <FlowLine points={[[-2.75, 0.3, 0], [-2.3, 0.3, 0]]} color="chain" />
        <Skyline hash={hash} prev={prevHash} />
        <Label position={[-3.3, 0.95, 0]} tone="tx">
          "{clip(text, 14)}"
        </Label>
        <Label position={[1.4, 2.1, 0]} tone="mono">
          {labels.fingerprint} {shortHash(hash, 8, 4)}
        </Label>
        <Label position={[3.6, 0.2, -1.5]} show={prevHash !== null && prevHash !== hash} tone="tx">
          {hexDiff(hash, prevHash ?? hash)}/64 {labels.changedShort}
          {detail && (
            <>
              <br />
              {bitDiff(hash, prevHash ?? hash)}/256 bit
            </>
          )}
        </Label>
      </Anim>

      {/* Step 5: the honest chain buries the payment while the attacker rebuilds in secret. */}
      <Anim show={isHistory}>
        <group position={[HONEST_X, 0, RACE_Z0]} rotation={ALONG_Z}>
          <Platform size={[11.6, 2]} position={[4.95, 0, 0]} color="ground" height={0.25} />
          <Block color="block" size={SIZE} />
          {[-0.3, 0, 0.3].map((dx) => (
            <group key={dx} position={[dx, SIZE, 0.25]}>
              <Packet size={0.2} glow={dx === 0} />
            </group>
          ))}
          <RaceRow count={depth} partial={0} color="valid" rate={1.5 + (1 - share) * 4} />
        </group>
        <group position={[ATTACK_X, 0, RACE_Z0]} rotation={ALONG_Z}>
          <Platform size={[11.6, 2]} position={[4.95, 0, 0]} color="ground" height={0.25} />
          <Block color="tx" size={SIZE} glow />
          <RaceRow count={whole} partial={partial} color="invalid" rate={1.5 + share * 4} />
        </group>
        <Label position={[HONEST_X, 0.2, RACE_Z0 + 1.4]} tone="valid">
          {labels.honest} · {percent(num((1 - share) * 100, 0, lang), lang)}
        </Label>
        <Label position={[HONEST_X, SMALL + 0.9, raceZ(depth - 1)]} tone="valid">
          +{depth} {depth === 1 ? labels.blockOnTop : labels.blocksOnTop}
        </Label>
        <Label position={[ATTACK_X, 0.2, RACE_Z0 + 1.4]} tone="invalid">
          {labels.attacker} · {percent(num(share * 100, 0, lang), lang)}
        </Label>
        <Label position={[ATTACK_X + 1.5, 0.3, attackTip - 0.2]} tone="invalid">
          ≈ {num(lambda, 1, lang)} {labels.blocksMade}
        </Label>
        <Label position={[5.2, 0.3, -0.6]} tone="mono" minLevel="expert">
          λ = z·q/p = {num(lambda, 2, lang)}
          <br />P {chance(probability, lang).startsWith('<') ? '' : '= '}
          {chance(probability, lang)}
        </Label>
      </Anim>

      {/* Step 6: the same chain can carry very different records. */}
      {USES.map((id) => {
        const pos = USE_POS[id];
        const on = id === use;
        const land = Math.min(Math.max(pos[0], XS[0] * CHAIN_SMALL), XS[3] * CHAIN_SMALL);
        return (
          <Anim key={id} show={isUses} speed={5}>
            <group position={pos}>
              <Cyl radius={0.95} height={0.14} position={[0, -0.05, 0]} color={on ? 'tx' : 'ground'} glow={on} />
              <Anim scale={on ? 1.05 : 0.8} position={[0, 0.02, 0]} speed={8}>
                <UseModel id={id} glow={on} />
              </Anim>
              <Label position={[0, 2.05, 0]} show={on} tone="tx">
                {labels[`use_${id}`]}
                <br />
                {labels[`ex_${id}`]}
              </Label>
            </group>
            <FlowLine points={[[pos[0], 0.06, pos[2] + 1.05], [pos[0], 0.06, -1.25]]} color={on ? 'tx' : 'chain'} dashed={!on} />
            <Anim show={on}>
              <Mover path={[[pos[0], 1.4, pos[2]], [land, SIZE * CHAIN_SMALL + 0.2, 0]]} duration={1.8} arc={0.9} playing={isUses && on}>
                <Packet size={0.34} />
              </Mover>
            </Anim>
          </Anim>
        );
      })}
      <Label position={[USE_POS.payments[0], 3.5, USE_POS.payments[2]]} show={isUses} tone="valid">
        {labels.coursePath}
      </Label>
      <Label position={[XS[0] * CHAIN_SMALL - 0.6, -0.3, 1.3]} show={isUses} tone="block">
        {labels.oneChain}
      </Label>
    </>
  );
}

/** The full 64-character hash on two lines; characters that changed since the last edit stand out. */
function HashText({ hash, prev }: { hash: string; prev: string | null }) {
  const line = (from: number) =>
    hash
      .slice(from, from + 32)
      .split('')
      .map((ch, i) => {
        const changed = prev !== null && prev[from + i] !== ch;
        return (
          <span key={i} style={changed ? { color: 'var(--accent)' } : { opacity: prev === null ? 1 : 0.45 }}>
            {ch}
          </span>
        );
      });
  return (
    <strong style={{ fontSize: '0.78rem', lineHeight: 1.3, letterSpacing: 0 }}>
      {line(0)}
      <br />
      {line(32)}
    </strong>
  );
}

function FingerprintControls({ labels }: SceneProps) {
  const typed = useChain((s) => s.text);
  const prevText = useChain((s) => s.prevText);
  const setText = useChain((s) => s.setText);
  const text = typed ?? labels.sampleText;
  const hash = sha256(text);
  const prev = prevText === null ? null : sha256(prevText);
  const same = prev === null || prev === hash;
  return (
    <div className="ctl" style={{ gap: '6px 14px', maxWidth: 420 }}>
      <label className="ctl-field">
        <span>{labels.typePrompt}</span>
        <input type="text" value={text} maxLength={MAX_TEXT} onChange={(e) => setText(e.target.value, text)} spellCheck={false} autoComplete="off" />
      </label>
      <div className="ctl-stats">
        <div className="ctl-stat">
          <span>{labels.changed}</span>
          <strong>{same ? '–' : `${hexDiff(hash, prev ?? hash)} / 64`}</strong>
        </div>
      </div>
      <div className="ctl-stat" style={{ flexBasis: '100%' }}>
        <span>{labels.fullHash}</span>
        <HashText hash={hash} prev={prev} />
      </div>
    </div>
  );
}

function TamperControls({ labels }: SceneProps) {
  const data = useChain((s) => s.data);
  const redone = useChain((s) => s.redone);
  const selected = useChain((s) => s.selected);
  const setData = useChain((s) => s.setData);
  const select = useChain((s) => s.select);
  const redoNext = useChain((s) => s.redoNext);
  const reset = useChain((s) => s.reset);
  const chain = computeChain(data, redone);
  const broken = firstBroken(chain);
  const untouched = data.every((d, i) => d === ORIGINAL[i]);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 8px', maxWidth: 540 }}>
      {/* The four original controls keep the .ctl class; `contents` lets the Redo button share their rows. */}
      <div className="ctl" style={{ display: 'contents' }}>
        <div className="ctl-field" style={{ flex: 'none', minWidth: 0 }}>
          <span id="pick-block">{labels.pickBlock}</span>
          <div className="seg" role="group" aria-labelledby="pick-block">
            {ORIGINAL.map((_, i) => (
              <button key={i} type="button" aria-pressed={i === selected} onClick={() => select(i)}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
        <label className="ctl-field">
          <span>{fill(labels.editPrompt, selected + 1)}</span>
          <input type="text" value={data[selected]} maxLength={32} onChange={(e) => setData(selected, e.target.value)} spellCheck={false} autoComplete="off" />
        </label>
        <div className="ctl-stat">
          <span>{fill(labels.hashOf, selected + 1)}</span>
          <strong>{shortHash(chain[selected].hash, 6, 4)}</strong>
        </div>
        <button type="button" className="btn" onClick={reset} disabled={untouched}>
          {labels.reset}
        </button>
      </div>
      <button type="button" className="btn btn-primary" style={{ minHeight: 38, padding: '0 10px', fontSize: '0.9rem' }} onClick={redoNext} disabled={broken < 0}>
        {broken >= 0 ? fill(labels.redoBlock, broken + 1) : labels.nothingToRedo}
      </button>
    </div>
  );
}

function HistoryControls({ labels, lang, level }: SceneProps) {
  const share = useChain((s) => s.share);
  const depth = useChain((s) => s.depth);
  const setShare = useChain((s) => s.setShare);
  const setDepth = useChain((s) => s.setDepth);
  const p = catchUpProbability(share, depth);
  const row = { display: 'flex', alignItems: 'center', gap: 10, flexBasis: '100%' } as const;
  const name = { whiteSpace: 'nowrap', minWidth: '11.5em' } as const;
  return (
    <div className="ctl" style={{ gap: '2px 14px', maxWidth: 520 }}>
      <label className="ctl-field" style={row}>
        <span style={name}>
          {labels.shareLabel}: {percent(num(share * 100, 0, lang), lang)}
        </span>
        <input id="attacker-share" type="range" min={MIN_SHARE * 100} max={MAX_SHARE * 100} step={1} value={Math.round(share * 100)} onChange={(e) => setShare(Number(e.target.value) / 100)} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <label className="ctl-field" style={row}>
        <span style={name}>
          {labels.depthLabel}: {depth}
        </span>
        <input id="block-depth" type="range" min={MIN_DEPTH} max={MAX_DEPTH} step={1} value={depth} onChange={(e) => setDepth(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <div className="ctl-stats">
        <div className="ctl-stat">
          <span>{labels.catchUp}</span>
          <strong data-tone={p < 0.001 ? 'good' : p >= 0.1 ? 'bad' : undefined}>{chance(p, lang)}</strong>
        </div>
        {level !== 'beginner' && (
          <div className="ctl-stat">
            <span>{labels.fromBehind}</span>
            <strong>{chance(catchUpFromBehind(share, depth), lang)}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

function UsesControls({ labels }: SceneProps) {
  const use = useChain((s) => s.use);
  const setUse = useChain((s) => s.setUse);
  return (
    <div className="ctl" style={{ gap: '4px 12px', maxWidth: 460 }}>
      <div className="seg" role="group" aria-label={labels.usePrompt} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', flexBasis: '100%' }}>
        {USES.map((id) => (
          <button key={id} type="button" aria-pressed={id === use} onClick={() => setUse(id)} style={{ padding: '0 6px' }}>
            {labels[`use_${id}`]}
          </button>
        ))}
      </div>
      <div className="ctl-stat" style={{ flexBasis: '100%' }}>
        <strong style={{ font: 'inherit', fontWeight: 600, color: 'var(--ink)' }}>{labels[`why_${use}`]}</strong>
      </div>
    </div>
  );
}

export function Controls(props: SceneProps) {
  switch (props.stepId) {
    case 'fingerprint':
      return <FingerprintControls {...props} />;
    case 'tamper':
      return <TamperControls {...props} />;
    case 'history':
      return <HistoryControls {...props} />;
    case 'uses':
      return <UsesControls {...props} />;
    default:
      return null;
  }
}
