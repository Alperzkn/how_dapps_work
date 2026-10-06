import type { StepView } from '../../scene/types';

export const views: Record<string, StepView> = {
  idle: { target: [0, 0.3, 0.8], zoom: 1.25 },
  concentrated: { target: [0, -0.4, 0.6], zoom: 1.15 },
  ticks: { target: [0, -0.4, 0.8], zoom: 1.22 },
  crossing: { target: [0, 1.2, 0.8], zoom: 1.35 },
  'fees-nft': { target: [0, 1.3, 0.4], zoom: 1.1 },
  efficiency: { target: [-0.7, -0.2, -0.5], zoom: 1.08 },
};
