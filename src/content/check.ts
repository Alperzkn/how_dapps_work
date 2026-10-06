import { extractTermIds } from '../glossary/parseMarkup';
import { LANGS, LEVELS, type LessonContent } from '../types';
import { glossary, glossaryList } from './glossary';
import { LESSON_ORDER, lessonById } from './registry';

const sameKeys = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');

/** Returns a list of content problems; empty when everything is consistent. */
export function checkContent(): string[] {
  const problems: string[] = [];
  const checkTerms = (where: string, text: string) => {
    for (const id of extractTermIds(text)) {
      if (!glossary[id]) problems.push(`${where}: unknown term [[${id}]]`);
    }
  };

  for (const id of LESSON_ORDER) {
    const lesson = lessonById[id];
    if (!lesson) {
      problems.push(`lesson ${id}: missing (needs meta.ts, en.ts, tr.ts, views.ts, Scene.tsx)`);
      continue;
    }
    const { meta, content, views } = lesson;
    if (meta.id !== id) problems.push(`lesson ${id}: meta.id is "${meta.id}"`);
    if (new Set(meta.steps).size !== meta.steps.length) problems.push(`lesson ${id}: duplicate step ids`);
    if (!sameKeys(Object.keys(views), meta.steps)) {
      problems.push(`lesson ${id}: views.ts step ids do not match meta.steps`);
    }
    for (const lang of LANGS) {
      const c: LessonContent = content[lang];
      const at = `lesson ${id} [${lang}]`;
      if (!c.title?.trim() || !c.summary?.trim()) problems.push(`${at}: missing title or summary`);
      if (!sameKeys(Object.keys(c.steps), meta.steps)) {
        problems.push(`${at}: step ids do not match meta.steps`);
      }
      for (const stepId of meta.steps) {
        const s = c.steps[stepId];
        if (!s) continue;
        if (!s.title?.trim()) problems.push(`${at} ${stepId}: missing title`);
        if (!s.alt?.trim()) problems.push(`${at} ${stepId}: missing alt`);
        for (const level of LEVELS) {
          const body = s.body?.[level];
          if (!body?.trim()) problems.push(`${at} ${stepId}: missing ${level} text`);
          else checkTerms(`${at} ${stepId} ${level}`, body);
        }
      }
    }
    if (!sameKeys(Object.keys(content.en.labels), Object.keys(content.tr.labels))) {
      problems.push(`lesson ${id}: en and tr label keys differ`);
    }
    for (const stepId of meta.steps) {
      if (Boolean(content.en.steps[stepId]?.code) !== Boolean(content.tr.steps[stepId]?.code)) {
        problems.push(`lesson ${id} ${stepId}: code panel exists in only one language`);
      }
    }
  }

  const seen = new Set<string>();
  for (const t of glossaryList) {
    const at = `term ${t.id}`;
    if (seen.has(t.id)) problems.push(`${at}: defined more than once`);
    seen.add(t.id);
    if (!t.name?.trim()) problems.push(`${at}: missing name`);
    if (!LESSON_ORDER.includes(t.lesson)) problems.push(`${at}: unknown lesson "${t.lesson}"`);
    for (const r of t.related) if (!glossary[r]) problems.push(`${at}: unknown related term "${r}"`);
    for (const lang of LANGS) {
      for (const field of ['short', 'long'] as const) {
        const text = t[lang]?.[field];
        if (!text?.trim()) problems.push(`${at}: missing ${lang}.${field}`);
        else checkTerms(`${at} ${lang}.${field}`, text);
      }
    }
  }
  return problems;
}
