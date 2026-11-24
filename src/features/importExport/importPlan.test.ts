import { describe, expect, it } from 'vitest';
import { makeTransaction } from '../../test/fixtures';
import { MAX_IMPORT_ROWS, planImport } from './importPlan';

const HEADER = 'Date,Type,Amount,Category,Description,Notes';
const file = (...lines: string[]) => [HEADER, ...lines].join('\n');

function plan(text: string, existing = [makeTransaction({ id: 'x', date: '2020-01-01' })]) {
  const result = planImport(text, existing);
  if (!result.ok) throw new Error(result.error);
  return result.plan;
}

describe('planImport', () => {
  it('sorts rows into ready, duplicate and problem, numbering rows like a spreadsheet', () => {
    const existing = makeTransaction({
      date: '2026-11-01',
      type: 'income',
      categoryId: 'salary',
      amountPence: 265000,
      description: 'Salary',
    });
    const result = plan(
      file(
        '2026-11-01,income,2650.00,Salary,salary,', // row 2: matches existing (case-insensitive)
        '2026-11-04,expense,62.40,Food & Groceries,Weekly shop,', // row 3: ready
        '2026-11-04,expense,62.40,Food & Groceries,Weekly shop,', // row 4: repeats row 3
        'nope,expense,1,Transport,Bus,', // row 5: problem
      ),
      [existing],
    );

    expect(result.ready).toHaveLength(1);
    expect(result.ready[0]).toMatchObject({ description: 'Weekly shop', amountPence: 6240 });
    expect(result.duplicateRows).toEqual([2, 4]);
    expect(result.problems).toEqual([
      {
        row: 5,
        errors: ['“nope” isn’t a valid date. Use the format YYYY-MM-DD, like 2026-11-24.'],
      },
    ]);
  });

  it('accepts columns in any order and case, with Notes optional and trailing cells missing', () => {
    const result = plan(
      ['description,AMOUNT,category,type,date', 'Bus,1.80,Transport,expense,2026-11-02'].join('\n'),
    );
    expect(result.ready).toEqual([
      {
        description: 'Bus',
        amountPence: 180,
        categoryId: 'transport',
        type: 'expense',
        date: '2026-11-02',
      },
    ]);
  });

  it('reports a row with more values than columns', () => {
    const result = plan(file('2026-11-02,expense,1.80,Transport,Bus,note,extra'));
    expect(result.problems[0]?.errors[0]).toMatch(/7 values but there are only 6 columns/);
  });

  it('rejects a file missing required columns, naming them', () => {
    expect(planImport('Date,Description\n2026-11-01,Bus', [])).toEqual({
      ok: false,
      error:
        'The file is missing these columns: Type, Amount and Category. The first row must name the columns Date, Type, Amount, Category and Description, plus Notes if you like.',
    });
  });

  it('rejects empty files, header-only files and unclosed quotes', () => {
    expect(planImport('', [])).toEqual({ ok: false, error: 'The file is empty.' });
    expect(planImport(HEADER, [])).toEqual({
      ok: false,
      error: 'The file has no transactions to import.',
    });
    expect(planImport(file('2026-11-01,expense,1,Transport,"Bus'), [])).toMatchObject({
      ok: false,
    });
  });

  it('refuses more rows than the limit', () => {
    const rows = Array.from(
      { length: MAX_IMPORT_ROWS + 1 },
      () => '2026-11-01,expense,1,Transport,Bus,',
    );
    expect(planImport(file(...rows), [])).toEqual({
      ok: false,
      error: 'The file has 5,001 rows. Import at most 5,000 at a time.',
    });
  });
});
