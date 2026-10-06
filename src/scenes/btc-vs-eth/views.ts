import type { StepView } from '../../scene/types';

// The four middle steps have a control panel along the bottom edge, so the model sits higher in the frame.
export const views: Record<string, StepView> = {
  goals: { target: [0, 0.9, 0], zoom: 1.12 },
  ledger: { target: [0, -1.8, 0], zoom: 0.9 },
  programs: { target: [0, -1.8, 0], zoom: 0.9 },
  fees: { target: [0, -1.8, 0], zoom: 0.9 },
  supply: { target: [0, -1.8, 0], zoom: 0.9 },
  summary: { target: [0, 1.5, 0], zoom: 1.12 },
};
