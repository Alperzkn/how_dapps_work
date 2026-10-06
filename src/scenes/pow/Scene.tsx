import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Group } from 'three';
import { Anim, Ball, Block, Box, ChainLink, CoinStack, Cyl, FlowLine, Label, MinerRig, Mover, Packet, Platform, ShadowGround, useLoop, useScene, type Vec3 } from '../../scene/kit';
import type { SceneProps } from '../../scene/types';
import { expectedAttempts } from '../../sim/pow';
import { MAX_ZEROS, MIN_ZEROS, useMining } from './state';

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
const SHARES = ['25%', '45%', '30%'];
const NAMES = ['A', 'B', 'C'];

const GAUGE_H = 3.2;
/** Height of the "valid" zone on the gauge. A picture of the idea, not to scale: the real zone shrinks 16x per zero. */
const zoneHeight = (zeros: number) => 1.5 * 0.62 ** (zeros - 1);

const fmt = (n: number, lang: string) => (Number.isFinite(n) ? Math.round(n).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US') : '0');

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

/** The newest block arriving, again and again. */
function Pulse({ rate, enabled, children }: { rate: number; enabled: boolean; children: ReactNode }) {
  const ref = useRef<Group>(null);
  useLoop((t) => {
    if (ref.current) ref.current.position.y = Math.max(0, Math.sin(t * rate)) * 0.6;
  }, enabled);
  return <group ref={ref}>{children}</group>;
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

/** Blocks on a timeline whose spacing shows how quickly blocks are being found. */
function Retarget({ active, labels, reducedMotion }: { active: boolean; labels: Record<string, string>; reducedMotion: boolean }) {
  const [phase, setPhase] = useState(reducedMotion ? 2 : 0);
  const phaseRef = useRef(phase);
  const t0 = useRef<number | null>(null);
  useEffect(() => {
    if (!active) t0.current = null;
  }, [active]);
  useLoop((t) => {
    t0.current ??= t;
    const next = Math.floor((t - t0.current) / 3.4) % 3;
    if (next !== phaseRef.current) {
      phaseRef.current = next;
      setPhase(next);
    }
  }, active);
  const crowded = phase >= 1;
  const gap = phase === 1 ? 0.95 : 2.1;
  const level = phase === 2 ? 2.5 : 1;
  const BAR: Vec3 = [6.2, 0, 0.4];
  return (
    <>
      <Platform size={[10.4, 2]} position={[0, 0, 1.6]} color="ground" height={0.25} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Anim key={i} position={[(i - 2) * gap, 0, 1.6]} speed={3.5}>
          <Block size={0.85} color={i === 4 ? 'valid' : 'block'} glow={i === 4} />
        </Anim>
      ))}
      <Label position={[0, 1.75, 1.6]} tone={phase === 1 ? 'invalid' : 'valid'} maxLevel="beginner">
        {phase === 1 ? labels.tooFast : labels.steady}
      </Label>
      <Label position={[0, 1.75, 1.6]} tone={phase === 1 ? 'invalid' : 'valid'} minLevel="intermediate">
        {phase === 1 ? labels.paceFast : labels.paceOk}
      </Label>

      <Platform size={[10.4, 2.2]} position={[-0.4, 0, -2.4]} color="ground" height={0.25} />
      {[-4.6, -2.5, -0.4, 1.7, 3.8].map((x, i) => (
        <Anim key={x} position={[x, 0, -2.4]} show={i < 2 || crowded} speed={5}>
          <MinerRig active={active} glow={i >= 2} />
        </Anim>
      ))}
      <Label position={[-0.4, 2, -2.4]} tone="actor" maxLevel="beginner">
        {crowded ? labels.moreMiners : labels.fewMiners}
      </Label>
      <Label position={[-0.4, 2, -2.4]} tone="actor" minLevel="intermediate">
        {crowded ? labels.hashrateUp : labels.hashrateBase}
      </Label>

      <group position={BAR}>
        <Box size={[1.3, 0.16, 1.3]} position={[0, 0.08, 0]} color="platform" radius={0.05} />
        <Anim position={[0, 0.16, 0]} scale={[1, level, 1]} speed={3}>
          <Box size={[0.9, 1.1, 0.9]} position={[0, 0.55, 0]} color="contract" glow={phase === 2} radius={0.05} />
        </Anim>
        <Label position={[0, 0.16 + 1.1 * level + 0.75, 0]} maxLevel="beginner">
          {phase === 2 ? labels.harder : labels.difficulty}
        </Label>
        <Label position={[0, 0.16 + 1.1 * level + 0.75, 0]} minLevel="intermediate">
          {phase === 2 ? labels.difficultyUp : labels.difficultyBase}
        </Label>
      </group>
      <Label position={[3.4, -0.4, 4.6]} tone="mono" minLevel="expert">
        target′ = target × T / 1 209 600 s
        <br />T ∈ [3.5 d, 8 w] → ×¼ … ×4
      </Label>
    </>
  );
}

