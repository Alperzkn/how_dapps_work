import type { StepView } from '../../scene/types';

/** The stage is turned by 45° (see TURN in Scene.tsx); targets are written in stage coordinates. */
const at = (x: number, y: number, z: number, zoom: number): StepView => {
  const c = Math.SQRT1_2;
  return { target: [x * c + z * c, y, -x * c + z * c], zoom };
};

export const views: Record<string, StepView> = {
  mempool: at(-0.2, -2, 0, 1.04),
  ordering: at(2.7, -2, 0, 1.4),
  backrun: at(2.2, -2, 0, 1.02),
  sandwich: at(-0.2, -2, 0, 1.04),
  slippage: at(-0.2, -2, 0, 1.04),
  defences: at(-0.2, -2, 0, 1.04),
  pbs: at(-0.3, -1.8, 0, 1.05),
};
