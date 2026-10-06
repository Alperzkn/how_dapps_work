import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ui } from '../i18n/ui';
import { lessons } from '../content/registry';
import { useStore } from '../state/store';
import { applyTheme } from '../theme/applyTheme';
import { LANGS, type Lang } from '../types';
import { IconBook, IconClose, IconGear, IconMenu, IconMoon, IconSun, Logo } from './icons';
import { LessonList } from './LessonList';

function LangToggle() {
  const lang = useStore((s) => s.lang);
  const { pathname, search } = useLocation();
  const setLang = useStore((s) => s.setLang);
  const navigate = useNavigate();
  // Update the store in the same tick as the URL so the page does not remount.
  const switchTo = (next: Lang) => {
    setLang(next);
    navigate(pathname.replace(/^\/[^/]+/, `/${next}`) + search, { replace: true });
  };
  return (
    <div className="seg" role="group" aria-label={ui(lang, 'language')}>
      {LANGS.map((l) => (
        <button key={l} type="button" aria-pressed={l === lang} onClick={() => switchTo(l)} lang={l}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const lang = useStore((s) => s.lang);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const next = theme === 'light' ? 'dark' : 'light';
  // Where supported, the new theme spreads out in a circle from the button that was pressed.
  const toggle = (e: MouseEvent) => {
    const apply = () => {
      flushSync(() => setTheme(next));
      applyTheme(next);
    };
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || still) return apply();
    const root = document.documentElement;
    root.style.setProperty('--vt-x', `${e.clientX}px`);
    root.style.setProperty('--vt-y', `${e.clientY}px`);
    document.startViewTransition(apply);
  };
  return (
    <button type="button" className={withLabel ? 'btn theme-toggle' : 'icon-btn theme-toggle'} data-theme-now={theme} onClick={toggle} aria-label={`${ui(lang, 'theme')}: ${ui(lang, next)}`}>
      {theme === 'light' ? <IconMoon /> : <IconSun />}
      {withLabel && <span>{ui(lang, next)}</span>}
    </button>
  );
}

export function TopBar() {
  const lang = useStore((s) => s.lang);
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const [settings, setSettings] = useState(false);
  const completed = useStore((s) => s.completed);
  const doneCount = lessons.filter((l) => completed.includes(l.meta.id)).length;

  useEffect(() => {
    setMenu(false);
    setSettings(false);
  }, [pathname]);

  return (
    <header className="topbar">
      <Dialog.Root open={menu} onOpenChange={setMenu}>
        <Dialog.Trigger className="icon-btn" aria-label={ui(lang, 'lessons')}>
          <IconMenu />
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="overlay" />
          <Dialog.Content className="drawer" aria-describedby={undefined}>
            <header className="drawer-head">
              <Dialog.Title>{ui(lang, 'lessons')}</Dialog.Title>
              <Dialog.Close className="icon-btn" aria-label={ui(lang, 'close')}>
                <IconClose />
              </Dialog.Close>
            </header>
            <LessonList compact />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Link to={`/${lang}`} className="brand">
        <Logo />
        <span>{ui(lang, 'appName')}</span>
      </Link>

      <Link to={`/${lang}`} className="progress-ring" aria-label={`${doneCount} / ${lessons.length} ${ui(lang, 'lessonsDone')}`} title={`${doneCount} / ${lessons.length} ${ui(lang, 'lessonsDone')}`}>
        <svg viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="15" />
          <circle cx="18" cy="18" r="15" pathLength="100" strokeDasharray={`${(doneCount / Math.max(lessons.length, 1)) * 100} 100`} />
        </svg>
        <span>{doneCount}</span>
      </Link>

      <div className="topbar-wide">
        <Link to={`/${lang}/glossary`} className="btn btn-quiet">
          <IconBook />
          <span>{ui(lang, 'glossary')}</span>
        </Link>
        <LangToggle />
        <ThemeToggle />
      </div>

      <Dialog.Root open={settings} onOpenChange={setSettings}>
        <Dialog.Trigger className="icon-btn topbar-narrow" aria-label={ui(lang, 'settings')}>
          <IconGear />
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="overlay" />
          <Dialog.Content className="sheet" aria-describedby={undefined}>
            <header className="drawer-head">
              <Dialog.Title>{ui(lang, 'settings')}</Dialog.Title>
              <Dialog.Close className="icon-btn" aria-label={ui(lang, 'close')}>
                <IconClose />
              </Dialog.Close>
            </header>
            <div className="sheet-rows">
              <div className="sheet-row">
                <span>{ui(lang, 'language')}</span>
                <LangToggle />
              </div>
              <div className="sheet-row">
                <span>{ui(lang, 'theme')}</span>
                <ThemeToggle withLabel />
              </div>
              <Link to={`/${lang}/glossary`} className="btn">
                <IconBook />
                <span>{ui(lang, 'glossary')}</span>
              </Link>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  );
}
