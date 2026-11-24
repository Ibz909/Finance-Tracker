import { describe, expect, it } from 'vitest';
import { parseCsv } from '../../services/csv/parseCsv';
import { makeTransaction } from '../../test/fixtures';
import {
  protectFormula,
  transactionsToCsv,
  unprotectFormula,
  validateCsvRow,
} from './transactionCsv';

const valid = {
  date: '2026-11-04',
  type: 'expense',
  amount: '62.40',
  category: 'Food & Groceries',
  description: 'Weekly shop',
  notes: '',
};

function errorsFor(overrides: Record<string, string>) {
  const result = validateCsvRow({ ...valid, ...overrides });
  return result.ok ? [] : result.errors;
}

describe('validateCsvRow', () => {
  it('turns a valid row into a draft, leaving out an empty note', () => {
    expect(validateCsvRow(valid)).toEqual({
      ok: true,
      draft: {
        date: '2026-11-04',
        type: 'expense',
        amountPence: 6240,
        categoryId: 'food_groceries',
        description: 'Weekly shop',
      },
    });
  });

  it('trims cells and keeps a note', () => {
    const result = validateCsvRow({
      ...valid,
      description: '  Weekly shop ',
      notes: ' Big shop ',
    });
    expect(result).toMatchObject({
      ok: true,
      draft: { description: 'Weekly shop', notes: 'Big shop' },
    });
  });

  it('accepts type and category in any case, and categories by ID', () => {
    expect(validateCsvRow({ ...valid, type: 'EXPENSE', category: 'food & GROCERIES' }).ok).toBe(
      true,
    );
    expect(validateCsvRow({ ...valid, type: 'Income', category: 'salary' })).toMatchObject({
      ok: true,
      draft: { type: 'income', categoryId: 'salary' },
    });
  });

  it('accepts amounts as people write them', () => {
    expect(validateCsvRow({ ...valid, amount: '£1,234.5' })).toMatchObject({
      ok: true,
      draft: { amountPence: 123450 },
    });
  });

  it.each([
    ['abc', 'Amount “abc”: Enter an amount in pounds and pence, like 12.50.'],
    ['0', 'Amount “0”: Enter an amount greater than zero.'],
    ['-5', 'Amount “-5”: Enter an amount greater than zero.'],
    ['12,5.0', 'Amount “12,5.0”: Check the commas in this amount.'],
  ])('rejects the amount %s', (amount, message) => {
    expect(errorsFor({ amount })).toEqual([message]);
  });

  it.each(['2026-02-30', '24/11/2026', '2026-11-4'])('rejects the date %s', (date) => {
    expect(errorsFor({ date })).toEqual([
      `“${date}” isn’t a valid date. Use the format YYYY-MM-DD, like 2026-11-24.`,
    ]);
  });

  it('rejects an unknown type or category', () => {
    expect(errorsFor({ type: 'transfer' })).toEqual([
      '“transfer” isn’t a valid type. Use income or expense.',
    ]);
    expect(errorsFor({ category: 'Pets' })).toEqual(['“Pets” isn’t a known category.']);
  });

  it('rejects a category that does not match the type', () => {
    expect(errorsFor({ category: 'Salary' })).toEqual([
      '“Salary” is an income category, but this row is an expense.',
    ]);
  });

  it('reports every problem in a row, not just the first', () => {
    expect(errorsFor({ date: '', type: '', amount: '', category: '', description: '' })).toEqual([
      'Date is missing.',
      'Type is missing.',
      'Amount is missing.',
      'Category is missing.',
      'Description is missing.',
    ]);
  });

  it('enforces the same length limits as the form', () => {
    expect(errorsFor({ description: 'x'.repeat(101) })).toEqual([
      'Keep the description under 100 characters.',
    ]);
  });

  it('removes the formula-protection apostrophe', () => {
    expect(validateCsvRow({ ...valid, description: "'=SUM(A1)" })).toMatchObject({
      ok: true,
      draft: { description: '=SUM(A1)' },
    });
  });
});

describe('formula protection', () => {
  it.each(['=1+1', '+44 refund', '-5 off', '@home', '\tTabbed'])('protects %j', (text) => {
    expect(protectFormula(text)).toBe(`'${text}`);
    expect(unprotectFormula(protectFormula(text))).toBe(text);
  });

  it('leaves ordinary text and apostrophes alone', () => {
    expect(protectFormula('Rent')).toBe('Rent');
    expect(unprotectFormula("'Tis the season")).toBe("'Tis the season");
  });
});

describe('transactionsToCsv', () => {
  it('writes a header and one row per transaction, oldest first', () => {
    const csv = transactionsToCsv([
      makeTransaction({
        date: '2026-11-04',
        description: 'Dinner, "Luigi\'s"',
        categoryId: 'restaurants_takeaways',
        amountPence: 4280,
        notes: '=cheeky',
      }),
      makeTransaction({
        date: '2026-11-01',
        type: 'income',
        categoryId: 'salary',
        amountPence: 265000,
        description: 'Salary',
      }),
    ]);

    expect(csv).toBe(
      [
        'Date,Type,Amount,Category,Description,Notes',
        '2026-11-01,income,2650.00,Salary,Salary,',
        '2026-11-04,expense,42.80,Restaurants & Takeaways,"Dinner, ""Luigi\'s""",\'=cheeky',
        '',
      ].join('\r\n'),
    );
  });

  it('round-trips through import unchanged', () => {
    const original = makeTransaction({ description: '-5 off, "deal"', notes: 'line\nbreak' });
    const parsed = parseCsv(transactionsToCsv([original]));
    if (!parsed.ok) throw new Error(parsed.error);
    const [header = [], cells = []] = parsed.rows;
    const row = Object.fromEntries(header.map((h, i) => [h.toLowerCase(), cells[i] ?? '']));

    expect(validateCsvRow(row)).toEqual({
      ok: true,
      draft: {
        date: original.date,
        type: original.type,
        amountPence: original.amountPence,
        categoryId: original.categoryId,
        description: original.description,
        notes: original.notes,
      },
    });
  });
});
