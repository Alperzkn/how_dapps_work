import { useEffect, useRef, useState } from 'react';
import type { Group } from 'three';
import { Anim, Ball, Block, Box, ChainLink, Cyl, FlowLine, Label, Mat, MinerRig, Mover, Person, Platform, ShadowGround, ValidatorPillar, useLoop, type Vec3 } from '../../scene/kit';
import type { ColorKey } from '../../theme/tokens';
import type { SceneProps } from '../../scene/types';

const VZ = -2.5;
const V: Vec3[] = Array.from({ length: 7 }, (_, i) => [-6 + 2 * i, 0, VZ]);
const PROPOSER = 3;
const SLASHED = 5;
const TOP = 1.75;

const BS = 1.1;
const CZ = 2.5;
const CX = [-5, -3, -1, 1, 3, 5];
const NEW = 2;

/** Order in which the spotlight tries validators before it settles. */
const SWEEP = [0, 4, 1, 6, 2, 5, 0, 3, 6, 1];

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

/** A column that fills with the stake that has voted, with a mark at two thirds. */
function Meter({ active }: { active: boolean }) {
  const fill = useRef<Group>(null);
  const H = 2.4;
  useLoop((t) => {
    if (fill.current) fill.current.scale.y = Math.max(0.02, Math.min(0.86, ((t % 5) / 3.2) * 0.86));
  }, active);
  return (
    <group>
      <Box size={[0.9, 0.14, 0.9]} position={[0, 0.07, 0]} color="platform" radius={0.04} />
      <Box size={[0.4, H, 0.4]} position={[0, 0.14 + H / 2, 0]} color="neutral" radius={0.06} />
      <group ref={fill} position={[0, 0.14, 0]} scale={[1, 0.8, 1]}>
        <Box size={[0.5, H, 0.5]} position={[0, H / 2, 0]} color="valid" glow radius={0.04} />
      </group>
      <Box size={[0.8, 0.06, 0.8]} position={[0, 0.14 + (H * 2) / 3, 0]} color="ink" radius={0.02} />
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

export default function Scene({ stepId, labels, reducedMotion }: SceneProps) {
  const isStake = stepId === 'stake';
  const isProposer = stepId === 'proposer';
  const isAttest = stepId === 'attest';
  const isFinal = stepId === 'finality';
  const isSlash = stepId === 'slashing';
  const isCompare = stepId === 'compare';
  const chain = isProposer || isAttest || isFinal || isSlash;

  // Step 2: the spotlight hops between validators, then rests on the chosen proposer.
  const [settled, setSettled] = useState(true);
  const settledRef = useRef(true);
  const spot = useRef<Group>(null);
  const t0 = useRef<number | null>(null);
  useEffect(() => {
    t0.current = null;
    if (!isProposer || reducedMotion) {
      settledRef.current = true;
      setSettled(true);
    }
  }, [isProposer, reducedMotion]);
  useLoop((t, dt) => {
    t0.current ??= t;
    const local = (t - t0.current) % 8;
    const sweeping = local < 2.6;
    const idx = sweeping ? SWEEP[Math.floor(local / 0.26) % SWEEP.length] : PROPOSER;
    if (spot.current) spot.current.position.x += (V[idx][0] - spot.current.position.x) * Math.min(1, dt * 18);
    if (settledRef.current === sweeping) {
      settledRef.current = !sweeping;
      setSettled(!sweeping);
    }
  }, isProposer);

  const chosen = (isProposer && settled) || isAttest;
  const blockShown = (b: number) => (isFinal ? true : b < NEW ? chain : b === NEW ? (isProposer ? settled : isAttest || isSlash) : false);
  const newAt: Vec3 = isProposer ? [V[PROPOSER][0], 0, -0.4] : [CX[NEW], 0, CZ];
  const voters = V.map((_, i) => i).filter((i) => i !== PROPOSER);
  const blockTop: Vec3 = [CX[NEW], BS + 0.25, CZ];
  const slashedAt: Vec3 = [V[SLASHED][0], 0, -0.3];
  const FORK_A: Vec3 = [1.5, 0, 0.9];
  const FORK_B: Vec3 = [1.5, 0, 4.1];
  const PIT: Vec3 = [6.6, 0, 0.8];

  return (
    <>
      <ShadowGround />

      {/* The validators: pillars holding their stake. */}
      <Anim show={!isCompare}>
        <Platform size={[14.4, 2.2]} position={[0, 0, VZ]} color="ground" height={0.25} />
      </Anim>
      {V.map((p, i) => {
        const slashed = isSlash && i === SLASHED;
        return (
          <Anim key={i} position={slashed ? slashedAt : p} show={!isCompare} speed={4}>
            <ValidatorPillar stake={slashed ? 1 : 3} color={slashed ? 'invalid' : 'actor'} glow={slashed || (chosen && i === PROPOSER)} />
          </Anim>
        );
      })}

      {/* Step 1: people lock up coins; the mining machine is not needed. */}
      <Anim show={isStake}>
        {[1, 3, 5].map((i, k) => (
          <group key={i}>
            <group position={[V[i][0], 0, 0.2]} rotation={[0, Math.PI, 0]}>
              <Person />
            </group>
            {isStake && (
              <Mover path={arc([V[i][0], 1.3, 0.2], [V[i][0], TOP + 0.1, VZ], 1)} duration={1.5} delay={k * 0.5}>
                <Cyl radius={0.26} height={0.1} color="tx" glow />
              </Mover>
            )}
          </group>
        ))}
        <Label position={[V[3][0], 0.1, 1.4]} maxLevel="beginner" tone="tx">
          {labels.deposit}
        </Label>
        <Label position={[V[3][0], 0.1, 1.4]} minLevel="intermediate" tone="tx">
          {labels.depositAmount}
        </Label>
        <Label position={[V[0][0], TOP + 0.95, VZ]} tone="actor">
          {labels.validator}
        </Label>
        <Label position={[V[4][0], TOP + 1.7, VZ]} minLevel="expert" tone="mono">
          effective_balance: 32 … 2048 ETH
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

      {/* Step 2: the spotlight. */}
      <Anim show={isProposer} position={[0, 0, VZ]}>
        <group ref={spot} position={[V[PROPOSER][0], 0, 0]}>
          <Spotlight />
        </group>
      </Anim>
      <Label position={[V[PROPOSER][0] + 1.6, 5.2, VZ]} show={isProposer} maxLevel="beginner" tone="actor">
        {settled ? labels.chosen : labels.choosing}
      </Label>
      <Label position={[V[PROPOSER][0] + 1.6, 5.2, VZ]} show={isProposer} minLevel="intermediate" tone="actor">
        {settled ? labels.slotProposer : labels.choosing}
      </Label>
      <Label position={[4.6, 0, 1.6]} show={isProposer} minLevel="expert" tone="mono">
        RANDAO mix → proposer
        <br />P ∝ effective_balance
      </Label>

      {/* The chain. */}
      <Anim show={chain}>
        <Platform size={[isFinal ? 12.4 : 8.6, 2]} position={[isFinal ? 0 : -1.9, 0, CZ]} color="ground" height={0.25} />
      </Anim>
      {CX.map((x, b) => (
        <group key={b}>
          <Anim position={b === NEW ? newAt : [x, 0, CZ]} show={blockShown(b)} speed={b === NEW ? 3.5 : 5 + b}>
            <Block size={BS} color="block" glow={b === NEW && (isProposer || isAttest)} />
            <Label position={[0, BS + 0.75, 0]} show={b === NEW && isProposer} tone="block">
              {labels.newBlock}
            </Label>
            <Anim show={isFinal && b % 2 === 0} position={[0, BS, 0]}>
              <Flag color={b === 0 ? 'valid' : b === 2 ? 'block' : 'neutral'} />
            </Anim>
            <Anim show={isFinal && b === 1} position={[0, BS, 0]}>
              <Padlock />
            </Anim>
          </Anim>
          {b > 0 && (
            <Anim show={blockShown(b) && blockShown(b - 1) && !(b === NEW && isProposer)}>
              <ChainLink from={[CX[b - 1] + BS / 2, BS / 2, CZ]} to={[x - BS / 2, BS / 2, CZ]} />
            </Anim>
          )}
        </group>
      ))}

      {/* Step 3: every other validator votes for the block. */}
      {isAttest &&
        voters.map((i, k) => (
          <Mover key={i} path={arc([V[i][0], TOP, VZ], blockTop, 1.1)} duration={1.5} delay={k * 0.28}>
            <Tick />
          </Mover>
        ))}
      <Label position={[CX[NEW], BS + 1.2, CZ]} show={isAttest} maxLevel="beginner" tone="valid">
        {labels.votes}
      </Label>
      <Label position={[CX[NEW], BS + 1.2, CZ]} show={isAttest} minLevel="intermediate" maxLevel="intermediate" tone="valid">
        {labels.attestations}
      </Label>
      <Label position={[CX[NEW], BS + 1.2, CZ]} show={isAttest} minLevel="expert" tone="valid">
        {labels.attestations}
      </Label>
      <Label position={[4.2, 0, 1.8]} show={isAttest} minLevel="expert" tone="mono">
        head: beacon_block_root
        <br />
        FFG: source → target
      </Label>
      <Label position={[V[PROPOSER][0], TOP + 0.95, VZ]} show={isAttest} tone="actor">
        {labels.proposer}
      </Label>
      <Label position={[V[6][0], TOP + 0.95, VZ]} show={isAttest} minLevel="intermediate" tone="actor">
        {labels.committee}
      </Label>

      {/* Step 4: epochs, checkpoints and the two-thirds mark. */}
      <Anim show={isFinal}>
        {[0, 1, 2].map((e) => (
          <group key={e}>
            <Platform size={[3.7, 0.7]} position={[-4 + e * 4, 0.02, CZ + 1.7]} color={e === 0 ? 'valid' : e === 1 ? 'block' : 'neutral'} height={0.2} />
            <Label position={[-3 + e * 4, -0.2, CZ + 2.3]} tone={e === 0 ? 'valid' : e === 1 ? 'block' : 'plain'} maxLevel="beginner">
              {e === 0 ? labels.finalized : e === 1 ? labels.justified : labels.voting}
            </Label>
            <Label position={[-3 + e * 4, -0.2, CZ + 2.3]} tone={e === 0 ? 'valid' : e === 1 ? 'block' : 'plain'} minLevel="intermediate">
              {labels.epoch} {10 + e} · {e === 0 ? labels.finalized : e === 1 ? labels.justified : labels.voting}
            </Label>
          </group>
        ))}
        <FlowLine points={arc([CX[0], BS + 1, CZ], [CX[2], BS + 1, CZ], 0.9)} color="valid" curved />
        <FlowLine points={arc([CX[2], BS + 1, CZ], [CX[4], BS + 1, CZ], 0.9)} color="valid" curved dashed />
        <group position={[7, 0, CZ]}>
          <Meter active={isFinal} />
          <Label position={[0, 3.2, 0]} tone="valid">
            {labels.twoThirds}
          </Label>
        </group>
        <Label position={[V[1][0], TOP + 1.5, VZ]} minLevel="expert" tone="mono">
          source → target · ≥ ⅔ {labels.ofStake}
        </Label>
      </Anim>
      {isFinal &&
        [0, 2, 4, 6].map((i, k) => (
          <Mover key={i} path={arc([V[i][0], TOP, VZ], [CX[4], BS + 1, CZ], 1.2)} duration={1.7} delay={k * 0.4}>
            <Tick />
          </Mover>
        ))}

      {/* Step 5: one validator signs two blocks for the same slot and is slashed. */}
      <Anim show={isSlash}>
        {[FORK_A, FORK_B].map((f, k) => (
          <group key={k}>
            <group position={f}>
              <Block size={BS} color="invalid" glow />
            </group>
            <ChainLink from={[CX[NEW] + BS / 2, BS / 2, CZ]} to={[f[0] - BS / 2, BS / 2, f[2]]} color="invalid" />
            <FlowLine points={[[slashedAt[0], 1.3, slashedAt[2]], [f[0] + 0.5, BS + 0.25, f[2]]]} color="invalid" dashed />
          </group>
        ))}
        <Label position={[FORK_B[0], -0.3, FORK_B[2] + 1]} tone="invalid" maxLevel="beginner">
          {labels.twoBlocks}
        </Label>
        <Label position={[FORK_B[0], -0.3, FORK_B[2] + 1]} tone="invalid" minLevel="intermediate">
          {labels.sameSlot}
        </Label>
        <group position={PIT}>
          <Cyl radius={0.8} height={0.12} position={[0, 0.06, 0]} color="ink" />
          <Label position={[0, 0.9, 0]} tone="tx">
            {labels.burned}
          </Label>
        </group>
        <Label position={[slashedAt[0], TOP + 0.6, slashedAt[2]]} tone="invalid" maxLevel="beginner">
          {labels.slashed}
        </Label>
        <Label position={[slashedAt[0], TOP + 0.6, slashedAt[2]]} tone="invalid" minLevel="intermediate">
          {labels.slashedEjected}
        </Label>
        <Label position={[V[1][0], TOP + 1.7, VZ]} minLevel="expert" tone="mono">
          double vote: t₁ = t₂
          <br />
          surround: s₁ &lt; s₂ &lt; t₂ &lt; t₁
        </Label>
      </Anim>
      {isSlash &&
        [0, 1].map((k) => (
          <Mover key={k} path={arc([slashedAt[0], TOP - 0.2, slashedAt[2]], [PIT[0], 0.2, PIT[2]], 1.2)} duration={1.4} delay={k * 0.7}>
            <Cyl radius={0.26} height={0.1} color="tx" glow />
          </Mover>
        ))}

      {/* Step 6: the two designs side by side. */}
      <Anim show={isCompare} position={[-2.3, 0, 2.3]}>
        <Platform size={[4, 4]} color="ground" height={0.25} />
        <group position={[-0.2, 0, 1.2]}>
          <MinerRig active={isCompare} />
        </group>
        <group position={[0.2, 0, -1]}>
          <Block size={BS} color="block" />
          <group position={[0, BS + 0.5, 0]}>
            <Counter spin={isCompare} />
          </group>
        </group>
        <group position={[-1.5, 0, -0.6]}>
          <Box size={[0.5, 1.2, 0.5]} position={[0, 0.6, 0]} color="chain" radius={0.06} />
          <Ball radius={0.1} position={[0, 1, 0.27]} color="invalid" glow />
        </group>
        <FlowLine points={[[-1.5, 0.4, -0.3], [-1.4, 0.15, 0.6], [-0.9, 0.3, 1.2]]} color="chain" curved arrow={false} width={4} />
        {isCompare && (
          <Mover path={arc([0.6, 1, 1.2], [1.6, 0.3, 2.2], 0.8)} duration={1.2}>
            <Cyl radius={0.24} height={0.1} color="tx" />
          </Mover>
        )}
        <Label position={[0, 3.3, 0]}>Proof of Work</Label>
        <Label position={[1.3, -0.6, 1.4]} tone="tx" maxLevel="beginner">
          {labels.powCost}
        </Label>
        <Label position={[1.3, -0.6, 1.4]} tone="tx" minLevel="intermediate" maxLevel="intermediate">
          {labels.powCostDetail.split(' · ')[0]}
          <br />
          {labels.powCostDetail.split(' · ')[1] ?? ''}
        </Label>
        <Label position={[1.3, -0.6, 1.4]} tone="mono" minLevel="expert">
          {labels.powExpert.split(' · ')[0]}
          <br />
          {labels.powExpert.split(' · ')[1] ?? ''}
        </Label>
      </Anim>
      <Anim show={isCompare} position={[2.3, 0, -2.3]}>
        <Platform size={[4, 4]} color="ground" height={0.25} />
        <group position={[-0.2, 0, 1.2]}>
          <ValidatorPillar stake={4} glow />
        </group>
        <group position={[0.2, 0, -1]}>
          <Block size={BS} color="block" />
          <group position={[0, BS, 0]}>
            <Padlock />
          </group>
        </group>
        {isCompare && (
          <Mover path={arc([-0.2, TOP, 1.2], [0.2, BS + 0.5, -1], 0.9)} duration={1.3}>
            <Tick />
          </Mover>
        )}
        <Label position={[0, 3.3, 0]}>Proof of Stake</Label>
        <Label position={[1.3, -0.6, 1.4]} tone="tx" maxLevel="beginner">
          {labels.posCost}
        </Label>
        <Label position={[1.3, -0.6, 1.4]} tone="tx" minLevel="intermediate" maxLevel="intermediate">
          {labels.posCostDetail.split(' · ')[0]}
          <br />
          {labels.posCostDetail.split(' · ')[1] ?? ''}
        </Label>
        <Label position={[1.3, -0.6, 1.4]} tone="mono" minLevel="expert">
          {labels.posExpert.split(' · ')[0]}
          <br />
          {labels.posExpert.split(' · ')[1] ?? ''}
        </Label>
      </Anim>
    </>
  );
}
