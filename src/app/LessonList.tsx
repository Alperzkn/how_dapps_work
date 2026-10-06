import { Link, useParams } from 'react-router-dom';
import { lessons, lessonsByChapter } from '../content/registry';
import { ui } from '../i18n/ui';
import { useStore } from '../state/store';
import { CHAPTERS } from '../types';
import { IconCheck } from './icons';
import { lessonPath } from './parseRoute';

/** Chapters and their lessons. `compact` is the drawer version; the full one is the home page grid. */
export function LessonList({ compact = false }: { compact?: boolean }) {
  const lang = useStore((s) => s.lang);
  const level = useStore((s) => s.level);
  const completed = useStore((s) => s.completed);
  const { lessonId } = useParams();

  return (
    <nav className={compact ? 'lesson-list compact' : 'lesson-list'} aria-label={ui(lang, 'lessons')}>
      {CHAPTERS.map((chapter) => {
        const items = lessonsByChapter(chapter);
        if (items.length === 0) return null;
        return (
          <section key={chapter}>
            <h2>{ui(lang, `chapter.${chapter}`)}</h2>
            <ol>
              {items.map((l) => {
                const c = l.content[lang];
                const done = completed.includes(l.meta.id);
                return (
                  <li key={l.meta.id}>
                    <Link to={lessonPath(lang, l.meta.id, 0, level)} className="lesson-card" aria-current={l.meta.id === lessonId ? 'page' : undefined}>
                      <span className="lesson-num" data-done={done || undefined}>
                        {done ? <IconCheck /> : lessons.indexOf(l) + 1}
                      </span>
                      <span className="lesson-card-text">
                        <strong>{c.title}</strong>
                        {!compact && <span>{c.summary}</span>}
                      </span>
                      {done && <span className="sr-only">{ui(lang, 'done')}</span>}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </nav>
  );
}
