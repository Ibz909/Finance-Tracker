import { DEFAULT_CATEGORIES, getCategory } from '../../constants/categories';
import type { Category } from '../../models/category';
import type { TransactionType } from '../../models/primitives';
import type { Transaction, TransactionDraft } from '../../models/transaction';
import { transactionDraftSchema } from '../../models/transaction';
import { toCsv } from '../../services/csv/toCsv';
import { isValidIsoDate } from '../../utils/dates';
import { parsePoundsToPence, penceToInputValue } from '../../utils/money';

/** Column headers, in export order. Matching on import ignores case and order. */
export const CSV_COLUMNS = ['Date', 'Type', 'Amount', 'Category', 'Description', 'Notes'] as const;
export const REQUIRED_COLUMNS = ['Date', 'Type', 'Amount', 'Category', 'Description'] as const;

/** A data row keyed by lower-case header name, e.g. { date: '2026-11-01', … }. */
export type CsvRow = Readonly<Record<string, string>>;

/*
 * CSV (formula) injection: a spreadsheet may run a cell that starts with
 * = + - @ (or a tab or carriage return) as a formula, so a description like
 * "=HYPERLINK(…)" could do something when the file is opened. Exports put
 * an apostrophe in front of such cells, which spreadsheets show as plain
 * text, and imports remove it again so the text round-trips unchanged.
 */
const FORMULA_START = /^[=+\-@\t\r]/;

export function protectFormula(value: string): string {
  return FORMULA_START.test(value) ? `'${value}` : value;
}

export function unprotectFormula(value: string): string {
  return value.startsWith("'") && FORMULA_START.test(value.slice(1)) ? value.slice(1) : value;
}

/* ---------- Export ---------- */

export function transactionToCsvRow(transaction: Transaction): string[] {
  return [
    transaction.date,
    transaction.type,
    penceToInputValue(transaction.amountPence),
    getCategory(transaction.categoryId)?.label ?? transaction.categoryId,
    protectFormula(transaction.description),
    protectFormula(transaction.notes ?? ''),
  ];
}

/** CSV text for these transactions, oldest first, with a header row. */
export function transactionsToCsv(transactions: readonly Transaction[]): string {
  const sorted = [...transactions].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
  );
  return toCsv([[...CSV_COLUMNS], ...sorted.map(transactionToCsvRow)]);
}

/* ---------- Import ---------- */

/**
 * Finds a category by ID or display name, ignoring case. If a name ever
 * matched two categories, the one matching the row's type would win.
 */
export function findCategory(text: string, type: TransactionType | null): Category | undefined {
  const wanted = text.trim().toLowerCase();
  const matches = DEFAULT_CATEGORIES.filter(
    (c) => c.id === wanted || c.label.toLowerCase() === wanted,
  );
  return matches.find((c) => c.type === type) ?? matches[0];
}

const quote = (value: string) => `“${value}”`;

/**
 * Checks one CSV row and turns it into a TransactionDraft, or returns every
 * problem found, in plain English, so the user can fix them all at once.
 *
 * Each column is checked here for a specific message; the result then goes
 * through transactionDraftSchema, so imports follow exactly the same rules
 * as the form (description length, notes length and so on).
 */
export function validateCsvRow(
  row: CsvRow,
): { ok: true; draft: TransactionDraft } | { ok: false; errors: string[] } {
  const cell = (column: string) => unprotectFormula((row[column.toLowerCase()] ?? '').trim());
  const errors: string[] = [];

  const date = cell('Date');
  if (date === '') errors.push('Date is missing.');
  else if (!isValidIsoDate(date)) {
    errors.push(`${quote(date)} isn’t a valid date. Use the format YYYY-MM-DD, like 2026-11-24.`);
  }

  const typeText = cell('Type').toLowerCase();
  const type: TransactionType | null =
    typeText === 'income' || typeText === 'expense' ? typeText : null;
  if (typeText === '') errors.push('Type is missing.');
  else if (!type) errors.push(`${quote(cell('Type'))} isn’t a valid type. Use income or expense.`);

  const amountText = cell('Amount');
  const amount = parsePoundsToPence(amountText);
  if (amountText === '') errors.push('Amount is missing.');
  else if (!amount.ok) errors.push(`Amount ${quote(amountText)}: ${amount.error}.`);

  const categoryText = cell('Category');
  const category = findCategory(categoryText, type);
  if (categoryText === '') errors.push('Category is missing.');
  else if (!category) errors.push(`${quote(categoryText)} isn’t a known category.`);
  else if (type && category.type !== type) {
    errors.push(
      `${quote(category.label)} is an ${category.type} category, but this row is ${type === 'income' ? 'income' : 'an expense'}.`,
    );
  }

  const description = cell('Description');
  const notes = cell('Notes');
  const draft = transactionDraftSchema.safeParse({
    type: type ?? 'expense',
    amountPence: amount.ok ? amount.pence : 1,
    categoryId: category?.id ?? '',
    description,
    date: isValidIsoDate(date) ? date : '2000-01-01',
    ...(notes === '' ? {} : { notes }),
  });

  if (!draft.success) {
    // Only the fields not already checked above need reporting here.
    for (const issue of draft.error.issues) {
      const field = String(issue.path[0]);
      if (field === 'description') {
        errors.push(description === '' ? 'Description is missing.' : `${issue.message}.`);
      } else if (field === 'notes') {
        errors.push(`${issue.message}.`);
      }
    }
  }

  return errors.length === 0 && draft.success
    ? { ok: true, draft: draft.data }
    : { ok: false, errors };
}

/** What makes two transactions "the same" for duplicate detection. */
export function duplicateKey(
  t: Pick<TransactionDraft, 'date' | 'type' | 'amountPence' | 'categoryId' | 'description'>,
): string {
  return [
    t.date,
    t.type,
    String(t.amountPence),
    t.categoryId,
    t.description.trim().toLowerCase(),
  ].join('|');
}
