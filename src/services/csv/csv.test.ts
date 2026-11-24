import { describe, expect, it } from 'vitest';
import { parseCsv } from './parseCsv';
import { csvCell, toCsv } from './toCsv';

const rows = (text: string) => {
  const result = parseCsv(text);
  if (!result.ok) throw new Error(result.error);
  return result.rows;
};

describe('parseCsv', () => {
  it('splits simple rows and cells', () => {
    expect(rows('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('keeps commas, line breaks and escaped quotes inside quoted cells', () => {
    expect(rows('"Dinner, ""Luigi\'s""","line one\nline two",x')).toEqual([
      ['Dinner, "Luigi\'s"', 'line one\nline two', 'x'],
    ]);
  });

  it('handles Windows, Unix and old Mac line endings', () => {
    expect(rows('a\r\nb\nc\rd')).toEqual([['a'], ['b'], ['c'], ['d']]);
  });

  it('ignores a byte-order mark and blank lines, including a trailing newline', () => {
    expect(rows('﻿a,b\r\n\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('keeps empty cells', () => {
    expect(rows('a,,c,\n')).toEqual([['a', '', 'c', '']]);
  });

  it('treats a quote in the middle of a cell as text', () => {
    expect(rows('5" screen,b')).toEqual([['5" screen', 'b']]);
  });

  it('returns no rows for an empty file', () => {
    expect(rows('')).toEqual([]);
    expect(rows('﻿\n\n')).toEqual([]);
  });

  it('reports a quote that is never closed', () => {
    expect(parseCsv('a,"oops\nb')).toEqual({
      ok: false,
      error: 'The file has a quoted value that is never closed.',
    });
  });
});

describe('toCsv', () => {
  it('quotes only cells that need it, doubling inner quotes', () => {
    expect(csvCell('plain')).toBe('plain');
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('two\nlines')).toBe('"two\nlines"');
    expect(csvCell(' padded')).toBe('" padded"');
  });

  it('joins rows with CRLF and ends with a line break', () => {
    expect(
      toCsv([
        ['a', 'b'],
        ['1', '2'],
      ]),
    ).toBe('a,b\r\n1,2\r\n');
  });

  it('round-trips through the parser unchanged', () => {
    const original = [
      ['Date', 'Description', 'Notes'],
      ['2026-11-01', 'Dinner, "Luigi\'s"', 'multi\nline'],
      ['2026-11-02', ' spaced ', ''],
    ];
    expect(rows(toCsv(original))).toEqual(original);
  });
});
