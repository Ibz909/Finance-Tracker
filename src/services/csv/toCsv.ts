/** Cells that must be quoted: separators, quotes, line breaks or edge spaces. */
const NEEDS_QUOTES = /[",\r\n]|^\s|\s$/;

/** Turns one cell into CSV, quoting it and doubling inner quotes only when needed. */
export function csvCell(value: string): string {
  return NEEDS_QUOTES.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/**
 * Turns rows of cells into CSV text with Windows line endings (\r\n), as
 * RFC 4180 specifies and Excel expects.
 */
export function toCsv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
