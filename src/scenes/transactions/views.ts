import type { StepView } from '../../scene/types';

export const views: Record<string, StepView> = {
  keys: { target: [-7.5, 0.9, 1], zoom: 1.7 },
  sign: { target: [-7, 0.9, 1.4], zoom: 1.8 },
  broadcast: { target: [-1.9, 0.9, -0.5], zoom: 1.15 },
  mempool: { target: [3.5, 0.6, 0.2], zoom: 1.9 },
  included: { target: [7.6, 0.8, -0.1], zoom: 1.4 },
  confirmations: { target: [8.4, 0.8, 1.4], zoom: 1.3 },
};
