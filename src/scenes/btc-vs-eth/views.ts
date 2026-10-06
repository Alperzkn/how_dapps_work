import type { StepView } from '../../scene/types';

export const views: Record<string, StepView> = {
  goals: { target: [0, 0.9, 0], zoom: 1.12 },
  ledger: { target: [0, 0.7, 0], zoom: 1.1 },
  programs: { target: [0, 0.8, 0], zoom: 1.1 },
  fees: { target: [0, 0.6, 0], zoom: 1.1 },
  supply: { target: [0, 0.9, 0], zoom: 1.08 },
  summary: { target: [0, 1.5, 0], zoom: 1.12 },
};
