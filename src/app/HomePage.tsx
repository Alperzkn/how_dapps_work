import { LayoutGroup, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { lessonById, lessons } from '../content/registry';
import { ui } from '../i18n/ui';
import { useStore } from '../state/store';
import { LEVELS, type Level } from '../types';
import { CourseMap } from './CourseMap';
import { LessonList } from './LessonList';
import { lessonPath } from './parseRoute';

/** One, two or three stacked layers: how deep the chosen level goes. */
function DepthGlyph({ level }: { level: Level }) {
  const depth = LEVELS.indexOf(level) + 1;
  return (
    <svg className="depth-glyph" viewBox="0 0 40 34" aria-hidden="true">
      {[2, 1, 0].map((i) => (
        <path key={i} d={`M20 ${4 + i * 8} 36 ${12 + i * 8} 20 ${20 + i * 8} 4 ${12 + i * 8}z`} data-on={i < depth || undefined} />
      ))}
    </svg>
  );
}

export function HomePage() {
  const lang = useStore((s) => s.lang);
  const level = useStore((s) => s.level);
  const setLevel = useStore((s) => s.setLevel);
  const last = useStore((s) => s.lastVisited);
  const completed = useStore((s) => s.completed);
  const resume = last && lessonById[last.lessonId];
  const first = lessons[0];
  const done = lessons.filter((l) => completed.includes(l.meta.id)).length;

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <h1>{ui(lang, 'heroTitle')}</h1>
          <p>{ui(lang, 'tagline')}</p>
          <p className="scope-note">{ui(lang, 'scopeNote')}</p>

          <LayoutGroup id="home-level">
            <div className="level-cards" role="group" aria-label={ui(lang, 'level')}>
              {LEVELS.map((l) => (
                <button key={l} type="button" className="level-card" aria-pressed={l === level} onClick={() => setLevel(l)}>
                  {l === level && <motion.span layoutId="pick" className="level-card-pick" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                  <DepthGlyph level={l} />
                  <strong>{ui(lang, `level.${l}`)}</strong>
                  <span>{ui(lang, `levelHint.${l}`)}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>

          <div className="hero-actions">
            {resume ? (
              <Link className="btn btn-primary btn-big" to={lessonPath(lang, resume.meta.id, last.step, level)}>
                {ui(lang, 'continue')}: {resume.meta.title[lang]}
              </Link>
            ) : (
              first && (
                <Link className="btn btn-primary btn-big" to={lessonPath(lang, first.meta.id, 0, level)}>
                  {ui(lang, 'start')}
                </Link>
              )
            )}
            <Link className="btn btn-big" to={`/${lang}/glossary`}>
              {ui(lang, 'glossary')}
            </Link>
          </div>

          <div className="hero-progress" role="img" aria-label={`${done} / ${lessons.length} ${ui(lang, 'lessonsDone')}`}>
            <div className="hero-progress-bar">
              <span style={{ width: `${(done / Math.max(lessons.length, 1)) * 100}%` }} />
            </div>
            <span>
              {done} / {lessons.length} {ui(lang, 'lessonsDone')}
            </span>
          </div>
        </div>
        <CourseMap />
      </section>
      <LessonList />
    </div>
  );
}
