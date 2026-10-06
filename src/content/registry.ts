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
  content: Record<Lang, LessonContent>;
  views: Record<string, StepView>;
  load: () => Promise<SceneModule>;
}

const metas = import.meta.glob<{ default: LessonMeta }>('./lessons/*/meta.ts', { eager: true });
const en = import.meta.glob<{ default: LessonContent }>('./lessons/*/en.ts', { eager: true });
const tr = import.meta.glob<{ default: LessonContent }>('./lessons/*/tr.ts', { eager: true });
const views = import.meta.glob<{ views: Record<string, StepView> }>('../scenes/*/views.ts', {
  eager: true,
});
const scenes: Record<string, (() => Promise<SceneModule>) | undefined> = import.meta.glob<SceneModule>('../scenes/*/Scene.tsx');

export const lessons: LessonEntry[] = LESSON_ORDER.flatMap((id) => {
  const meta = metas[`./lessons/${id}/meta.ts`]?.default;
  const e = en[`./lessons/${id}/en.ts`]?.default;
  const t = tr[`./lessons/${id}/tr.ts`]?.default;
  const v = views[`../scenes/${id}/views.ts`]?.views;
  const load = scenes[`../scenes/${id}/Scene.tsx`];
  return meta && e && t && v && load ? [{ meta, content: { en: e, tr: t }, views: v, load }] : [];
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
