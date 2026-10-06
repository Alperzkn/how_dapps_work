import { useFrame } from '@react-three/fiber';
import { createContext, useSyncExternalStore, type ReactNode } from 'react';
import { Vector3, type Object3D } from 'three';

interface Entry {
  node: ReactNode;
  tone: string;
  obj: Object3D;
  el: HTMLDivElement | null;
}

/**
 * Labels are declared inside the 3D scene but drawn as ordinary HTML in a layer
 * above the canvas. This registry is the bridge between the two React trees.
 */
export class LabelRegistry {
  entries = new Map<string, Entry>();
  private listeners = new Set<() => void>();
  private version = 0;

  set(id: string, node: ReactNode, tone: string, obj: Object3D) {
    const prev = this.entries.get(id);
    this.entries.set(id, { node, tone, obj, el: prev?.el ?? null });
    this.emit();
  }

  delete(id: string) {
    if (this.entries.delete(id)) this.emit();
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  };

  getVersion = () => this.version;

  private emit() {
    this.version++;
    this.listeners.forEach((fn) => fn());
  }
}

export const LabelContext = createContext<LabelRegistry | null>(null);

/** Lives outside the canvas: renders every registered label as HTML. */
export function LabelLayer({ registry }: { registry: LabelRegistry }) {
  useSyncExternalStore(registry.subscribe, registry.getVersion);
  return (
    <div className="scene-labels" aria-hidden="true">
      {[...registry.entries].map(([id, e]) => (
        <div
          key={id}
          className="scene-label-wrap"
          style={{ visibility: 'hidden' }}
          ref={(el) => {
            e.el = el;
          }}
        >
          <div className={`scene-label tone-${e.tone}`}>{e.node}</div>
        </div>
      ))}
    </div>
  );
}

const v = new Vector3();

/** Lives inside the canvas: keeps each label glued to its 3D anchor. */
export function LabelProjector({ registry }: { registry: LabelRegistry }) {
  useFrame(({ camera, size }) => {
    for (const e of registry.entries.values()) {
      if (!e.el) continue;
      e.obj.updateWorldMatrix(true, false);
      v.setFromMatrixPosition(e.obj.matrixWorld).project(camera);
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      e.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
      e.el.style.visibility = 'visible';
    }
  });
  return null;
}
