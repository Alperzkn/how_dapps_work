import * as Tooltip from '@radix-ui/react-tooltip';
import { Fragment, useMemo } from 'react';
import { glossary } from '../content/glossary';
import type { Lang } from '../types';
import { parseInline, parseMarkup, termText, type Inline } from './parseMarkup';
import { useTermStore } from './termStore';

/** Markup as plain text, for tooltips and captions. */
export function plainText(text: string, lang: Lang): string {
  return parseInline(text)
    .map((n) => (n.t === 'term' ? termText(n.shown ?? glossary[n.id]?.name ?? n.id, lang) : n.v))
    .join('');
}

function Term({ id, shown, lang, nested }: { id: string; shown?: string; lang: Lang; nested: boolean }) {
  const term = glossary[id];
  const open = useTermStore((s) => (nested ? s.push : s.open));
  const text = termText(shown ?? term?.name ?? id, lang);
  if (!term) return <span>{text}</span>;
  const button = (
    <button type="button" className="term" onClick={() => open(id)}>
      {text}
    </button>
  );
  if (nested) return button;
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="term-tip" sideOffset={6} collisionPadding={12}>
          <strong>{term.name}</strong>
          <span>{plainText(term[lang].short, lang)}</span>
          <Tooltip.Arrow className="term-tip-arrow" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function Inlines({ nodes, lang, nested }: { nodes: Inline[]; lang: Lang; nested: boolean }) {
  return (
    <>
      {nodes.map((n, i) => {
        if (n.t === 'term') return <Term key={i} id={n.id} shown={n.shown} lang={lang} nested={nested} />;
        if (n.t === 'bold') return <strong key={i}>{n.v}</strong>;
        if (n.t === 'em') return <em key={i}>{n.v}</em>;
        if (n.t === 'code') return <code key={i}>{n.v}</code>;
        return <Fragment key={i}>{n.v}</Fragment>;
      })}
    </>
  );
}

interface RichProps {
  text: string;
  lang: Lang;
  /** Inside the term dialog: terms open on top of the current one, without a tooltip. */
  nested?: boolean;
  /** Render a single line without paragraph wrappers. */
  inline?: boolean;
}

/** Renders lesson markup: paragraphs, lists, bold, code and glossary terms. */
export function Rich({ text, lang, nested = false, inline = false }: RichProps) {
  const blocks = useMemo(() => parseMarkup(text), [text]);
  if (inline) return <Inlines nodes={parseInline(text)} lang={lang} nested={nested} />;
  return (
    <>
      {blocks.map((b, i) =>
        b.kind === 'p' ? (
          <p key={i}>
            <Inlines nodes={b.inl} lang={lang} nested={nested} />
          </p>
        ) : (
          <ul key={i}>
            {b.items.map((item, j) => (
              <li key={j}>
                <Inlines nodes={item} lang={lang} nested={nested} />
              </li>
            ))}
          </ul>
        ),
      )}
    </>
  );
}
