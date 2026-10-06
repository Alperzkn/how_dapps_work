import type { StepView } from '../../scene/types';

export const views: Record<string, StepView> = {
  ledger: { target: [0, 0.6, 0.6], zoom: 1.7 },
  blocks: { target: [0, 0.9, 0], zoom: 1.45 },
  fingerprint: { target: [0.5, -1.95, -0.5], zoom: 1.1 },
  tamper: { target: [0, -0.8, 0], zoom: 1.1 },
  history: { target: [-0.4, -2.2, 0.4], zoom: 0.95 },
  uses: { target: [1.77, 0.43, -1.77], zoom: 1 },
};