export default function Scene({ stepId, labels, lang, reducedMotion }: SceneProps) {
  const status = useMining((s) => s.status);
  const isWho = stepId === 'who';
  const isPuzzle = stepId === 'puzzle';
  const isRace = stepId === 'race';
  const isCast = stepId === 'broadcast';
  const isRetarget = stepId === 'retarget';
  const isAttack = stepId === 'attack';
  const main = isWho || isPuzzle || isRace || isCast;
  const interactive = isPuzzle || isRace;
  const found = interactive && status === 'found';
  const mining = status === 'mining';
  // On a phone the controls cover the lower part of the canvas, so the scene moves up and shrinks a little.
  const { compact } = useScene();
  const lift = compact && isPuzzle ? 2.1 : compact && isRace ? 3.6 : 0;
  const fit = compact && isPuzzle ? 0.95 : compact && isRace ? 0.9 : 1;

  return (
    <Anim position={[0, lift, 0]} scale={fit} speed={5}>
      <ShadowGround />

      {/* The chain so far, with an empty place for the next block. */}
      <Anim show={main && !isPuzzle}>
        <Platform size={[10.4, 2.6]} position={[-1.4, 0, CHAIN_Z]} color="ground" height={0.25} />
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
          <Label position={[0, BS + 0.8, 0]} show={isRace} tone="plain">
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
        const won = you && (isCast || found);
        const candAt: Vec3 = you && isCast ? SLOT : you && isPuzzle ? [0.2, 0, 0.3] : [m[0] + CAND[0], 0, m[2] + CAND[2]];
        const candScale = you && isCast ? 1 : you && isPuzzle ? 1.05 : 0.7;
        return (
          <group key={i}>
            <Anim position={m} show={shown} speed={5}>
              <MinerRig active={shown && (isRace || isCast || (isPuzzle && mining))} glow={won} />
              <Anim show={you && isCast} position={[0.2, 0.98, 0]}>
                <CoinStack count={4} radius={0.26} glow />
              </Anim>
              <Label position={[0, 1.75, 0.4]} show={isWho || isRace} tone="actor" maxLevel="beginner">
                {you && isRace ? labels.you : `${labels.miner} ${NAMES[i]}`}
              </Label>
              <Label position={[0, 1.75, 0.4]} show={isWho || isRace} tone="actor" minLevel="intermediate">
                {you && isRace ? labels.you : `${labels.miner} ${NAMES[i]}`}
                {isRace && ` · ${SHARES[i]}`}
              </Label>
              <Label position={[0, 1.75, 0.4]} show={you && isPuzzle} tone="actor">
                {labels.miner}
              </Label>
              <Label position={[0.8, -0.6, 1.2]} show={you && isPuzzle} minLevel="expert" tone="mono">
                SHA256d(version ‖ prev ‖ merkle
                <br />‖ time ‖ bits ‖ nonce)
              </Label>
              <Label position={[0, 2.2, 0]} show={you && isCast} tone="tx" maxLevel="beginner">
                {labels.reward}
              </Label>
              <Label position={[0, 2.2, 0]} show={you && isCast} tone="tx" minLevel="intermediate">
                {labels.rewardAmount}
              </Label>
              <Label position={[0, -0.45, 1.3]} show={!you && isCast} tone="plain">
                {labels.startOver}
              </Label>
            </Anim>

            <Anim position={candAt} scale={candScale} show={shown && (you || !isCast)} speed={you ? 4 : 6}>
              <Block size={BS} color={won ? 'valid' : 'neutral'} glow={won} />
              <Anim show={!isCast} position={[0, BS + 0.5, 0]}>
                <Counter spin={shown && !won && (isRace || (isPuzzle && mining))} rate={0.6 + i * 0.5} />
              </Anim>
              {you && interactive && (
                <Readout position={[0, BS + (isPuzzle ? 1.55 : 1.9), 0]} labels={labels} lang={lang} idleText={isPuzzle ? labels.pressMine : labels.yourBlock} />
              )}
              <Label position={[0, BS + 0.75, 0]} show={you && isCast} tone="valid">
                {labels.newBlock}
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

      {/* Step 4: the winner sends the finished block to everyone. */}
      {isCast &&
        MINERS.filter((_, i) => i !== YOU).map((m, i) => (
          <group key={i}>
            <FlowLine points={[[SLOT[0], BS + 0.3, SLOT[2]], [(SLOT[0] + m[0]) / 2, 2.6, (SLOT[2] + m[2]) / 2], [m[0], 1.2, m[2]]]} color="valid" dashed curved />
            <Mover path={[[SLOT[0], BS + 0.3, SLOT[2]], [(SLOT[0] + m[0]) / 2, 2.6, (SLOT[2] + m[2]) / 2], [m[0], 1.2, m[2]]]} duration={1.6} delay={0.5 + i * 0.3}>
              <Packet color="valid" size={0.34} />
            </Mover>
          </group>
        ))}
      <Label position={[1.6, 0, 5.2]} show={isCast} minLevel="expert" tone="mono">
        inv → getdata → block · {labels.verifyOnce}
      </Label>

      {/* Step 5: difficulty follows the hashrate. */}
      <Anim show={isRetarget}>
        <Retarget active={isRetarget} labels={labels} reducedMotion={reducedMotion} />
      </Anim>

      {/* Step 6: an attacker's private fork against the rest of the network. */}
      <Anim show={isAttack}>
        <Platform size={[11.6, 2.4]} position={[-0.5, 0, -2]} color="ground" height={0.25} />
        {[-5, -2.8, -0.6, 1.6].map((x, i) => (
          <group key={x}>
            <group position={[x, 0, -2]}>
              <Block size={BS} color={i === 0 ? 'neutral' : 'block'} />
            </group>
            {i > 0 && <ChainLink from={[x - 2.2 + BS / 2, BS / 2, -2]} to={[x - BS / 2, BS / 2, -2]} />}
          </group>
        ))}
        <ChainLink from={[1.6 + BS / 2, BS / 2, -2]} to={[3.8 - BS / 2, BS / 2, -2]} />
        <group position={[3.8, 0, -2]}>
          <Pulse rate={3.2} enabled={isAttack}>
            <Block size={BS} color="valid" glow />
          </Pulse>
        </group>
        <Label position={[3.8, BS + 1.6, -2]} tone="valid">
          {labels.honestChain}
        </Label>
        {[-3.4, -0.9, 1.6].map((x) => (
          <group key={x} position={[x, 0, -5.8]}>
            <MinerRig active={isAttack} />
          </group>
        ))}
        <Label position={[-0.9, 1.8, -5.8]} tone="actor" maxLevel="beginner">
          {labels.everyoneElse}
        </Label>
        <Label position={[-0.9, 1.8, -5.8]} tone="actor" minLevel="intermediate">
          {labels.honestShare}
        </Label>

        <Platform size={[7.2, 2.4]} position={[-0.6, 0, 2.8]} color="ground" height={0.25} />
        <ChainLink from={[-5 + BS / 2 - 0.1, BS / 2, -2 + BS / 2]} to={[-2.8 - BS / 2, BS / 2, 2.8 - BS / 4]} color="invalid" />
        {[-2.8, -0.6].map((x, i) => (
          <group key={x}>
            <group position={[x, 0, 2.8]}>
              <Block size={BS} color="invalid" />
            </group>
            {i > 0 && <ChainLink from={[x - 2.2 + BS / 2, BS / 2, 2.8]} to={[x - BS / 2, BS / 2, 2.8]} color="invalid" />}
          </group>
        ))}
        <group position={[1.6, 0, 2.8]}>
          <Pulse rate={1.3} enabled={isAttack}>
            <Block size={BS} color="invalid" glow />
          </Pulse>
        </group>
        <Label position={[-4.6, 0.5, 3.2]} tone="invalid">
          {labels.attackerChain}
        </Label>
        <group position={[-0.6, 0, 6.4]}>
          <MinerRig active={isAttack} color="invalid" glow />
          <group position={[1.7, 0, 0]}>
            <CoinStack count={6} radius={0.3} />
          </group>
        </group>
        {isAttack && (
          <Mover path={[[1.1, 0.9, 6.4], [2.8, 0.4, 7.4]]} duration={1.1} arc={0.9}>
            <Cyl radius={0.3} height={0.11} color="tx" />
          </Mover>
        )}
        <Label position={[-0.6, 1.8, 6.6]} tone="invalid" maxLevel="beginner">
          {labels.attacker}
        </Label>
        <Label position={[-0.6, 1.8, 6.6]} tone="invalid" minLevel="intermediate">
          {labels.attackerShare}
        </Label>
        <Label position={[2.6, 1.3, 7.4]} tone="tx">
          {labels.cost}
        </Label>
        <Label position={[4.4, 0.2, 4.4]} minLevel="expert" tone="mono">
          P(catch up from z) = (q/p)^z
        </Label>
      </Anim>
    </Anim>
  );
}

const srOnly = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' } as const;

export function Controls({ stepId, labels, lang }: SceneProps) {
  const { zeros, status, attempts, nonce, hash, elapsedMs, setZeros, start, stop, reset } = useMining();
  const active = stepId === 'puzzle' || stepId === 'race';
  useEffect(() => {
    if (!active) useMining.getState().stop();
  }, [active]);
  useEffect(() => () => useMining.getState().stop(), []);
  if (!active) return null;

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
