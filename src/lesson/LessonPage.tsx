import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { IconExpand, IconClose, IconReset } from '../app/icons';
import { NotFound } from '../app/NotFound';
import { lessonPath, parseLessonRoute } from '../app/parseRoute';
import { lessonById, neighbors } from '../content/registry';
import { parseMarkup } from '../glossary/parseMarkup';
import { Rich } from '../glossary/Rich';
import { useTermStore } from '../glossary/termStore';
import { ui } from '../i18n/ui';
import { Fallback } from '../scene/Fallback';
import { SceneBoundary } from '../scene/SceneBoundary';
import { SceneCanvas, hasWebGL } from '../scene/SceneCanvas';
import type { SceneProps } from '../scene/types';
import { useStore } from '../state/store';
import { LEVELS, type Level } from '../types';
import { swipeHandlers, useReducedMotion, useSceneModule } from './hooks';
import { LevelSwitch } from './LevelSwitch';
import { StepControls } from './StepControls';

/** First sentence of a step's text, for the one-line presentation caption. */
function firstSentence(body: string): string {
  const block = parseMarkup(body)[0];
  if (!block) return '';
  const raw = body.trim().split(/\n\s*\n/)[0].replace(/\n/g, ' ');
  if (block.kind !== 'p') return '';
  const m = raw.match(/^.*?[.!?](?=\s|$)/);
  return m ? m[0] : raw;
}

