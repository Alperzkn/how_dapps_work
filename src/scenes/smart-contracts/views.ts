import type { StepView } from '../../scene/types';

// Scenes are laid out along the screen: u to the right, v towards the viewer.
const R = Math.SQRT1_2;
const at = (u: number, v: number): [number, number, number] => [(u + v) * R, 0, (v - u) * R];

// Every step has controls, and on a phone the panel covers the lower half of
// the canvas. Each view therefore aims well below its scene (a larger v), so
// the model sits in the upper part of the canvas, clear of the panel.
export const views: Record<string, StepView> = {
  account: { target: at(0.5, 2.8), zoom: 1.4 },
  deploy: { target: at(-0.1, 2.7), zoom: 1.3 },
  call: { target: at(-0.4, 2.9), zoom: 1.25 },
  storage: { target: at(0.6, 3.1), zoom: 1.45 },
  evm: { target: at(0.9, 4.2), zoom: 1.1 },
  gas: { target: at(0.8, 4.9), zoom: 1.1 },
  reentrancy: { target: at(0.1, 3.4), zoom: 1.4 },
};
