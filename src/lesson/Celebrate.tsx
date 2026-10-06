import type { CSSProperties } from 'react';

const BITS = [
  { x: -150, y: -70, c: 'var(--c-block)', d: 0 },
  { x: -95, y: -130, c: 'var(--c-tx)', d: 40 },
  { x: -30, y: -160, c: 'var(--c-actor)', d: 90 },
  { x: 45, y: -150, c: 'var(--c-token-a)', d: 20 },
  { x: 110, y: -120, c: 'var(--c-token-b)', d: 70 },
  { x: 160, y: -60, c: 'var(--c-valid)', d: 110 },
  { x: -120, y: 30, c: 'var(--c-token-b)', d: 60 },
  { x: 125, y: 40, c: 'var(--c-tx)', d: 30 },
];

/** Shown once when a lesson is finished for the first time: a block lands and joins the chain. */
export function Celebrate({ title, note }: { title: string; note: string }) {
  return (
    <div className="celebrate" role="status">
      <div className="celebrate-burst" aria-hidden="true">
        {BITS.map((b, i) => (
          <i key={i} style={{ '--x': `${b.x}px`, '--y': `${b.y}px`, background: b.c, animationDelay: `${420 + b.d}ms` } as CSSProperties} />
        ))}
      </div>
      <svg className="celebrate-block" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M60 18 104 40 60 62 16 40z" fill="var(--c-platform)" />
        <path d="M16 40v44l44 22V62z" fill="var(--c-valid)" />
        <path d="M104 40v44L60 106V62z" fill="var(--c-valid)" />
        <path d="M104 40v44L60 106V62z" fill="#000" opacity=".22" />
        <path d="M44 40l11 6 22-12" fill="none" stroke="var(--c-valid)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p>
        <strong>{title}</strong>
        <span>{note}</span>
      </p>
    </div>
  );
}
