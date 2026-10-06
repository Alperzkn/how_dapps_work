import { Line } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { CatmullRomCurve3, Group, Quaternion, Vector3 } from 'three';
import type { ColorKey } from '../../theme/tokens';
import { useScene } from '../context';
import { Ball, Box, Cyl, Mat, useLoop, type Vec3 } from './core';

/** Flat slab that things stand on. `position` is the center of its top surface. */
export function Platform({ size, position = [0, 0, 0], color = 'platform', height = 0.3 }: { size: [number, number]; position?: Vec3; color?: ColorKey; height?: number }) {
  return <Box size={[size[0], height, size[1]]} position={[position[0], position[1] - height / 2, position[2]]} color={color} radius={0.12} />;
}

/** A block of the chain: a cube with a lid. Sits on y = 0. */
export function Block({ color = 'block', size = 1.4, glow = false }: { color?: ColorKey; size?: number; glow?: boolean }) {
  const lid = size * 0.12;
  return (
    <group>
      <Box size={[size, size - lid, size]} position={[0, (size - lid) / 2, 0]} color={color} glow={glow} radius={0.1} />
      <Box size={[size * 1.06, lid, size * 1.06]} position={[0, size - lid / 2, 0]} color="platform" radius={0.05} />
      <Box size={[size * 0.5, size * 0.1, 0.06]} position={[0, size * 0.55, size / 2 + 0.01]} color="platform" radius={0.02} />
    </group>
  );
}

/** A bar with two rings joining two points, e.g. neighbouring blocks. */
export function ChainLink({ from, to, color = 'chain', broken = false }: { from: Vec3; to: Vec3; color?: ColorKey; broken?: boolean }) {
  const { mid, quat, len } = useMemo(() => {
    const a = new Vector3(...from);
    const b = new Vector3(...to);
    const dir = b.clone().sub(a);
    return {
      mid: a.clone().add(b).multiplyScalar(0.5),
      len: dir.length(),
      quat: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize()),
    };
  }, [from, to]);
  const part = broken ? len * 0.32 : len;
  const offsets = broken ? [-len * 0.34, len * 0.34] : [0];
  return (
    <group position={mid} quaternion={quat}>
      {offsets.map((o) => (
        <Cyl key={o} radius={0.07} height={part} position={[0, o, 0]} color={broken ? 'invalid' : color} segments={12} />
      ))}
      {!broken && (
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.16, 0.055, 10, 20]} />
          <Mat color={color} />
        </mesh>
      )}
    </group>
  );
}

/** A computer running the chain software: stacked server units with a status light. */
export function NodeTower({ color = 'neutral', light = 'valid', units = 3, glow = false }: { color?: ColorKey; light?: ColorKey; units?: number; glow?: boolean }) {
  return (
    <group>
      {Array.from({ length: units }, (_, i) => (
        <group key={i} position={[0, 0.22 + i * 0.44, 0]}>
          <Box size={[1, 0.36, 1]} color={color} glow={glow} radius={0.06} />
          <Ball radius={0.06} position={[0.28, 0, 0.51]} color={light} glow />
          <Box size={[0.4, 0.06, 0.04]} position={[-0.15, 0, 0.51]} color="platform" radius={0.01} />
        </group>
      ))}
    </group>
  );
}

/** A wallet: a folded pouch with a clasp. */
export function Wallet({ color = 'actor', glow = false }: { color?: ColorKey; glow?: boolean }) {
  return (
    <group>
      <Box size={[1.3, 0.9, 0.36]} position={[0, 0.45, 0]} color={color} glow={glow} radius={0.14} />
      <Box size={[1.34, 0.4, 0.4]} position={[0, 0.72, 0]} color={color} glow={glow} radius={0.12} />
      <Cyl radius={0.12} height={0.1} position={[0.38, 0.52, 0.2]} rotation={[Math.PI / 2, 0, 0]} color="platform" />
    </group>
  );
}

/** A small parcel: a transaction, message or call travelling somewhere. */
export function Packet({ color = 'tx', size = 0.36, glow = true }: { color?: ColorKey; size?: number; glow?: boolean }) {
  return <Box size={[size, size, size]} position={[0, size / 2, 0]} color={color} glow={glow} radius={size * 0.22} />;
}

