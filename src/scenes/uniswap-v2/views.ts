import type { StepView } from '../../scene/types';

// Every step has a control panel along the bottom of the canvas, so each view
// aims below the scene's middle and the model sits in the upper part. On a
// phone the scene additionally lifts itself (see Scene.tsx).
export const views: Record<string, StepView> = {
  orderbook: { target: [-2.8, 0.2, -0.1], zoom: 1.15 },
  pool: { target: [0, 0, 0.3], zoom: 1.4 },
  curve: { target: [0, 0.35, 0], zoom: 1.25 },
  swap: { target: [-0.36, 0.35, 0.49], zoom: 1.2 },
  fees: { target: [0, 0, 0.6], zoom: 1.35 },
  risks: { target: [1.63, 0.3, -0.77], zoom: 1.1 },
};
