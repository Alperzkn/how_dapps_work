import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { OrthographicCamera, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useScene } from './context';
import type { StepView } from './types';

export const ISO_OFFSET = new Vector3(20, 20, 20);
const ISO_AZIMUTH = Math.PI / 4;
// Scenes are composed for a frame 17.5 world units wide by 14 tall at zoom 1.
const FRAME_HEIGHT = 14;
const FRAME_ASPECT = 1.25;

/** Eases the camera to each step's view; the user may rotate and zoom within limits. */
export function CameraRig({ view, resetKey }: { view: StepView; resetKey: number }) {
  const { reducedMotion } = useScene();
  const camera = useThree((s) => s.camera) as OrthographicCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const controls = useRef<OrbitControlsImpl>(null);
  const easing = useRef(true);
  const first = useRef(true);

  const [tx, ty, tz] = view.target;
  const target = useMemo(() => new Vector3(tx, ty, tz), [tx, ty, tz]);
  const zoom = (view.zoom * Math.min(size.width / FRAME_ASPECT, size.height)) / FRAME_HEIGHT;

  useEffect(() => {
    easing.current = true;
    invalidate();
  }, [target, zoom, resetKey, invalidate]);

  useFrame((_, dt) => {
    const c = controls.current;
    if (!easing.current || !c) return;
    const snap = reducedMotion || first.current;
    first.current = false;
    const k = snap ? 1 : 1 - Math.exp(-Math.min(dt, 1 / 30) * 5);
    c.target.lerp(target, k);
    camera.position.lerp(target.clone().add(ISO_OFFSET), k);
    camera.zoom += (zoom - camera.zoom) * k;
    camera.updateProjectionMatrix();
    c.update();
    const done =
      c.target.distanceTo(target) < 0.005 &&
      Math.abs(camera.zoom - zoom) < 0.05 &&
      camera.position.distanceTo(target.clone().add(ISO_OFFSET)) < 0.01;
    if (done) easing.current = false;
    else invalidate();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping={false}
      minAzimuthAngle={ISO_AZIMUTH - Math.PI / 6}
      maxAzimuthAngle={ISO_AZIMUTH + Math.PI / 6}
      minPolarAngle={0.62}
      maxPolarAngle={1.25}
      minZoom={zoom * 0.6}
      maxZoom={zoom * 2.5}
      onStart={() => {
        easing.current = false;
      }}
    />
  );
}
