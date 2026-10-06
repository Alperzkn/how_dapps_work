import type { StepView } from '../../scene/types';

export const views: Record<string, StepView> = {
  singleton: { target: [-0.6, -0.6, 0], zoom: 1.08 },
  flash: { target: [-1.2, 1.5, 0.2], zoom: 1.12 },
  hooks: { target: [0, 0.5, 1.4], zoom: 1.2 },
  'native-dynamic': { target: [0.2, 0, -0.4], zoom: 1.02 },
  compare: { target: [0, 0.6, 0.6], zoom: 1.08 },
  choose: { target: [0.3, -0.7, 0.2], zoom: 1 },
};
