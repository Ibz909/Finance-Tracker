import type { Transaction, TransactionDraft } from '../../models/transaction';
import { parseCsv } from '../../services/csv/parseCsv';
import { CSV_COLUMNS, duplicateKey, REQUIRED_COLUMNS, validateCsvRow } from './transactionCsv';

export const MAX_IMPORT_ROWS = 5000;
export const MAX_IMPORT_BYTES = 1024 * 1024;

export interface RowProblem {
  /** Row number as a spreadsheet shows it: the header is row 1. */
  row: number;
  errors: string[];
}

export interface ImportPlan {
  /** Valid, new rows, in file order. */
  ready: TransactionDraft[];
  /** Row numbers skipped because the same transaction already exists (or appears earlier). */
  duplicateRows: number[];
  problems: RowProblem[];
}

export type PlanResult = { ok: true; plan: ImportPlan } | { ok: false; error: string };

function listWords(words: readonly string[]): string {
  return words.length > 1
    ? `${words.slice(0, -1).join(', ')} and ${words.at(-1) ?? ''}`
    : (words[0] ?? '');
}

/**
 * Reads CSV text and sorts every row into ready, duplicate or problem,
 * without changing any data. The user sees this plan and confirms it
 * before anything is saved.
 */
export function planImport(text: string, existing: readonly Transaction[]): PlanResult {
  const parsed = parseCsv(text);
  if (!parsed.ok) return parsed;

  const [header, ...dataRows] = parsed.rows;
  if (!header) return { ok: false, error: 'The file is empty.' };

  const columns = header.map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((c) => !columns.includes(c.toLowerCase()));
  if (missing.length > 0) {
    return {
      ok: false,
      error: `The file is missing ${missing.length === 1 ? 'the column' : 'these columns'}: ${listWords(missing)}. The first row must name the columns ${listWords(CSV_COLUMNS.slice(0, -1))}, plus Notes if you like.`,
    };
  }
  if (dataRows.length === 0) return { ok: false, error: 'The file has no transactions to import.' };
  if (dataRows.length > MAX_IMPORT_ROWS) {
    return {
      ok: false,
      error: `The file has ${dataRows.length.toLocaleString('en-GB')} rows. Import at most ${MAX_IMPORT_ROWS.toLocaleString('en-GB')} at a time.`,
    };
  }

  const seen = new Set(existing.map(duplicateKey));
  const plan: ImportPlan = { ready: [], duplicateRows: [], problems: [] };

  dataRows.forEach((cells, index) => {
    const rowNumber = index + 2;
    if (cells.length > columns.length) {
      plan.problems.push({
        row: rowNumber,
        errors: [
          `This row has ${String(cells.length)} values but there are only ${String(columns.length)} columns. Check for an unquoted comma.`,
        ],
      });
      return;
    }
    // Missing trailing cells (often an empty Notes) are treated as blank.
    const row = Object.fromEntries(columns.map((name, i) => [name, cells[i] ?? '']));
    const result = validateCsvRow(row);
    if (!result.ok) {
      plan.problems.push({ row: rowNumber, errors: result.errors });
      return;
    }
    const key = duplicateKey(result.draft);
    if (seen.has(key)) {
      plan.duplicateRows.push(rowNumber);
      return;
    }
    seen.add(key);
    plan.ready.push(result.draft);
  });

  return { ok: true, plan };
}
