import { useEffect, useState } from 'react';

interface Props {
  lessonId: string;
  stepId: string;
  alt: string;
  note: string;
  retryLabel?: string;
  onRetry?: () => void;
}

/** Shown when the 3D scene cannot run: a pre-rendered still of the step, or its description. */
export function Fallback({ lessonId, stepId, alt, note, retryLabel, onRetry }: Props) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [lessonId, stepId]);
  return (
    <div className="scene-fallback" data-scene-fallback>
      {broken ? (
        <p className="scene-fallback-alt">{alt}</p>
      ) : (
        <img src={`./fallback/${lessonId}/${stepId}.png`} alt={alt} onError={() => setBroken(true)} />
      )}
      <p className="scene-fallback-note">
        {note}
        {onRetry && (
          <button type="button" className="btn" onClick={onRetry}>
            {retryLabel}
          </button>
        )}
      </p>
    </div>
  );
}
