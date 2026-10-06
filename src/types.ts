export type Lang = 'en' | 'tr';
export type Level = 'beginner' | 'intermediate' | 'expert';
export type ThemeName = 'light' | 'dark';
export type ChapterId = 'basics' | 'consensus' | 'l1' | 'dapps';

export const LANGS: Lang[] = ['en', 'tr'];
export const LEVELS: Level[] = ['beginner', 'intermediate', 'expert'];
export const CHAPTERS: ChapterId[] = ['basics', 'consensus', 'l1', 'dapps'];

export const isLang = (v: unknown): v is Lang => v === 'en' || v === 'tr';
export const isLevel = (v: unknown): v is Level =>
  v === 'beginner' || v === 'intermediate' || v === 'expert';

export interface LessonMeta {
  id: string;
  chapter: ChapterId;
  /** Ordered step ids. */
  steps: string[];
}

export interface StepContent {
  title: string;
  /** Markup: paragraphs split by a blank line, **bold**, `code`, [[term-id]]. */
  body: Record<Level, string>;
  /** What the scene shows, for screen readers and the no-WebGL fallback. */
  alt: string;
  /** Shown at expert level only. */
  code?: { lang: string; source: string };
}

export interface LessonContent {
  title: string;
  summary: string;
  steps: Record<string, StepContent>;
  /** Strings used inside the scene and its controls. */
  labels: Record<string, string>;
}

export type TermCategory = 'basics' | 'crypto' | 'consensus' | 'chains' | 'dapps' | 'defi';

export interface GlossaryTerm {
  id: string;
  /** Canonical English name; shown untranslated in both languages. */
  name: string;
  category: TermCategory;
  related: string[];
  lesson: string;
  en: { short: string; long: string };
  tr: { short: string; long: string };
}
