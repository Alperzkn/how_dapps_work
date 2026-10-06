import { LayoutGroup, motion } from 'motion/react';
import { ui } from '../i18n/ui';
import { LEVELS, type Lang, type Level } from '../types';

export function LevelSwitch({ lang, level, onChange }: { lang: Lang; level: Level; onChange: (l: Level) => void }) {
  return (
    <LayoutGroup id="level-switch">
      <div className="seg level-switch" role="group" aria-label={ui(lang, 'level')}>
        {LEVELS.map((l) => (
          <button key={l} type="button" aria-pressed={l === level} onClick={() => onChange(l)} data-level={l}>
            {/* The highlight slides between options instead of jumping. */}
            {l === level && <motion.span layoutId="thumb" className="seg-thumb" data-tone={l} transition={{ type: 'spring', stiffness: 480, damping: 36 }} />}
            <span>{ui(lang, `level.${l}`)}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}
