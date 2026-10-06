import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { Lang, Level, ThemeName } from '../types';

/** Returns the given storage if it is usable, otherwise an in-memory one. */
export function createSafeStorage(get: () => Storage): StateStorage {
  try {
    const s = get();
    s.setItem('__hdw_probe', '1');
    s.removeItem('__hdw_probe');
    return s;
  } catch {
    const mem = new Map<string, string>();
    return {
      getItem: (k) => mem.get(k) ?? null,
      setItem: (k, v) => void mem.set(k, v),
      removeItem: (k) => void mem.delete(k),
    };
  }
}

export function detectLang(navLang: string | undefined): Lang {
  return navLang?.toLowerCase().startsWith('tr') ? 'tr' : 'en';
}

function detectTheme(): ThemeName {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

interface State {
  lang: Lang;
  level: Level;
  theme: ThemeName;
  completed: string[];
  lastVisited: { lessonId: string; step: number } | null;
  setLang: (lang: Lang) => void;
  setLevel: (level: Level) => void;
  setTheme: (theme: ThemeName) => void;
  markComplete: (lessonId: string) => void;
  setLastVisited: (lessonId: string, step: number) => void;
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      lang: detectLang(typeof navigator === 'undefined' ? undefined : navigator.language),
      level: 'beginner',
      theme: detectTheme(),
      completed: [],
      lastVisited: null,
      setLang: (lang) => set({ lang }),
      setLevel: (level) => set({ level }),
      setTheme: (theme) => set({ theme }),
      markComplete: (lessonId) =>
        set((s) => (s.completed.includes(lessonId) ? s : { completed: [...s.completed, lessonId] })),
      setLastVisited: (lessonId, step) => set({ lastVisited: { lessonId, step } }),
    }),
    {
      name: 'how-dapps-work',
      version: 1,
      storage: createJSONStorage(() => createSafeStorage(() => window.localStorage)),
      partialize: ({ lang, level, theme, completed, lastVisited }) => ({
        lang,
        level,
        theme,
        completed,
        lastVisited,
      }),
    },
  ),
);
