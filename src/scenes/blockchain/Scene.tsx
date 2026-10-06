import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import { Anim, Block, Box, ChainLink, FlowLine, Label, Packet, Person, Platform, ShadowGround, useLoop, type Vec3 } from '../../scene/kit';
import type { SceneProps } from '../../scene/types';
import { shortHash } from '../../sim/sha256';
import { computeChain, EDITABLE, ORIGINAL, useChain } from './state';

const XS = [-4.5, -1.5, 1.5, 4.5];
const SIZE = 1.4;
const ATTACK_Z = 5;
const ATTACK_X = 2;

const READERS: { pos: Vec3; rot: number }[] = [
  { pos: [-3.4, 0, 0.4], rot: Math.PI / 2 },
  { pos: [3.2, 0, -0.6], rot: -Math.PI / 2 },
  { pos: [0.2, 0, 3.6], rot: Math.PI },
];

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

/** The newest block keeps arriving on the honest chain while the attacker is still redoing old work. */
function Pulse({ children }: { children: React.ReactNode }) {
  const ref = useRef<Group>(null);
  useLoop((t) => {
    if (ref.current) ref.current.position.y = Math.max(0, Math.sin(t * 2.2)) * 0.5;
  });
  return <group ref={ref}>{children}</group>;
}

export default function Scene({ stepId, labels }: SceneProps) {
  const data = useChain((s) => s.data);
  const live = useMemo(() => computeChain(data), [data]);
  const clean = useMemo(() => computeChain(ORIGINAL), []);

  const isLedger = stepId === 'ledger';
  const isHistory = stepId === 'history';
  const linked = stepId === 'fingerprint' || stepId === 'tamper' || isHistory;
  // Only the tamper step shows the user's edit on the main chain.
  const chain = stepId === 'tamper' ? live : clean;
  const showHashes = stepId === 'fingerprint' || stepId === 'tamper';

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

      {/* Steps 2-5: the chain. */}
      <Anim show={!isLedger}>
        <Platform size={[12.4, 3]} position={[0, 0, 0]} color="ground" height={0.25} />
        {chain.map((b, i) => {
          const broken = !b.linked;
          const color = b.edited ? 'tx' : broken ? 'invalid' : 'block';
          return (
            <Anim key={i} position={[XS[i], 0, 0]} show={!isLedger} speed={4 + i}>
              <Block color={color} size={SIZE} glow={b.edited || broken} />
              {[-0.3, 0, 0.3].map((dx) => (
                <group key={dx} position={[dx, SIZE, 0.25]}>
                  <Packet size={0.2} glow={false} />
                </group>
              ))}
              <Label position={[0, SIZE + 0.95, 0]} show={!isHistory} tone={b.edited ? 'tx' : broken ? 'invalid' : 'default'}>
                {i === 0 ? labels.genesis : `${labels.block} ${i + 1}`}
                {b.edited && ` · ${labels.edited}`}
                {broken && !b.edited && ` · ${labels.broken}`}
              </Label>
              <Label position={[0, -0.55, 1.1]} show={showHashes} minLevel="intermediate" maxLevel="intermediate" tone="mono">
                {labels.prev} {i === 0 ? '0000…' : shortHash(b.storedPrev, 4, 0)}
                <br />
                {labels.hash} {shortHash(b.hash, 4, 0)}
              </Label>
              <Label position={[0, -0.75, 1.1]} show={showHashes} minLevel="expert" tone="mono">
                prevHash {i === 0 ? '0x0000…' : `0x${shortHash(b.storedPrev, 6, 0)}`}
                <br />
                data "{b.data.length > 16 ? `${b.data.slice(0, 15)}…` : b.data}"
                <br />
                hash 0x{shortHash(b.hash, 6, 0)}
              </Label>
            </Anim>
          );
        })}
        {XS.slice(1).map((x, i) => (
          <Anim key={x} show={linked} speed={5}>
            <ChainLink from={[XS[i] + SIZE / 2, SIZE * 0.5, 0]} to={[x - SIZE / 2, SIZE * 0.5, 0]} broken={!chain[i + 1].linked && i === chain.findIndex((b) => b.edited)} />
          </Anim>
        ))}
        <Label position={[0, 3.6, 0]} show={stepId === 'fingerprint'} minLevel="expert" tone="mono">
          hash = SHA-256(index ‖ prevHash ‖ data)
        </Label>

        {/* Step 5: the honest chain keeps growing... */}
        <Anim show={isHistory} position={[7.5, 0, 0]}>
          <Platform size={[2.6, 3]} position={[0, 0, 0]} color="ground" height={0.25} />
          <ChainLink from={[-3 + SIZE / 2, SIZE * 0.5, 0]} to={[-SIZE / 2, SIZE * 0.5, 0]} />
          <Pulse>
            <Block color="valid" size={SIZE} glow />
          </Pulse>
          <Label position={[0, SIZE + 1.5, 0]} tone="valid">
            {labels.newBlock}
          </Label>
        </Anim>
        <Label position={[-4.5, SIZE + 1, 0]} show={isHistory} tone="valid">
          {labels.honest}
        </Label>
      </Anim>

      {/* ...while the attacker has to redo every block after the one they changed. */}
      <Anim show={isHistory} position={[ATTACK_X, 0, ATTACK_Z]}>
        <Platform size={[9.4, 3]} position={[-1.5, 0, 0]} color="ground" height={0.25} />
        <group position={[XS[0], 0, 0]}>
          <Block color="neutral" size={SIZE} />
        </group>
        <group position={[XS[1], 0, 0]}>
          <Block color="tx" size={SIZE} glow />
          <Label position={[0, SIZE + 0.9, 0]} tone="tx">
            {labels.edited}
          </Label>
        </group>
        <ChainLink from={[XS[0] + SIZE / 2, SIZE * 0.5, 0]} to={[XS[1] - SIZE / 2, SIZE * 0.5, 0]} />
        <group position={[XS[2], 0, 0]}>
          <Pulse>
            <Block color="invalid" size={SIZE} glow />
          </Pulse>
          <Label position={[0, SIZE + 1.5, 0]} tone="invalid">
            {labels.redo}
          </Label>
        </group>
        <ChainLink from={[XS[1] + SIZE / 2, SIZE * 0.5, 0]} to={[XS[2] - SIZE / 2, SIZE * 0.5, 0]} broken />
        <Label position={[XS[0], SIZE + 1, 0]} tone="invalid">
          {labels.attacker}
        </Label>
      </Anim>
    </>
  );
}

export function Controls({ stepId, labels }: SceneProps) {
  const data = useChain((s) => s.data);
  const setData = useChain((s) => s.setData);
  const reset = useChain((s) => s.reset);
  const value = data[EDITABLE];
  const hash = computeChain(data)[EDITABLE].hash;
  if (stepId !== 'tamper') return null;
  return (
    <div className="ctl">
      <label className="ctl-field">
        <span>{labels.editPrompt}</span>
        <input type="text" value={value} maxLength={32} onChange={(e) => setData(EDITABLE, e.target.value)} spellCheck={false} autoComplete="off" />
      </label>
      <div className="ctl-stat">
        <span>{labels.hashOf}</span>
        <strong>{shortHash(hash, 8, 6)}</strong>
      </div>
      <button type="button" className="btn" onClick={reset} disabled={value === ORIGINAL[EDITABLE]}>
        {labels.reset}
      </button>
    </div>
  );
}
