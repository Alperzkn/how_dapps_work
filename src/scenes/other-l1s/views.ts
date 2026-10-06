import type { StepView } from '../../scene/types';

export const views: Record<string, StepView> = {
  trilemma: { target: [0, 1.1, 0], zoom: 1.15 },
  solana: { target: [0, 0.9, 0], zoom: 1.25 },
  avalanche: { target: [0, 0.6, 0], zoom: 1.1 },
  cosmos: { target: [0, 0.5, 0], zoom: 1.1 },
  tradeoffs: { target: [0, 0.8, 0], zoom: 0.95 },
};