/** A mining machine with a spinning fan. */
export function MinerRig({ color = 'actor', active = true, glow = false }: { color?: ColorKey; active?: boolean; glow?: boolean }) {
  const fan = useRef<Group>(null);
  useLoop((_, dt) => {
    if (fan.current) fan.current.rotation.z += dt * 9;
  }, active);
  return (
    <group>
      <Box size={[1.5, 0.9, 1]} position={[0, 0.45, 0]} color={color} glow={glow} radius={0.1} />
      <Cyl radius={0.34} height={0.06} position={[0, 0.48, 0.5]} rotation={[Math.PI / 2, 0, 0]} color="platform" />
      <group ref={fan} position={[0, 0.48, 0.55]}>
        <Box size={[0.56, 0.1, 0.04]} color="chain" radius={0.02} />
        <Box size={[0.1, 0.56, 0.04]} color="chain" radius={0.02} />
      </group>
      <Box size={[0.9, 0.08, 0.6]} position={[0, 0.94, 0]} color="chain" radius={0.03} />
    </group>
  );
}

/** A stack of coins. Sits on y = 0. */
export function CoinStack({ count, color = 'tx', radius = 0.3, glow = false }: { count: number; color?: ColorKey; radius?: number; glow?: boolean }) {
  const n = Math.max(0, Math.round(count));
  return (
    <group>
      {Array.from({ length: n }, (_, i) => (
        <Cyl key={i} radius={radius} height={0.11} position={[0, 0.06 + i * 0.14, 0]} color={color} glow={glow} />
      ))}
    </group>
  );
}

/** A validator: a pillar holding its staked coins. */
export function ValidatorPillar({ stake = 3, color = 'actor', coin = 'tx', glow = false }: { stake?: number; color?: ColorKey; coin?: ColorKey; glow?: boolean }) {
  return (
    <group>
      <Cyl radius={0.5} height={0.16} position={[0, 0.08, 0]} color="platform" />
      <Cyl radius={0.36} height={0.9} position={[0, 0.61, 0]} color={color} glow={glow} />
      <Cyl radius={0.5} height={0.14} position={[0, 1.13, 0]} color="platform" />
      <group position={[0, 1.2, 0]}>
        <CoinStack count={stake} color={coin} radius={0.28} />
      </group>
    </group>
  );
}

/** A single large token standing on its edge. */
export function Token({ color = 'tokenA', radius = 0.45 }: { color?: ColorKey; radius?: number }) {
  return (
    <group position={[0, radius, 0]}>
      <Cyl radius={radius} height={0.16} rotation={[Math.PI / 2, 0, 0]} color={color} />
      <Cyl radius={radius * 0.62} height={0.18} rotation={[Math.PI / 2, 0, 0]} color="platform" />
    </group>
  );
}

/**
 * A pool: an open tray holding two reserves side by side.
 * `a` and `b` are fill heights in world units.
 */
export function PoolBasin({ width = 4, depth = 2.4, wall = 1.6, a, b, colorA = 'tokenA', colorB = 'tokenB' }: { width?: number; depth?: number; wall?: number; a: number; b: number; colorA?: ColorKey; colorB?: ColorKey }) {
  const t = 0.14;
  const half = width / 2;
  const fill = (h: number) => Math.max(0.04, Math.min(h, wall - 0.1));
  return (
    <group>
      <Box size={[width + t * 2, t, depth + t * 2]} position={[0, t / 2, 0]} color="neutral" radius={0.05} />
      <Box size={[t, wall, depth + t * 2]} position={[-half - t / 2, wall / 2, 0]} color="neutral" radius={0.05} />
      <Box size={[t, wall, depth + t * 2]} position={[half + t / 2, wall / 2, 0]} color="neutral" radius={0.05} />
      <Box size={[width, wall, t]} position={[0, wall / 2, -depth / 2 - t / 2]} color="neutral" radius={0.05} />
      <Box size={[width, wall * 0.35, t]} position={[0, wall * 0.175, depth / 2 + t / 2]} color="neutral" radius={0.05} />
      <Box size={[t * 0.6, wall * 0.8, depth]} position={[0, wall * 0.4, 0]} color="neutral" radius={0.03} />
      <Box size={[half - 0.12, fill(a), depth - 0.08]} position={[-half / 2 - 0.02, t + fill(a) / 2, 0]} color={colorA} radius={0.04} />
      <Box size={[half - 0.12, fill(b), depth - 0.08]} position={[half / 2 + 0.02, t + fill(b) / 2, 0]} color={colorB} radius={0.04} />
    </group>
  );
}

/** A smart contract: a machine with an intake slot and a turning gear. */
export function ContractMachine({ color = 'contract', active = true, glow = false, size = 1 }: { color?: ColorKey; active?: boolean; glow?: boolean; size?: number }) {
  const gear = useRef<Group>(null);
  useLoop((_, dt) => {
    if (gear.current) gear.current.rotation.z += dt * 1.6;
  }, active);
  return (
    <group scale={size}>
      <Box size={[1.6, 1.3, 1.2]} position={[0, 0.65, 0]} color={color} glow={glow} radius={0.12} />
      <Box size={[0.9, 0.12, 0.08]} position={[-0.2, 0.95, 0.6]} color="ink" radius={0.03} />
      <group ref={gear} position={[0.42, 0.45, 0.62]}>
        <mesh castShadow>
          <torusGeometry args={[0.2, 0.07, 8, 8]} />
          <Mat color="platform" />
        </mesh>
      </group>
      <Box size={[0.5, 0.3, 0.5]} position={[-0.4, 1.45, 0]} color="platform" radius={0.06} />
    </group>
  );
}

