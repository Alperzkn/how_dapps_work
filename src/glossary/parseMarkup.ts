export type Inline =
  | { t: 'text' | 'bold' | 'em' | 'code'; v: string }
  | { t: 'term'; id: string; shown?: string };

export type Block = { kind: 'p'; inl: Inline[] } | { kind: 'ul'; items: Inline[][] };

const TOKEN = /\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]|\*\*(.+?)\*\*|`([^`]+)`|\*([^*\s](?:[^*]*[^*\s])?)\*/g;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) out.push({ t: 'text', v: text.slice(last, m.index) });
    if (m[1] !== undefined) out.push(m[2] ? { t: 'term', id: m[1], shown: m[2] } : { t: 'term', id: m[1] });
    else if (m[3] !== undefined) out.push({ t: 'bold', v: m[3] });
    else if (m[4] !== undefined) out.push({ t: 'code', v: m[4] });
    else out.push({ t: 'em', v: m[5] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: 'text', v: text.slice(last) });
  return out;
}

/** Blocks are separated by a blank line. A block whose lines all start with "- " is a list. */
export function parseMarkup(text: string): Block[] {
  return text
    .trim()
    .split(/\n\s*\n/)
    .filter((b) => b.trim())
    .map((raw): Block => {
      const lines = raw.split('\n').map((l) => l.trim());
      if (lines.every((l) => l.startsWith('- '))) {
        return { kind: 'ul', items: lines.map((l) => parseInline(l.slice(2))) };
      }
      return { kind: 'p', inl: parseInline(lines.join(' ')) };
    });
}

export function extractTermIds(text: string): string[] {
  return [...text.matchAll(/\[\[([a-z0-9-]+)(?:\|[^\]]+)?\]\]/g)].map((m) => m[1]);
}

/** Technical terms stay in English; Turkish text shows them inside double quotes. */
export function termText(name: string, lang: 'en' | 'tr'): string {
  return lang === 'tr' ? `"${name}"` : name;
}
