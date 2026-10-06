import { RoundedBox } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useContext, useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { Group } from 'three';
import type { ColorKey } from '../../theme/tokens';
import type { Level } from '../../types';
import { ShownContext, useLevel, useScene } from '../context';
import { LabelContext } from '../labels';

export type Vec3 = [number, number, number];

const MAX_DT = 1 / 30;

/**
 * Per-frame callback for looping motion. Keeps the on-demand render loop alive
 * and stops entirely when the user prefers reduced motion.
 */
export function useLoop(cb: (time: number, dt: number) => void, enabled = true) {
  const { reducedMotion } = useScene();
  useFrame((state, dt) => {
    if (reducedMotion || !enabled) return;
    cb(state.clock.elapsedTime, Math.min(dt, MAX_DT));
    state.invalidate();
  });
}

interface AnimProps {
  position?: Vec3;
  rotation?: Vec3;
  scale?: number | Vec3;
  /** false shrinks the group to nothing and hides it (and any labels inside). */
  show?: boolean;
  speed?: number;
  children?: ReactNode;
}

const toVec = (s: number | Vec3): Vec3 => (typeof s === 'number' ? [s, s, s] : s);

/** A group that eases toward its props whenever they change. */
export function Anim({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, show = true, speed = 6, children }: AnimProps) {
  const ref = useRef<Group>(null);
  const { reducedMotion } = useScene();
  const parentShown = useContext(ShownContext);
  const invalidate = useThree((s) => s.invalidate);
  const mounted = useRef(false);
  const goal = { p: position, r: rotation, s: show ? toVec(scale) : ([0, 0, 0] as Vec3) };
  const goalRef = useRef(goal);
  goalRef.current = goal;

  useEffect(() => {
    invalidate();
  });

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const { p, r, s } = goalRef.current;
    const snap = reducedMotion || !mounted.current;
    mounted.current = true;
    const k = snap ? 1 : 1 - Math.exp(-Math.min(dt, MAX_DT) * speed);
    let rest = 0;
    const ease = (cur: number, to: number) => {
      const next = cur + (to - cur) * k;
      rest = Math.max(rest, Math.abs(to - next));
      return Math.abs(to - next) < 0.0005 ? to : next;
    };
    g.position.set(ease(g.position.x, p[0]), ease(g.position.y, p[1]), ease(g.position.z, p[2]));
    g.rotation.set(ease(g.rotation.x, r[0]), ease(g.rotation.y, r[1]), ease(g.rotation.z, r[2]));
    g.scale.set(ease(g.scale.x, s[0]), ease(g.scale.y, s[1]), ease(g.scale.z, s[2]));
    g.visible = Math.max(g.scale.x, g.scale.y, g.scale.z) > 0.002;
    if (rest >= 0.0005) invalidate();
  });

  return (
    <group ref={ref} scale={0}>
      <ShownContext.Provider value={parentShown && show}>{children}</ShownContext.Provider>
    </group>
  );
}

interface MatProps {
  color: ColorKey;
  /** Highlight: emissive glow, stronger in the dark theme. */
  glow?: boolean;
  opacity?: number;
}

/** The one material every piece uses: matte clay, colored from theme tokens. */
export function Mat({ color, glow = false, opacity = 1 }: MatProps) {
  const { colors, glow: amount } = useScene();
  return (
    <meshStandardMaterial
      // three.js needs a fresh material when transparency is switched on or off.
      key={opacity < 1 ? 'clear' : 'solid'}
      color={colors[color]}
      roughness={0.85}
      metalness={0}
      emissive={glow ? colors[color] : '#000000'}
      emissiveIntensity={glow ? amount : 0}
      transparent={opacity < 1}
      opacity={opacity}
      depthWrite={opacity >= 1}
    />
  );
}

interface BoxProps extends MatProps {
  size: Vec3;
  position?: Vec3;
  rotation?: Vec3;
  radius?: number;
}

/** Rounded box; `position` is its center. */
export function Box({ size, position, rotation, radius = 0.08, ...mat }: BoxProps) {
  const r = Math.min(radius, Math.min(...size) / 2 - 0.001);
  return (
    <RoundedBox args={size} radius={Math.max(r, 0.001)} smoothness={3} position={position} rotation={rotation} castShadow receiveShadow>
      <Mat {...mat} />
    </RoundedBox>
  );
}

interface CylProps extends MatProps {
  radius: number;
  height: number;
  position?: Vec3;
  rotation?: Vec3;
  segments?: number;
}

/** Upright cylinder; `position` is its center. */
export function Cyl({ radius, height, position, rotation, segments = 28, ...mat }: CylProps) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, height, segments]} />
      <Mat {...mat} />
    </mesh>
  );
}

export function Ball({ radius, position, ...mat }: MatProps & { radius: number; position?: Vec3 }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[radius, 24, 16]} />
      <Mat {...mat} />
    </mesh>
  );
}

export type LabelTone = 'default' | 'mono' | 'tx' | 'valid' | 'invalid' | 'actor' | 'block' | 'tokenA' | 'tokenB' | 'plain';

interface LabelProps {
  position?: Vec3;
  /** Hidden below this level. */
  minLevel?: Level;
  /** Hidden above this level (e.g. a beginner-only caption). */
  maxLevel?: Level;
  show?: boolean;
  tone?: LabelTone;
  children: ReactNode;
}

/** Text anchored to a 3D point, drawn as HTML above the canvas so it stays sharp. */
export function Label({ position, minLevel = 'beginner', maxLevel = 'expert', show = true, tone = 'default', children }: LabelProps) {
  const { atLeast, level } = useLevel();
  const parentShown = useContext(ShownContext);
  const registry = useContext(LabelContext);
  const invalidate = useThree((s) => s.invalidate);
  const id = useId();
  const ref = useRef<Group>(null);
  const tooHigh = level !== maxLevel && atLeast(maxLevel);
  const visible = show && parentShown && atLeast(minLevel) && !tooHigh;

  useLayoutEffect(() => {
    if (!registry || !visible || !ref.current) return;
    registry.set(id, children, tone, ref.current);
    invalidate();
  });
  useLayoutEffect(() => {
    if (!visible) registry?.delete(id);
    return () => registry?.delete(id);
  }, [registry, id, visible]);

  return <group ref={ref} position={position} />;
}

/** A soft ground that only shows shadows, so the page background shows through. */
export function ShadowGround({ y = 0, size = 80 }: { y?: number; size?: number }) {
  const { theme } = useScene();
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <shadowMaterial transparent opacity={theme === 'dark' ? 0.45 : 0.16} />
    </mesh>
  );
}
