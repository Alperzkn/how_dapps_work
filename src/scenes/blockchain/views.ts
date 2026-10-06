import type { StepView } from '../../scene/types';

export const views: Record<string, StepView> = {
  ledger: { target: [0, 0.6, 0.6], zoom: 1.7 },
  blocks: { target: [0, 0.9, 0], zoom: 1.45 },
  fingerprint: { target: [0, 0.8, 0.3], zoom: 1.45 },
  tamper: { target: [0, 0.4, 0.6], zoom: 1.4 },
  history: { target: [1.6, 0.6, 2.4], zoom: 0.98 },
};
