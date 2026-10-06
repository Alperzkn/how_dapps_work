import type { StepView } from '../../scene/types';

// Every step has a control panel over the bottom of the canvas, so the views
// aim a little below the model. On phones the scene also shrinks and lifts itself.
export const views: Record<string, StepView> = {
  scarce: { target: [0.4, -0.2, -1.2], zoom: 1.2 },
  rollup: { target: [0, -0.6, -0.4], zoom: 1.1 },
  sequencer: { target: [-0.3, -0.5, -0.4], zoom: 1.12 },
  optimistic: { target: [-0.2, -0.7, -0.4], zoom: 1.1 },
  zk: { target: [-0.4, -0.5, -0.4], zoom: 1.12 },
  blobs: { target: [0.2, -0.1, -0.4], zoom: 1.05 },
  bridge: { target: [0, -0.6, -0.4], zoom: 1.1 },
};
