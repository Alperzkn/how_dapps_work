import { createContext, useContext } from 'react';
import type { SceneColors } from '../theme/tokens';
import type { Lang, Level, ThemeName } from '../types';
import { LEVELS } from '../types';

export interface SceneCtx {
  level: Level;
  lang: Lang;
  theme: ThemeName;
  colors: SceneColors;
  glow: number;
  reducedMotion: boolean;
  /** Small screen: fewer effects, smaller labels. */
  compact: boolean;
}

export const SceneContext = createContext<SceneCtx | null>(null);

export function useScene(): SceneCtx {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error('useScene must be used inside <SceneCanvas>');
  return ctx;
}

export function useTokens(): SceneColors {
  return useScene().colors;
}

export function useLevel() {
  const { level } = useScene();
  return { level, atLeast: (min: Level) => LEVELS.indexOf(level) >= LEVELS.indexOf(min) };
}

/** False inside an <Anim show={false}>, so nested labels hide with their parent. */
export const ShownContext = createContext(true);
