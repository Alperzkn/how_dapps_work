import type { StepView } from '../../scene/types';

// Every step has a control panel along the bottom edge, so the model sits in the upper part of the frame.
export const views: Record<string, StepView> = {
  stake: { target: [0.3, -0.7, -0.4], zoom: 1.02 },
  proposer: { target: [0.2, -0.7, -0.2], zoom: 0.96 },
  attest: { target: [0.2, -1.2, -0.1], zoom: 1 },
  finality: { target: [1.2, -3.2, 1.6], zoom: 0.82 },
  slashing: { target: [0.8, -2.4, 1], zoom: 0.92 },
  compare: { target: [0, -1.4, 0], zoom: 0.98 },
};
