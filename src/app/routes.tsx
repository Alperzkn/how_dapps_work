import { lazy, Suspense, useEffect, useLayoutEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom';
import { useStore } from '../state/store';
import { applyTheme } from '../theme/applyTheme';
import { isLang } from '../types';
import { HomePage } from './HomePage';
import { NotFound } from './NotFound';
import { TopBar } from './TopBar';

// The lesson page pulls in three.js; keep it out of the first load.
const LessonPage = lazy(() => import('../lesson/LessonPage').then((m) => ({ default: m.LessonPage })));
// The glossary text is only needed once a term can be opened.
const TermDialog = lazy(() => import('../glossary/TermDialog').then((m) => ({ default: m.TermDialog })));
const GlossaryPage = lazy(() => import('../glossary/GlossaryPage').then((m) => ({ default: m.GlossaryPage })));

/** The language in the URL is the source of truth; an unknown one redirects to the stored language. */
function LangShell() {
  const { lang } = useParams();
  const stored = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const theme = useStore((s) => s.theme);
  const valid = isLang(lang);

  // Before paint, so a deep link in the other language never flashes the stored one.
  useLayoutEffect(() => {
    if (valid && lang !== stored) setLang(lang);
  }, [valid, lang, stored, setLang]);
  useEffect(() => {
    if (valid) document.documentElement.lang = lang;
  }, [valid, lang]);
  useEffect(() => applyTheme(theme), [theme]);

  if (!valid) return <Navigate to={`/${stored}`} replace />;
  return (
    <div className="app">
      <TopBar />
      <main className="app-main">
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <TermDialog />
      </Suspense>
    </div>
  );
}

function RootRedirect() {
  const lang = useStore((s) => s.lang);
  return <Navigate to={`/${lang}`} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/:lang" element={<LangShell />}>
        <Route index element={<HomePage />} />
        <Route path="lesson/:lessonId/:step?" element={<LessonPage />} />
        <Route path="glossary/:termId?" element={<GlossaryPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
