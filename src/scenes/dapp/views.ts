import type { StepView } from '../../scene/types';

// Steps with a control panel aim below the model's middle, so it sits in the
// upper part of the canvas. On a phone the scene additionally lifts itself.
export const views: Record<string, StepView> = {
  compare: { target: [-0.2, -0.3, -0.6], zoom: 1.05 },
  frontend: { target: [-5.2, 0.9, -1.2], zoom: 1.75 },
  wallet: { target: [-3.4, 0.2, 0], zoom: 1.7 },
  rpc: { target: [0.6, -0.2, 0.6], zoom: 1.05 },
  contract: { target: [5.2, 1.3, 1.1], zoom: 1.25 },
  events: { target: [0.2, 0.4, 0.4], zoom: 1.0 },
};
