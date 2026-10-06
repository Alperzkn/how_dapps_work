import type { StepView } from '../../scene/types';

// Scenes are laid out along the screen: u to the right, v towards the viewer.
const R = Math.SQRT1_2;
const at = (u: number, v: number): [number, number, number] => [(u + v) * R, 0, (v - u) * R];

// Every step has controls, and on a phone the panel covers the lower half of
// the canvas. Each view therefore aims well below its scene (a larger v), so
// the model sits in the upper part of the canvas, clear of the panel.
export const views: Record<string, StepView> = {
  ledger: { target: at(0, 2.55), zoom: 1.3 },
  erc20: { target: at(0.2, 3.05), zoom: 1.15 },
  supply: { target: at(0.2, 2.55), zoom: 1.3 },
  approve: { target: at(0.2, 3.45), zoom: 1.25 },
  kinds: { target: at(0, 3.1), zoom: 1.25 },
  nft: { target: at(0, 3.05), zoom: 1.35 },
};
