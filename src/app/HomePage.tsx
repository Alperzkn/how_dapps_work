import { Link } from 'react-router-dom';
import { lessonById, lessons } from '../content/registry';
import { ui } from '../i18n/ui';
import { useStore } from '../state/store';
import { LEVELS } from '../types';
import { LessonList } from './LessonList';
import { lessonPath } from './parseRoute';

/** Three stacked isometric blocks, drawn flat so the home page needs no 3D code. */
function HeroArt() {
  const cube = (x: number, y: number, c: string) => (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 20 40 0l40 20-40 20z" fill={c} />
      <path d="M0 20v44l40 20V40z" fill={c} />
      <path d="M0 20v44l40 20V40z" fill="#000" opacity=".16" />
      <path d="M80 20v44L40 84V40z" fill={c} />
      <path d="M80 20v44L40 84V40z" fill="#000" opacity=".3" />
      <path d="M0 20 40 0l40 20-40 20z" fill="#fff" opacity=".28" />
    </g>
  );
  return (
    <svg className="hero-art" viewBox="0 0 300 190" aria-hidden="true">
      <path d="M70 118 110 98M160 73l40-20" stroke="var(--c-chain)" strokeWidth="6" strokeLinecap="round" />
      {cube(10, 96, 'var(--c-block)')}
      {cube(100, 51, 'var(--c-actor)')}
      {cube(190, 6, 'var(--c-token-a)')}
    </svg>
  );
}

export function HomePage() {
  const lang = useStore((s) => s.lang);
  const level = useStore((s) => s.level);
  const setLevel = useStore((s) => s.setLevel);
  const last = useStore((s) => s.lastVisited);
  const resume = last && lessonById[last.lessonId];
  const first = lessons[0];

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <h1>{ui(lang, 'appName')}</h1>
          <p>{ui(lang, 'tagline')}</p>
          <div className="level-cards" role="group" aria-label={ui(lang, 'level')}>
            {LEVELS.map((l) => (
              <button key={l} type="button" className="level-card" aria-pressed={l === level} onClick={() => setLevel(l)}>
                <strong>{ui(lang, `level.${l}`)}</strong>
                <span>{ui(lang, `levelHint.${l}`)}</span>
              </button>
            ))}
          </div>
          <div className="hero-actions">
            {resume ? (
              <Link className="btn btn-primary" to={lessonPath(lang, resume.meta.id, last.step, level)}>
                {ui(lang, 'continue')}: {resume.meta.title[lang]}
              </Link>
            ) : (
              first && (
                <Link className="btn btn-primary" to={lessonPath(lang, first.meta.id, 0, level)}>
                  {ui(lang, 'start')}
                </Link>
              )
            )}
            <Link className="btn" to={`/${lang}/glossary`}>
              {ui(lang, 'glossary')}
            </Link>
          </div>
        </div>
        <HeroArt />
      </section>
      <LessonList />
    </div>
  );
}
