import { useCallback, useEffect, useState } from 'react';
import type { LessonEntry } from '../content/registry';
import type { SceneModule } from '../scene/types';
import type { Lang, LessonContent } from '../types';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

type Loaded = { id: string; mod: SceneModule | null; failed: boolean };

/** Loads a lesson's scene code on demand. */
export function useSceneModule(lesson: LessonEntry | undefined) {
  const [state, setState] = useState<Loaded>({ id: '', mod: null, failed: false });
  const [attempt, setAttempt] = useState(0);
  const id = lesson?.meta.id ?? '';

  useEffect(() => {
    if (!lesson) return;
    let live = true;
    setState({ id, mod: null, failed: false });
    lesson
      .load()
      .then((mod) => live && setState({ id, mod, failed: false }))
      .catch((error) => {
        console.warn('Scene failed to load', error);
        if (live) setState({ id, mod: null, failed: true });
      });
    return () => {
      live = false;
    };
  }, [lesson, id, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const current = state.id === id ? state : { id, mod: null, failed: false };
  return { mod: current.mod, failed: current.failed, attempt, retry };
}

/** Left/right swipe on an element. Vertical scrolling is left alone. */
export function swipeHandlers(onSwipe: (dir: 1 | -1) => void) {
  let x = 0;
  let y = 0;
  return {
    onTouchStart: (e: React.TouchEvent) => {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - x;
      const dy = e.changedTouches[0].clientY - y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.8) onSwipe(dx < 0 ? 1 : -1);
    },
  };
}

type Text = { id: string; lang: Lang; content: LessonContent };

/**
 * Loads a lesson's text for a language. While another language of the same
 * lesson is loading, the previous one stays on screen so the page does not blank.
 */
export function useLessonContent(lesson: LessonEntry | undefined, lang: Lang): LessonContent | null {
  const [text, setText] = useState<Text | null>(null);
  const id = lesson?.meta.id ?? '';

  useEffect(() => {
    if (!lesson) return;
    let live = true;
    lesson
      .loadContent(lang)
      .then((content) => live && setText({ id, lang, content }))
      .catch((error) => console.error('Lesson text failed to load', error));
    return () => {
      live = false;
    };
  }, [lesson, id, lang]);

  return text && text.id === id ? text.content : null;
}
