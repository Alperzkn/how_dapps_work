import { describe, expect, it } from 'vitest';
import { extractTermIds, parseInline, parseMarkup, termText } from './parseMarkup';

describe('parseInline', () => {
  it('keeps a Turkish suffix and punctuation outside the term', () => {
    expect(parseInline("Her blok bir [[hash]]'i taşır.")).toEqual([
      { t: 'text', v: 'Her blok bir ' },
      { t: 'term', id: 'hash' },
      { t: 'text', v: "'i taşır." },
    ]);
  });

  it('supports overridden display text', () => {
    expect(parseInline('Many [[tick|ticks]].')).toEqual([
      { t: 'text', v: 'Many ' },
      { t: 'term', id: 'tick', shown: 'ticks' },
      { t: 'text', v: '.' },
    ]);
  });

  it('parses bold and inline code', () => {
    expect(parseInline('**k** stays `x * y`')).toEqual([
      { t: 'bold', v: 'k' },
      { t: 'text', v: ' stays ' },
      { t: 'code', v: 'x * y' },
    ]);
  });

  it('parses single-asterisk emphasis without eating multiplication signs', () => {
    expect(parseInline('block *i+1* and a * b * c')).toEqual([
      { t: 'text', v: 'block ' },
      { t: 'em', v: 'i+1' },
      { t: 'text', v: ' and a * b * c' },
    ]);
  });

  it('handles a term at the very start and end', () => {
    expect(parseInline('[[hash]]')).toEqual([{ t: 'term', id: 'hash' }]);
  });

  it('leaves malformed tokens as text', () => {
    expect(parseInline('a [[Not Valid]] b')).toEqual([{ t: 'text', v: 'a [[Not Valid]] b' }]);
  });
});

describe('parseMarkup', () => {
  it('splits paragraphs and lists', () => {
    const blocks = parseMarkup('One\nline.\n\n- a [[hash]]\n- b\n\nTwo.');
    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toEqual({ kind: 'p', inl: [{ t: 'text', v: 'One line.' }] });
    expect(blocks[1].kind).toBe('ul');
    expect(blocks[1].kind === 'ul' && blocks[1].items).toHaveLength(2);
  });

  it('returns nothing for empty text', () => {
    expect(parseMarkup('  \n ')).toEqual([]);
  });
});

describe('extractTermIds', () => {
  it('finds every term id, including overridden ones', () => {
    expect(extractTermIds('[[hash]] and [[tick|ticks]] and `[[x]]`')).toEqual(['hash', 'tick', 'x']);
  });
});

describe('termText', () => {
  it('quotes the English term in Turkish only', () => {
    expect(termText('liquidity pool', 'tr')).toBe('"liquidity pool"');
    expect(termText('liquidity pool', 'en')).toBe('liquidity pool');
  });
});
