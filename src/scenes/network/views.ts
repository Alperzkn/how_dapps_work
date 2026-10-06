import type { StepView } from '../../scene/types';

export const views: Record<string, StepView> = {
  copies: { target: [0.2, 1.1, 0], zoom: 1.05 },
  gossip: { target: [-0.4, 1, 0], zoom: 1.05 },
  verify: { target: [0.2, 2, 0], zoom: 1.5 },
  reject: { target: [1.6, 1.7, -1], zoom: 1.35 },
  forks: { target: [2.2, 0.5, 2.2], zoom: 1.1 },
};
