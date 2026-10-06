import { isLevel, type Level } from '../types';

export interface LessonRoute {
  stepIndex: number;
  level: Level;
}

/** Clamps a 1-based step from the URL into a valid 0-based index. */
export function clampStep(raw: string | undefined, stepCount: number): number {
  const n = Number.parseInt(raw ?? '1', 10);
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(n, 1), Math.max(stepCount, 1)) - 1;
}

/** A level in the URL wins over the stored one; anything invalid is ignored. */
export function parseLessonRoute(
  step: string | undefined,
  levelParam: string | null,
  stepCount: number,
  storedLevel: Level,
): LessonRoute {
  return {
    stepIndex: clampStep(step, stepCount),
    level: isLevel(levelParam) ? levelParam : storedLevel,
  };
}

export const lessonPath = (lang: string, lessonId: string, stepIndex = 0, level?: Level) =>
  `/${lang}/lesson/${lessonId}/${stepIndex + 1}${level ? `?level=${level}` : ''}`;
