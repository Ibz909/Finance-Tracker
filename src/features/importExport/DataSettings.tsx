import { Download, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useAppData, useClock } from '../../hooks/useAppData';
import { useToast } from '../../hooks/useToast';
import { useTransactionActions } from '../../hooks/useTransactionActions';
import { todayIsoDate } from '../../utils/dates';
import { downloadTextFile, exportFileName } from './download';
import type { ImportDialogState } from './ImportDialog';
import { ImportDialog } from './ImportDialog';
import { MAX_IMPORT_BYTES, planImport } from './importPlan';
import { transactionsToCsv } from './transactionCsv';

/** Settings section for exporting all transactions and importing a CSV file. */
export function DataSettings() {
  const { transactions } = useAppData();
  const { importTransactions } = useTransactionActions();
  const { showToast } = useToast();
  const clock = useClock();
  const fileInput = useRef<HTMLInputElement>(null);
  const [dialog, setDialog] = useState<ImportDialogState>({ status: 'closed' });

  async function handleFile(file: File) {
    if (file.size > MAX_IMPORT_BYTES) {
      setDialog({
        status: 'error',
        fileName: file.name,
        error: 'The file is larger than 1 MB. Split it into smaller files and import each one.',
      });
      return;
    }
    const text = await file.text();
    const result = planImport(text, transactions);
    setDialog(
      result.ok
        ? { status: 'preview', fileName: file.name, plan: result.plan }
        : { status: 'error', fileName: file.name, error: result.error },
    );
  }

  return (
    <section
      id="import-export"
      aria-labelledby="import-export-heading"
      className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
    >
      <h2 id="import-export-heading" className="text-base font-semibold">
        Import and export
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Export your transactions as a CSV file to keep a backup or open them in a spreadsheet.
        Import a CSV file with the columns Date, Type, Amount, Category, Description and
        (optionally) Notes. You’ll see a preview before anything is added.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button
          variant="secondary"
          disabled={transactions.length === 0}
          onClick={() => {
            downloadTextFile(
              exportFileName(todayIsoDate(clock())),
              transactionsToCsv(transactions),
            );
            showToast(`Exported ${String(transactions.length)} transactions`);
          }}
        >
          <Download aria-hidden="true" className="size-4" />
          Export all transactions
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            fileInput.current?.click();
          }}
        >
          <Upload aria-hidden="true" className="size-4" />
          Import from CSV
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept=".csv,text/csv"
          aria-label="Choose a CSV file to import"
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Reset so choosing the same file again still triggers a change.
            event.target.value = '';
            if (file) void handleFile(file);
          }}
        />
      </div>

      <ImportDialog
        state={dialog}
        onCancel={() => {
          setDialog({ status: 'closed' });
        }}
        onConfirm={(plan) => {
          const result = importTransactions(plan.ready);
          setDialog({ status: 'closed' });
          showToast(
            result.ok
              ? `Imported ${String(plan.ready.length)} transaction${plan.ready.length === 1 ? '' : 's'}`
              : 'Nothing was imported because some rows were invalid',
          );
        }}
      />
    </section>
  );
}
