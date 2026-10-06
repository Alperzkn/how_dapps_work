import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { tokens } from '../theme/tokens';
import type { Lang, Level, ThemeName } from '../types';
import { CameraRig, ISO_OFFSET } from './CameraRig';
import { SceneContext, type SceneCtx } from './context';
import { LabelContext, LabelLayer, LabelProjector, LabelRegistry } from './labels';
import type { StepView } from './types';

let webglSupport: boolean | undefined;
export function hasWebGL(): boolean {
  if (webglSupport === undefined) {
    try {
      const c = document.createElement('canvas');
      webglSupport = Boolean(c.getContext('webgl2') ?? c.getContext('webgl'));
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

function ReadyFlag({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (!done.current) {
      done.current = true;
      onReady();
    }
  });
  return null;
}

interface Props {
  view: StepView;
  level: Level;
  lang: Lang;
  theme: ThemeName;
  reducedMotion: boolean;
  resetKey: number;
  onContextLost: () => void;
  children: ReactNode;
}

export function SceneCanvas(props: Props) {
  const { view, level, lang, theme, reducedMotion, resetKey, onContextLost, children } = props;
  const wrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [ready, setReady] = useState(false);
  const [compact, setCompact] = useState(() => window.innerWidth < 640);

  // Stop rendering while the canvas is off-screen or the tab is hidden.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let onScreen = true;
    const update = () => setActive(onScreen && !document.hidden);
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      update();
    });
    io.observe(el);
    const onResize = () => setCompact(window.innerWidth < 640);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('resize', onResize);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const registry = useMemo(() => new LabelRegistry(), []);
  const t = tokens[theme];
  const ctx = useMemo<SceneCtx>(
    () => ({ level, lang, theme, colors: t.scene, glow: t.glow, reducedMotion, compact }),
    [level, lang, theme, t, reducedMotion, compact],
  );

  return (
    <div ref={wrap} className="scene-canvas" data-scene-ready={ready || undefined} data-compact={compact || undefined}>
      <Canvas
        orthographic
        flat
        shadows={compact ? false : 'soft'}
        dpr={[1, compact ? 1.5 : 2]}
        frameloop={active ? 'demand' : 'never'}
        camera={{ position: ISO_OFFSET.toArray(), zoom: 40, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', onContextLost);
        }}
      >
        <ambientLight intensity={t.ambient} />
        <directionalLight
          position={[5, 14, 9]}
          intensity={t.sun}
          castShadow={!compact}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-18}
          shadow-camera-right={18}
          shadow-camera-top={18}
          shadow-camera-bottom={-18}
          shadow-camera-near={1}
          shadow-camera-far={60}
          shadow-bias={-0.0004}
        />
        <SceneContext.Provider value={ctx}>
          <LabelContext.Provider value={registry}>
            <CameraRig view={view} resetKey={resetKey} />
            {children}
            <LabelProjector registry={registry} />
          </LabelContext.Provider>
        </SceneContext.Provider>
        <ReadyFlag onReady={() => setReady(true)} />
      </Canvas>
      <LabelLayer registry={registry} />
    </div>
  );
}
