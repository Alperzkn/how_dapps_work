import type { StepView } from '../../scene/types';

export const views: Record<string, StepView> = {
  singleton: { target: [-0.6, 0.2, 0], zoom: 1.08 },
  flash: { target: [-0.8, 2.1, 0.2], zoom: 1.2 },
  hooks: { target: [0, 0.9, 1.4], zoom: 1.25 },
  'native-dynamic': { target: [0.2, 0, -0.4], zoom: 1.02 },
  compare: { target: [0, 0.6, 0.6], zoom: 1.08 },
  choose: { target: [0.6, 0.4, 0.2], zoom: 1 },
};
