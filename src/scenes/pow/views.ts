import type { StepView } from '../../scene/types';

export const views: Record<string, StepView> = {
  who: { target: [-0.4, 0.9, 0.2], zoom: 1.2 },
  puzzle: { target: [1.2, 1.5, 1.4], zoom: 1.6 },
  race: { target: [-0.4, 1.1, 0.4], zoom: 1.2 },
  odds: { target: [-0.4, 0.5, 1.4], zoom: 1.1 },
  broadcast: { target: [0, 0.1, 1], zoom: 1.12 },
  retarget: { target: [0.4, 0.6, 0.2], zoom: 1.12 },
  attack: { target: [0.6, -0.7, 1.3], zoom: 1.1 },
};
