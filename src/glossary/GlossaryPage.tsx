import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { NotFound } from '../app/NotFound';
import { glossary, glossaryList } from '../content/glossary';
import { ui } from '../i18n/ui';
import { useStore } from '../state/store';
import type { TermCategory } from '../types';
import { plainText } from './Rich';
import { useTermStore } from './termStore';

const CATEGORIES: TermCategory[] = ['basics', 'crypto', 'consensus', 'chains', 'dapps', 'defi'];

export function GlossaryPage() {
  const lang = useStore((s) => s.lang);
  const { termId } = useParams();
  const open = useTermStore((s) => s.open);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<TermCategory | 'all'>('all');

  // A term in the URL opens straight into its dialog.
  useEffect(() => {
    if (termId && glossary[termId]) open(termId);
  }, [termId, open]);

  const items = useMemo(() => {
    const q = query.trim().toLocaleLowerCase(lang);
    return glossaryList
      .filter((t) => cat === 'all' || t.category === cat)
      .filter((t) => !q || t.name.toLowerCase().includes(q) || plainText(t[lang].short, lang).toLocaleLowerCase(lang).includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  }, [query, cat, lang]);

  if (termId && !glossary[termId]) return <NotFound />;

  return (
    <div className="glossary">
      <h1>{ui(lang, 'glossary')}</h1>
      <input className="search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ui(lang, 'search')} aria-label={ui(lang, 'search')} />
      <div className="chips" role="group" aria-label={ui(lang, 'glossary')}>
        {(['all', ...CATEGORIES] as const).map((c) => (
          <button key={c} type="button" className="chip chip-btn" aria-pressed={c === cat} onClick={() => setCat(c)}>
            {c === 'all' ? ui(lang, 'all') : ui(lang, `cat.${c}`)}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="muted">{ui(lang, 'noResults')}</p>
      ) : (
        <ul className="term-grid">
          {items.map((t) => (
            <li key={t.id}>
              <button type="button" className="term-card" onClick={() => open(t.id)}>
                <strong>{t.name}</strong>
                <span>{plainText(t[lang].short, lang)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
