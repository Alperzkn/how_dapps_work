import type { StepView } from '../../scene/types';

export const views: Record<string, StepView> = {
  who: { target: [-0.4, 0.9, 0.2], zoom: 1.2 },
  puzzle: { target: [1.2, 1.5, 1.4], zoom: 1.6 },
  race: { target: [-0.4, 1.1, 0.4], zoom: 1.2 },
  broadcast: { target: [-0.4, 0.9, 0.2], zoom: 1.2 },
  retarget: { target: [0.4, 1.2, -0.2], zoom: 1.12 },
  attack: { target: [-0.2, 0.6, 0.6], zoom: 1.05 },
};
