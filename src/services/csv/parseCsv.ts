export type ParseCsvResult = { ok: true; rows: string[][] } | { ok: false; error: string };

/**
 * Parses CSV text (RFC 4180) into rows of cells.
 *
 * Splitting on commas is not enough: a quoted cell may contain commas,
 * line breaks and quotes, with a quote written twice to escape it, so
 * `"Dinner, ""Luigi's"""` is one cell: Dinner, "Luigi's". This reads one
 * character at a time and tracks whether it is inside quotes.
 *
 * Also handles a leading byte-order mark (added by Excel), Windows (\r\n),
 * Unix (\n) and old Mac (\r) line endings, and skips blank lines.
 */
export function parseCsv(text: string): ParseCsvResult {
  const input = text.startsWith('﻿') ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  let i = 0;

  const endCell = () => {
    row.push(cell);
    cell = '';
  };
  const endRow = () => {
    endCell();
    // A blank line is one empty cell: skip it rather than report a bad row.
    if (!(row.length === 1 && row[0] === '')) rows.push(row);
    row = [];
  };

  while (i < input.length) {
    const char = input.charAt(i);
    if (inQuotes) {
      if (char === '"') {
        if (input.charAt(i + 1) === '"') {
          cell += '"'; // "" inside quotes is one literal quote
          i += 2;
          continue;
        }
        inQuotes = false;
      } else {
        cell += char;
      }
      i += 1;
      continue;
    }

    if (char === '"' && cell === '') {
      inQuotes = true;
    } else if (char === ',') {
      endCell();
    } else if (char === '\r' || char === '\n') {
      endRow();
      if (char === '\r' && input.charAt(i + 1) === '\n') i += 1;
    } else {
      cell += char;
    }
    i += 1;
  }

  if (inQuotes) {
    return { ok: false, error: 'The file has a quoted value that is never closed.' };
  }
  if (cell !== '' || row.length > 0) endRow();
  return { ok: true, rows };
}
