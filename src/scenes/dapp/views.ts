import type { StepView } from '../../scene/types';

export const views: Record<string, StepView> = {
  compare: { target: [-0.2, 0.5, -1.2], zoom: 1.1 },
  frontend: { target: [-5.2, 0.9, -1.2], zoom: 1.75 },
  wallet: { target: [-3.8, 0.8, 0], zoom: 1.8 },
  rpc: { target: [0.6, 0.6, 0], zoom: 1.1 },
  contract: { target: [5.5, 1.0, 0.3], zoom: 1.6 },
  events: { target: [-0.2, 0.5, 1.2], zoom: 1.1 },
};
