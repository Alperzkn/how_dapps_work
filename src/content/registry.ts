import type { ChapterId, Lang, LessonContent, LessonMeta } from '../types';
import type { SceneModule, StepView } from '../scene/types';

/** Reading order. A lesson appears in the app once its files exist. */
export const LESSON_ORDER = [
  'blockchain',
  'transactions',
  'network',
  'pow',
  'pos',
  'btc-vs-eth',
  'other-l1s',
  'dapp',
  'uniswap-v2',
  'uniswap-v3',
  'uniswap-v4',
];

export interface LessonEntry {
  meta: LessonMeta;
  views: Record<string, StepView>;
  /** Lesson text is loaded per lesson and language, so the home page stays small. */
  loadContent: (lang: Lang) => Promise<LessonContent>;
  load: () => Promise<SceneModule>;
}

type Loader<T> = (() => Promise<T>) | undefined;

const metas = import.meta.glob<{ default: LessonMeta }>('./lessons/*/meta.ts', { eager: true });
const texts: Record<string, Loader<{ default: LessonContent }>> = import.meta.glob<{ default: LessonContent }>('./lessons/*/{en,tr}.ts');
const views = import.meta.glob<{ views: Record<string, StepView> }>('../scenes/*/views.ts', {
  eager: true,
});
const scenes: Record<string, Loader<SceneModule>> = import.meta.glob<SceneModule>('../scenes/*/Scene.tsx');

export const lessons: LessonEntry[] = LESSON_ORDER.flatMap((id) => {
  const meta = metas[`./lessons/${id}/meta.ts`]?.default;
  const en = texts[`./lessons/${id}/en.ts`];
  const tr = texts[`./lessons/${id}/tr.ts`];
  const v = views[`../scenes/${id}/views.ts`]?.views;
  const load = scenes[`../scenes/${id}/Scene.tsx`];
  if (!meta || !en || !tr || !v || !load) return [];
  const loadContent = (lang: Lang) => (lang === 'tr' ? tr : en)().then((m) => m.default);
  return [{ meta, views: v, loadContent, load }];
});

export const lessonById: Record<string, LessonEntry> = Object.fromEntries(
  lessons.map((l) => [l.meta.id, l]),
);

export const lessonsByChapter = (chapter: ChapterId) =>
  lessons.filter((l) => l.meta.chapter === chapter);

export function neighbors(lessonId: string): { prev?: LessonEntry; next?: LessonEntry } {
  const i = lessons.findIndex((l) => l.meta.id === lessonId);
  return { prev: lessons[i - 1], next: lessons[i + 1] };
}