/** A person: used for users, liquidity providers, traders. */
export function Person({ color = 'actor', glow = false }: { color?: ColorKey; glow?: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.26, 0.42, 6, 16]} />
        <Mat color={color} glow={glow} />
      </mesh>
      <Ball radius={0.22} position={[0, 1.16, 0]} color="platform" />
    </group>
  );
}

/** A monitor on a stand: the website part of an app. */
export function Screen({ color = 'neutral', face = 'block', glow = false }: { color?: ColorKey; face?: ColorKey; glow?: boolean }) {
  return (
    <group>
      <Box size={[0.7, 0.08, 0.5]} position={[0, 0.04, 0]} color={color} radius={0.03} />
      <Box size={[0.14, 0.5, 0.1]} position={[0, 0.3, 0]} color={color} radius={0.03} />
      <Box size={[1.7, 1.1, 0.12]} position={[0, 1.05, 0]} color={color} radius={0.06} />
      <Box size={[1.5, 0.9, 0.04]} position={[0, 1.05, 0.07]} color={face} glow={glow} radius={0.03} />
    </group>
  );
}

interface FlowLineProps {
  points: Vec3[];
  color?: ColorKey;
  dashed?: boolean;
  arrow?: boolean;
  width?: number;
  /** Bend the line through the points instead of straight segments. */
  curved?: boolean;
}

/** A path drawn in the world: who talks to whom, or which way things flow. */
export function FlowLine({ points, color = 'chain', dashed = false, arrow = true, width = 2.5, curved = false }: FlowLineProps) {
  const { colors } = useScene();
  const pts = useMemo(() => {
    const v = points.map((p) => new Vector3(...p));
    return curved && v.length > 2 ? new CatmullRomCurve3(v).getPoints(40) : v;
  }, [points, curved]);
  const head = useMemo(() => {
    const end = pts[pts.length - 1];
    const dir = end.clone().sub(pts[pts.length - 2]).normalize();
    return { end, quat: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir) };
  }, [pts]);
  return (
    <group>
      <Line points={pts} color={colors[color]} lineWidth={width} dashed={dashed} dashSize={0.22} gapSize={0.16} />
      {arrow && (
        <mesh position={head.end} quaternion={head.quat}>
          <coneGeometry args={[0.13, 0.32, 12]} />
          <Mat color={color} />
        </mesh>
      )}
    </group>
  );
}

interface MoverProps {
  path: Vec3[];
  /** Seconds for one trip. */
  duration?: number;
  /** Seconds to wait before the first trip; also offsets repeated trips. */
  delay?: number;
  loop?: boolean;
  /** Height of the hop arc between points. */
  arc?: number;
  /** When false the child rests at the start of the path. */
  playing?: boolean;
  children: ReactNode;
}

/** Moves its children along a path, e.g. a packet travelling between nodes. */
export function Mover({ path, duration = 2, delay = 0, loop = true, arc = 0, playing = true, children }: MoverProps) {
  const ref = useRef<Group>(null);
  const start = useRef<number | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  const pts = useMemo(() => path.map((p) => new Vector3(...p)), [path]);
  // At rest the child sits at the start of the path and no frames are requested.
  useEffect(() => {
    if (playing) return;
    start.current = null;
    if (ref.current) {
      ref.current.position.copy(pts[0]);
      ref.current.visible = true;
    }
    invalidate();
  }, [playing, pts, invalidate]);
  useLoop((time) => {
    const g = ref.current;
    if (!g) return;
    start.current ??= time;
    const local = time - start.current - delay;
    if (local < 0) {
      g.visible = false;
      return;
    }
    g.visible = true;
    const raw = loop ? (local % (duration + 0.4)) / duration : local / duration;
    const u = Math.min(raw, 1);
    const seg = Math.min(Math.floor(u * (pts.length - 1)), pts.length - 2);
    const f = u * (pts.length - 1) - seg;
    const e = f * f * (3 - 2 * f);
    g.position.lerpVectors(pts[seg], pts[seg + 1], e);
    g.position.y += Math.sin(e * Math.PI) * arc;
  }, playing);
  return (
    <group ref={ref} position={path[path.length - 1]}>
      {children}
    </group>
  );
}
