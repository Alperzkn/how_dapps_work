import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconClose, IconLeft } from '../app/icons';
import { lessonPath } from '../app/parseRoute';
import { glossary } from '../content/glossary';
import { lessonById } from '../content/registry';
import { ui } from '../i18n/ui';
import { useStore } from '../state/store';
import { Rich } from './Rich';
import { useTermStore } from './termStore';

/** The one place a term is explained in full. A centered modal on wide screens, a bottom sheet on phones. */
export function TermDialog() {
  const lang = useStore((s) => s.lang);
  const level = useStore((s) => s.level);
  const { stack, push, back, close } = useTermStore();
  const id = stack[stack.length - 1];
  const term = id ? glossary[id] : undefined;
  const [expanded, setExpanded] = useState(false);

  useEffect(() => setExpanded(false), [id]);

  const lesson = term ? lessonById[term.lesson] : undefined;
  return (
    <Dialog.Root open={Boolean(term)} onOpenChange={(o) => !o && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="term-dialog" aria-describedby="term-short" data-expanded={expanded || undefined}>
          {term && (
            <>
              <header className="term-head">
                {stack.length > 1 && (
                  <button type="button" className="icon-btn" onClick={back} aria-label={ui(lang, 'back')}>
                    <IconLeft />
                  </button>
                )}
                <div className="term-title">
                  <span className="chip">{ui(lang, `cat.${term.category}`)}</span>
                  <Dialog.Title>{term.name}</Dialog.Title>
                </div>
                <Dialog.Close className="icon-btn" aria-label={ui(lang, 'close')}>
                  <IconClose />
                </Dialog.Close>
              </header>
              <div className="term-body">
                <p id="term-short" className="term-short">
                  <Rich text={term[lang].short} lang={lang} nested inline />
                </p>
                <div className="term-long prose">
                  <Rich text={term[lang].long} lang={lang} nested />
                  {term.related.length > 0 && (
                    <>
                      <h3>{ui(lang, 'related')}</h3>
                      <div className="chips">
                        {term.related.map((r) => (
                          <button key={r} type="button" className="chip chip-btn" onClick={() => push(r)}>
                            {glossary[r]?.name ?? r}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {lesson && (
                    <p className="term-lesson">
                      {ui(lang, 'learnIn')}:{' '}
                      <Link to={lessonPath(lang, lesson.meta.id, 0, level)} onClick={close}>
                        {lesson.meta.title[lang]}
                      </Link>
                    </p>
                  )}
                </div>
                <button type="button" className="btn term-more" onClick={() => setExpanded(true)}>
                  {ui(lang, 'more')}
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
