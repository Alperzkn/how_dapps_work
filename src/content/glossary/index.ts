import type { GlossaryTerm } from '../../types';

// One file per lesson: ./terms/<lessonId>.ts, default-exporting GlossaryTerm[].
const files = import.meta.glob<{ default: GlossaryTerm[] }>('./terms/*.ts', { eager: true });

export const glossaryList: GlossaryTerm[] = Object.values(files).flatMap((f) => f.default);

export const glossary: Record<string, GlossaryTerm> = Object.fromEntries(
  glossaryList.map((t) => [t.id, t]),
);
