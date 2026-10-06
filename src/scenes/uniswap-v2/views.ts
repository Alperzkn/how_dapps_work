import type { StepView } from '../../scene/types';

// The three steps with controls aim below the scene's middle, so the pool and
// the curve sit in the upper part of the canvas, clear of the control panel.
export const views: Record<string, StepView> = {
  orderbook: { target: [-2.8, 1, -0.1], zoom: 1.2 },
  pool: { target: [0, 0.8, 0.3], zoom: 1.5 },
  curve: { target: [0, 0.35, 0], zoom: 1.25 },
  swap: { target: [-0.36, 0.35, 0.49], zoom: 1.2 },
  fees: { target: [0, 0.9, 0.6], zoom: 1.45 },
  risks: { target: [1.63, 0.3, -0.77], zoom: 1.1 },
};
