import type { StepView } from '../../scene/types';

// Every step has a control panel over the bottom of the canvas, so the views
// aim a little below the models. On phones the scene also shrinks and lifts itself.
export const views: Record<string, StepView> = {
  trilemma: { target: [0, 0.3, 0], zoom: 1.1 },
  solana: { target: [0.3, 0.5, 0.3], zoom: 1.2 },
  avalanche: { target: [0, -1.2, 0], zoom: 1.05 },
  cosmos: { target: [0, -0.9, 0], zoom: 1.1 },
  tradeoffs: { target: [0, -0.9, 0], zoom: 0.88 },
};
