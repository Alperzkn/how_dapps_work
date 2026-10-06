import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom';
import { GlossaryPage } from '../glossary/GlossaryPage';
import { TermDialog } from '../glossary/TermDialog';
import { LessonPage } from '../lesson/LessonPage';
import { useStore } from '../state/store';
import { applyTheme } from '../theme/applyTheme';
import { isLang } from '../types';
import { HomePage } from './HomePage';
import { NotFound } from './NotFound';
import { TopBar } from './TopBar';

/** The language in the URL is the source of truth; an unknown one redirects to the stored language. */
function LangShell() {
  const { lang } = useParams();
  const stored = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const theme = useStore((s) => s.theme);
  const valid = isLang(lang);

  useEffect(() => {
    if (valid && lang !== stored) setLang(lang);
  }, [valid, lang, stored, setLang]);
  useEffect(() => {
    if (valid) document.documentElement.lang = lang;
  }, [valid, lang]);
  useEffect(() => applyTheme(theme), [theme]);

  if (!valid) return <Navigate to={`/${stored}`} replace />;
  // Render with the URL language even before the store catches up.
  if (lang !== stored) return null;
  return (
    <div className="app">
      <TopBar />
      <main className="app-main">
        <Outlet />
      </main>
      <TermDialog />
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
