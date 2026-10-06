import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { lessons } from '../content/registry';
import { ui } from '../i18n/ui';
import { useReducedMotion } from '../lesson/hooks';
import { useStore } from '../state/store';
import { CHAPTERS, type ChapterId } from '../types';
import { lessonPath } from './parseRoute';

// The course drawn as what it teaches: a chain of blocks, one per lesson,
// stepping down through the chapters. Plain SVG, so the home page needs no 3D code.

const K = 40; // screen px per grid unit
const H = 20; // block height in px
const S = 0.5; // half a block's footprint, in grid units
const iso = (x: number, y: number): [number, number] => [(x - y) * K, ((x + y) * K) / 2];

/** Grid position of each lesson: runs alternate direction at every chapter, like a staircase. */
const G = 2.2; // grid distance between neighbouring lessons
const SPOTS: [number, number][] = (
  [
    [0, 0], [1, 0], [2, 0],
    [2, 1], [2, 2],
    [3, 2], [4, 2], [5, 2],
    [5, 3], [5, 4], [5, 5],
    [6, 5], [7, 5], [8, 5], [9, 5],
  ] as [number, number][]
).map(([x, y]) => [x * G, y * G]);

const CHAPTER_COLOR: Record<ChapterId, string> = {
  basics: 'var(--c-block)',
  consensus: 'var(--c-actor)',
  l1: 'var(--c-token-b)',
  dapps: 'var(--c-tx)',
  defi: 'var(--c-token-a)',
};

const pts = (list: [number, number][]) => list.map((p) => p.join(',')).join(' ');

function Cube({ x, y, color }: { x: number; y: number; color: string }) {
  const [ax, ay] = iso(x - S, y - S);
  const [bx, by] = iso(x + S, y - S);
  const [cx, cy] = iso(x + S, y + S);
  const [dx, dy] = iso(x - S, y + S);
  return (
    <>
      <polygon points={pts([[dx, dy - H], [cx, cy - H], [cx, cy], [dx, dy]])} fill={color} />
      <polygon points={pts([[dx, dy - H], [cx, cy - H], [cx, cy], [dx, dy]])} fill="#000" opacity=".12" />
      <polygon points={pts([[bx, by - H], [cx, cy - H], [cx, cy], [bx, by]])} fill={color} />
      <polygon points={pts([[bx, by - H], [cx, cy - H], [cx, cy], [bx, by]])} fill="#000" opacity=".28" />
      <polygon points={pts([[ax, ay - H], [bx, by - H], [cx, cy - H], [dx, dy - H]])} fill="var(--c-platform)" />
      <polygon points={pts([[ax, ay - H], [bx, by - H], [cx, cy - H], [dx, dy - H]])} fill={color} opacity=".18" />
    </>
  );
}

export function CourseMap() {
  const lang = useStore((s) => s.lang);
  const level = useStore((s) => s.level);
  const completed = useStore((s) => s.completed);
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  // The lesson to continue with: the first one not finished yet.
  const nextIndex = Math.max(0, lessons.findIndex((l) => !completed.includes(l.meta.id)));
  const [focus, setFocus] = useState<number | null>(null);
  const shown = lessons[focus ?? nextIndex];
  if (!shown) return null;

  const spots = SPOTS.slice(0, lessons.length);
  const centers = spots.map(([x, y]) => iso(x, y));
  const track = centers.map(([sx, sy], i) => `${i ? 'L' : 'M'}${sx},${sy - H / 2}`).join(' ');
  const doneUntil = lessons.findIndex((l) => !completed.includes(l.meta.id));
  const doneTrack = centers
    .slice(0, doneUntil === -1 ? centers.length : doneUntil + 1)
    .map(([sx, sy], i) => `${i ? 'L' : 'M'}${sx},${sy - H / 2}`)
    .join(' ');

  // One slab per chapter under its run of blocks.
  const slabs = CHAPTERS.flatMap((chapter) => {
    const idx = lessons.map((l, i) => (l.meta.chapter === chapter ? i : -1)).filter((i) => i >= 0);
    if (!idx.length) return [];
    const xs = idx.map((i) => spots[i][0]);
    const ys = idx.map((i) => spots[i][1]);
    const pad = 0.95;
    const [x0, x1, y0, y1] = [Math.min(...xs) - pad, Math.max(...xs) + pad, Math.min(...ys) - pad, Math.max(...ys) + pad];
    return [{ chapter, poly: [iso(x0, y0), iso(x1, y0), iso(x1, y1), iso(x0, y1)] }];
  });

  const open = (i: number) => navigate(lessonPath(lang, lessons[i].meta.id, 0, level));

  return (
    <div className="course-map">
      <svg viewBox="-88 -64 560 744" role="group" aria-label={ui(lang, 'lessons')}>
        {slabs.map(({ chapter, poly }) => (
          <g key={chapter}>
            <polygon points={pts(poly.map(([sx, sy]) => [sx, sy + 9]))} fill="var(--line)" />
            <polygon points={pts(poly)} fill="var(--surface)" stroke="var(--line)" strokeWidth="1" />
          </g>
        ))}

        <path d={track} className="map-track" />
        <path d={doneTrack} className="map-track done" />

        {lessons.map((l, i) => {
          const [x, y] = spots[i];
          const [sx, sy] = centers[i];
          const done = completed.includes(l.meta.id);
          const isNext = i === nextIndex && !done;
          return (
            <g
              key={l.meta.id}
              className="map-block"
              data-next={isNext || undefined}
              data-focus={focus === i || undefined}
              style={{ animationDelay: `${i * 55}ms` }}
              role="link"
              tabIndex={0}
              aria-label={`${i + 1}. ${l.meta.title[lang]}${done ? ` (${ui(lang, 'done')})` : ''}`}
              onClick={() => open(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  open(i);
                }
              }}
              onPointerEnter={() => setFocus(i)}
              onPointerLeave={() => setFocus(null)}
              onFocus={() => setFocus(i)}
              onBlur={() => setFocus(null)}
            >
              <g className="map-lift">
                <ellipse cx={sx} cy={sy + 2} rx={K * 0.72} ry={K * 0.36} className="map-ring" />
                <Cube x={x} y={y} color={CHAPTER_COLOR[l.meta.chapter]} />
                {done ? (
                  <g transform={`translate(${sx} ${sy - H})`}>
                    <ellipse rx="11" ry="5.5" fill="var(--c-valid)" />
                    <path d="M-5,0 L-1.5,2.2 L5,-2.2" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                ) : (
                  <text x={sx} y={sy - H + 5} className="map-num">
                    {i + 1}
                  </text>
                )}
              </g>
            </g>
          );
        })}

        {!reduced && centers.length > 1 && (
          <g className="map-packet">
            <rect x="-5" y="-5" width="10" height="10" rx="2.5" transform="rotate(45)" fill="var(--c-tx)" />
            <animateMotion dur={`${centers.length * 1.1}s`} repeatCount="indefinite" path={track} />
          </g>
        )}
      </svg>

      <Link className="map-card" to={lessonPath(lang, shown.meta.id, 0, level)} tabIndex={-1} aria-hidden="true">
        <span className="map-card-num" style={{ background: CHAPTER_COLOR[shown.meta.chapter] }}>
          {lessons.indexOf(shown) + 1}
        </span>
        <span className="map-card-text">
          <small>{ui(lang, `chapter.${shown.meta.chapter}`)}</small>
          <strong>{shown.meta.title[lang]}</strong>
          <span>{shown.meta.summary[lang]}</span>
        </span>
      </Link>
    </div>
  );
}
