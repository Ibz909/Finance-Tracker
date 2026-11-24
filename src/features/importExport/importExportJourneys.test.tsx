import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyAppData } from '../../models/appData';
import type { Transaction } from '../../models/transaction';
import { createMemoryRepository } from '../../services/storage/memoryRepository';
import { makeTransaction } from '../../test/fixtures';
import { renderRoute } from '../../test/renderRoute';

// renderRoute fixes "today" at 15 November 2026.

const HEADER = 'Date,Type,Amount,Category,Description,Notes';

function seeded(...transactions: Transaction[]) {
  return createMemoryRepository({ ...createEmptyAppData(), transactions });
}

const salary = makeTransaction({
  date: '2026-11-01',
  type: 'income',
  categoryId: 'salary',
  amountPence: 265000,
  description: 'Salary',
});
const shop = makeTransaction({
  date: '2026-11-04',
  categoryId: 'food_groceries',
  amountPence: 6240,
  description: 'Weekly shop',
});

/** Captures what would be downloaded: jsdom has no object URLs or downloads. */
let downloads: { name: string; blob: Blob }[] = [];
beforeEach(() => {
  downloads = [];
  let lastBlob: Blob | undefined;
  URL.createObjectURL = vi.fn((blob: Blob) => {
    lastBlob = blob;
    return 'blob:test';
  });
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    if (lastBlob) downloads.push({ name: this.download, blob: lastBlob });
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});

async function downloadedText(index = 0) {
  const download = downloads[index];
  if (!download) throw new Error('Nothing was downloaded');
  return download.blob.text();
}

function csvFile(...lines: string[]) {
  return new File([[HEADER, ...lines].join('\n')], 'bank.csv', { type: 'text/csv' });
}

describe('Exporting', () => {
  it('exports every transaction from Settings as a dated CSV file', async () => {
    const { user } = renderRoute('/settings', { repository: seeded(shop, salary) });

    await user.click(screen.getByRole('button', { name: 'Export all transactions' }));

    expect(downloads[0]?.name).toBe('finance-tracker-transactions-2026-11-15.csv');
    // The file starts with a UTF-8 byte-order mark (EF BB BF) so Excel reads "£" and "&".
    const bytes = new Uint8Array(await (downloads[0]?.blob ?? new Blob()).arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    // Blob.text() decodes as UTF-8, which drops the byte-order mark.
    expect(await downloadedText()).toBe(
      [
        HEADER,
        '2026-11-01,income,2650.00,Salary,Salary,',
        '2026-11-04,expense,62.40,Food & Groceries,Weekly shop,',
        '',
      ].join('\r\n'),
    );
    expect(screen.getByText('Exported 2 transactions')).toBeInTheDocument();
  });

  it('exports only what the filters show on the Transactions page', async () => {
    const { user } = renderRoute('/transactions?type=income', { repository: seeded(shop, salary) });

    await user.click(screen.getByRole('button', { name: 'Export 1 transaction as CSV' }));

    const text = await downloadedText();
    expect(text).toContain('Salary');
    expect(text).not.toContain('Weekly shop');
  });

  it('disables exporting when there is nothing to export', () => {
    renderRoute('/settings');
    expect(screen.getByRole('button', { name: 'Export all transactions' })).toBeDisabled();
  });
});

describe('Importing', () => {
  it('previews the file, then imports only new, valid rows when confirmed', async () => {
    const repository = seeded(salary);
    const { user } = renderRoute('/settings', { repository });

    await user.upload(
      screen.getByLabelText('Choose a CSV file to import'),
      csvFile(
        '2026-11-01,income,2650.00,Salary,Salary,', // row 2: already exists
        '2026-11-04,expense,62.40,Food & Groceries,"Weekly shop, Tesco",', // row 3
        '2026-11-05,expense,abc,Transport,Bus,', // row 4: bad amount
        '2026-11-06,expense,1.80,Transport,Bus,Commute', // row 5
      ),
    );

    const dialog = within(screen.getByRole('dialog', { name: 'Import transactions' }));
    expect(dialog.getByText('bank.csv')).toBeVisible();
    expect(dialog.getByText(/ready to import/)).toHaveTextContent(
      '2 transactions ready to import.',
    );
    expect(dialog.getByText(/will be skipped because/)).toHaveTextContent(
      '1 duplicate will be skipped because you already have it (row 2).',
    );
    const problems = within(dialog.getByRole('region', { name: 'Problems found' }));
    expect(problems.getByText('Row 4')).toBeVisible();
    expect(
      problems.getByText('Amount “abc”: Enter an amount in pounds and pence, like 12.50.'),
    ).toBeVisible();
    // Nothing is saved until the user confirms.
    expect(repository.saved?.transactions).toHaveLength(1);

    await user.click(dialog.getByRole('button', { name: 'Import 2 transactions' }));

    expect(screen.getByText('Imported 2 transactions')).toBeInTheDocument();
    const saved = repository.saved?.transactions ?? [];
    expect(saved.map((t) => t.description)).toEqual(['Salary', 'Weekly shop, Tesco', 'Bus']);
    expect(saved[2]).toMatchObject({ notes: 'Commute', isDemo: false, amountPence: 180 });
  });

  it('changes nothing when the preview is cancelled', async () => {
    const repository = seeded();
    const { user } = renderRoute('/settings', { repository });

    await user.upload(
      screen.getByLabelText('Choose a CSV file to import'),
      csvFile('2026-11-06,expense,1.80,Transport,Bus,'),
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(repository.saved?.transactions).toEqual([]);
  });

  it('explains when a file cannot be imported at all', async () => {
    const { user } = renderRoute('/settings');

    await user.upload(
      screen.getByLabelText('Choose a CSV file to import'),
      new File(['Date,Description\n2026-11-01,Bus'], 'wrong.csv', { type: 'text/csv' }),
    );

    const dialog = within(screen.getByRole('dialog', { name: 'This file can’t be imported' }));
    expect(dialog.getByText(/missing these columns: Type, Amount and Category/)).toBeVisible();
  });

  it('offers no import button when nothing is new', async () => {
    const { user } = renderRoute('/settings', { repository: seeded(salary) });

    await user.upload(
      screen.getByLabelText('Choose a CSV file to import'),
      csvFile('2026-11-01,income,2650.00,Salary,Salary,'),
    );

    const dialog = within(screen.getByRole('dialog', { name: 'Import transactions' }));
    expect(dialog.getByText(/ready to import/)).toHaveTextContent(
      '0 transactions ready to import.',
    );
    expect(dialog.queryByRole('button', { name: /^Import/ })).not.toBeInTheDocument();
    expect(dialog.getByRole('button', { name: 'Close' })).toBeVisible();
  });

  it('round-trips: importing an export of the same data adds nothing', async () => {
    const { user } = renderRoute('/settings', { repository: seeded(shop, salary) });

    await user.click(screen.getByRole('button', { name: 'Export all transactions' }));
    const exported = await downloadedText();
    await user.upload(
      screen.getByLabelText('Choose a CSV file to import'),
      new File([exported], 'export.csv', { type: 'text/csv' }),
    );

    const dialog = within(screen.getByRole('dialog', { name: 'Import transactions' }));
    expect(dialog.getByText(/ready to import/)).toHaveTextContent(
      '0 transactions ready to import.',
    );
    expect(dialog.getByText(/will be skipped because/)).toHaveTextContent('2 duplicates');
  });
});
