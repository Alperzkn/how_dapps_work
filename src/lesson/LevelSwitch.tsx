import { ui } from '../i18n/ui';
import { LEVELS, type Lang, type Level } from '../types';

export function LevelSwitch({ lang, level, onChange }: { lang: Lang; level: Level; onChange: (l: Level) => void }) {
  return (
    <div className="seg level-switch" role="group" aria-label={ui(lang, 'level')}>
      {LEVELS.map((l) => (
        <button key={l} type="button" aria-pressed={l === level} onClick={() => onChange(l)} data-level={l}>
          {ui(lang, `level.${l}`)}
        </button>
      ))}
    </div>
  );
}
