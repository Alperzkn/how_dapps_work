import { IconLeft, IconRight } from '../app/icons';
import { ui } from '../i18n/ui';
import type { Lang } from '../types';

interface Props {
  lang: Lang;
  index: number;
  titles: string[];
  onGo: (index: number) => void;
}

export function StepControls({ lang, index, titles, onGo }: Props) {
  const last = titles.length - 1;
  return (
    <div className="step-controls">
      <button type="button" className="btn step-prev" onClick={() => onGo(index - 1)} disabled={index === 0}>
        <IconLeft />
        <span>{ui(lang, 'prev')}</span>
      </button>
      {/* The steps drawn as a small chain: each one a block linked to the next. */}
      <ol className="step-dots" aria-label={`${ui(lang, 'step')} ${index + 1} ${ui(lang, 'of')} ${titles.length}`}>
        {titles.map((title, i) => (
          <li key={i} data-past={i < index || undefined}>
            <button type="button" title={title} aria-label={`${ui(lang, 'step')} ${i + 1}: ${title}`} aria-current={i === index ? 'step' : undefined} data-past={i < index || undefined} onClick={() => onGo(i)}>
              <span>{i + 1}</span>
            </button>
          </li>
        ))}
      </ol>
      <span className="step-count" aria-hidden="true">
        {index + 1} {ui(lang, 'of')} {titles.length}
      </span>
      <button type="button" className="btn btn-primary step-next" onClick={() => onGo(index + 1)} disabled={index === last}>
        <span>{ui(lang, 'next')}</span>
        <IconRight />
      </button>
    </div>
  );
}
