import type { StepView } from '../../scene/types';

export const views: Record<string, StepView> = {
  keys: { target: [-6.1, 0.9, 3.1], zoom: 1.45 },
  sign: { target: [-6.3, 0.5, 3.2], zoom: 1.45 },
  broadcast: { target: [-1.9, 0.9, -0.5], zoom: 1.15 },
  mempool: { target: [4.75, 0, 1.35], zoom: 1.9 },
  included: { target: [7.4, 0, 0.4], zoom: 1.4 },
  confirmations: { target: [8.7, 0, -2.6], zoom: 1.05 },
};
