import type { ComponentType } from 'react';
import type { Lang, Level } from '../types';

/** Where the camera looks and how close, for one step. */
export interface StepView {
  target: [number, number, number];
  /** At 1 the canvas shows a frame 17.5 world units wide by 14 tall, on any screen shape. */
  zoom: number;
}

export interface SceneProps {
  stepId: string;
  stepIndex: number;
  level: Level;
  lang: Lang;
  /** Translated strings from the lesson's `labels`. */
  labels: Record<string, string>;
  reducedMotion: boolean;
}

export interface SceneModule {
  /** Rendered inside the canvas. */
  default: ComponentType<SceneProps>;
  /** Optional HTML controls rendered under the scene. */
  Controls?: ComponentType<SceneProps>;
}
