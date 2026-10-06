import type { StepView } from '../../scene/types';

export const views: Record<string, StepView> = {
  stake: { target: [0.3, 1, -0.4], zoom: 1.1 },
  proposer: { target: [0.2, 1.2, -0.2], zoom: 1.08 },
  attest: { target: [0.2, 1, -0.1], zoom: 1.12 },
  finality: { target: [-0.1, 1, 0.5], zoom: 1.05 },
  slashing: { target: [0.3, 0.9, 0.2], zoom: 1.08 },
  compare: { target: [0, 1.1, 0], zoom: 1.25 },
};