export function LessonPage() {
  const { lessonId = '', step } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const lang = useStore((s) => s.lang);
  const theme = useStore((s) => s.theme);
  const storedLevel = useStore((s) => s.level);
  const setLevel = useStore((s) => s.setLevel);
  const markComplete = useStore((s) => s.markComplete);
  const setLastVisited = useStore((s) => s.setLastVisited);
  const termOpen = useTermStore((s) => s.stack.length > 0);
  const reducedMotion = useReducedMotion();

  const lesson = lessonById[lessonId];
  const stepCount = lesson?.meta.steps.length ?? 1;
  const { stepIndex, level } = parseLessonRoute(step, search.get('level'), stepCount, storedLevel);
  const { mod, failed, attempt, retry } = useSceneModule(lesson);

  const [present, setPresent] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [lost, setLost] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (level !== storedLevel) setLevel(level);
  }, [level, storedLevel, setLevel]);

  useEffect(() => {
    if (!lesson) return;
    setLastVisited(lessonId, stepIndex);
    if (stepIndex === stepCount - 1) markComplete(lessonId);
    textRef.current?.scrollTo({ top: 0 });
  }, [lesson, lessonId, stepIndex, stepCount, setLastVisited, markComplete]);

  useEffect(() => setLost(false), [lessonId, attempt]);

  const go = useCallback(
    (i: number) => {
      if (i < 0 || i >= stepCount || i === stepIndex) return;
      navigate(lessonPath(lang, lessonId, i, level));
    },
    [navigate, lang, lessonId, level, stepCount, stepIndex],
  );
  const changeLevel = useCallback(
    (l: Level) => {
      setLevel(l);
      navigate(lessonPath(lang, lessonId, stepIndex, l), { replace: true });
    },
    [navigate, setLevel, lang, lessonId, stepIndex],
  );

  useEffect(() => {
    document.documentElement.toggleAttribute('data-present', present);
    return () => document.documentElement.removeAttribute('data-present');
  }, [present]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (termOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, select, [role="dialog"]')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') go(stepIndex + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(stepIndex - 1);
      else if (present && e.key === ' ') go(stepIndex + 1);
      else if (present && e.key === 'Escape') setPresent(false);
      else if (present && e.key.toLowerCase() === 'l') changeLevel(LEVELS[(LEVELS.indexOf(level) + 1) % LEVELS.length]);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, changeLevel, stepIndex, present, level, termOpen]);

  const swipe = useMemo(() => swipeHandlers((dir) => go(stepIndex + dir)), [go, stepIndex]);

  if (!lesson) return <NotFound />;

  const content = lesson.content[lang];
  const stepId = lesson.meta.steps[stepIndex];
  const stepContent = content.steps[stepId];
  const view = lesson.views[stepId];
  const { next } = neighbors(lessonId);
  const isLast = stepIndex === stepCount - 1;
  const sceneProps: SceneProps = { stepId, stepIndex, level, lang, labels: content.labels, reducedMotion };
  const Scene = mod?.default;
  const Controls = mod?.Controls;
  const noGl = !hasWebGL() || lost;

  const fallback = (note: string, canRetry: boolean) => (
    <Fallback lessonId={lessonId} stepId={stepId} alt={stepContent.alt} note={note} retryLabel={ui(lang, 'retry')} onRetry={canRetry ? retry : undefined} />
  );

  return (
    <div className="lesson" data-present={present || undefined}>
      <section className="lesson-scene" aria-label={stepContent.alt}>
        {noGl ? (
          fallback(ui(lang, 'sceneUnavailable'), false)
        ) : failed ? (
          fallback(ui(lang, 'sceneError'), true)
        ) : Scene ? (
          <SceneBoundary resetKey={`${lessonId}:${attempt}`} fallback={fallback(ui(lang, 'sceneError'), true)}>
            <SceneCanvas key={`${lessonId}:${attempt}`} view={view} level={level} lang={lang} theme={theme} reducedMotion={reducedMotion} resetKey={resetKey} onContextLost={() => setLost(true)}>
              <Scene {...sceneProps} />
            </SceneCanvas>
          </SceneBoundary>
        ) : (
          <p className="scene-loading">{ui(lang, 'sceneLoading')}</p>
        )}

        <div className="scene-tools">
          {!noGl && (
            <button type="button" className="icon-btn" onClick={() => setResetKey((k) => k + 1)} aria-label={ui(lang, 'resetView')} title={ui(lang, 'resetView')}>
              <IconReset />
            </button>
          )}
          <button type="button" className="icon-btn present-btn" onClick={() => setPresent((p) => !p)} aria-label={ui(lang, present ? 'exitPresent' : 'present')} title={ui(lang, present ? 'exitPresent' : 'present')}>
            {present ? <IconClose /> : <IconExpand />}
          </button>
        </div>

        {Controls && !noGl && (
          <div className="scene-controls">
            <Controls {...sceneProps} />
          </div>
        )}

        {present && (
          <div className="caption">
            <strong>{stepContent.title}</strong>
            <span>
              <Rich text={firstSentence(stepContent.body[level])} lang={lang} inline />
            </span>
            <small>
              {ui(lang, `level.${level}`)} · {stepIndex + 1}/{stepCount} · {ui(lang, 'presentHint')}
            </small>
          </div>
        )}
      </section>

      <section className="lesson-text" ref={textRef} {...swipe}>
        <header className="lesson-head">
          <p className="crumbs">
            {ui(lang, `chapter.${lesson.meta.chapter}`)} · {content.title}
          </p>
          <LevelSwitch lang={lang} level={level} onChange={changeLevel} />
        </header>
        <article className="prose" key={`${stepId}:${level}`}>
          <h1>{stepContent.title}</h1>
          <Rich text={stepContent.body[level]} lang={lang} />
          {level === 'expert' && stepContent.code && (
            <details className="code-panel" open>
              <summary>
                {ui(lang, 'code')} · {stepContent.code.lang}
              </summary>
              <pre>
                <code>{stepContent.code.source.trim()}</code>
              </pre>
            </details>
          )}
          {isLast &&
            (next ? (
              <Link className="btn btn-primary next-lesson" to={lessonPath(lang, next.meta.id, 0, level)}>
                {ui(lang, 'nextLesson')}: {next.content[lang].title}
              </Link>
            ) : (
              <p className="next-lesson">
                {ui(lang, 'finished')} <Link to={`/${lang}`}>{ui(lang, 'backHome')}</Link>
              </p>
            ))}
        </article>
        <p className="sr-only" aria-live="polite">
          {ui(lang, 'step')} {stepIndex + 1} {ui(lang, 'of')} {stepCount}: {stepContent.alt}
        </p>
      </section>

      <StepControls lang={lang} index={stepIndex} titles={lesson.meta.steps.map((id) => content.steps[id].title)} onGo={go} />
    </div>
  );
}
