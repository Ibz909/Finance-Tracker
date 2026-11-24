import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/Button';
import { useAppData, useClock, useStorageStatus } from '../../hooks/useAppData';
import { useToast } from '../../hooks/useToast';
import { todayIsoDate } from '../../utils/dates';
import { downloadTextFile, exportFileName } from '../importExport/download';
import { transactionsToCsv } from '../importExport/transactionCsv';
import { ResetDataDialog } from './ResetDataDialog';

export function ResetDataSettings() {
  const { transactions, budgets, recurringSchedules, savingsGoals } = useAppData();
  const { resetAllData } = useStorageStatus();
  const { showToast } = useToast();
  const clock = useClock();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const hasData =
    transactions.length + budgets.length + recurringSchedules.length + savingsGoals.length > 0;

  return (
    <section
      id="reset-data"
      aria-labelledby="reset-data-heading"
      className="rounded-2xl border border-negative/30 bg-surface p-6 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-negative" />
        <div>
          <h2 id="reset-data-heading" className="text-base font-semibold">
            Reset data
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Delete every transaction, budget, recurring transaction and savings goal from this
            browser and start again. This can’t be undone, so export your transactions first if you
            might want them back.
          </p>
        </div>
      </div>
      <div className="mt-5">
        <Button
          variant="danger"
          disabled={!hasData}
          onClick={() => {
            setOpen(true);
          }}
        >
          Reset all data
        </Button>
        {!hasData && (
          <p className="mt-2 text-sm text-muted-foreground">There’s no data to reset.</p>
        )}
      </div>

      <ResetDataDialog
        open={open}
        onCancel={() => {
          setOpen(false);
        }}
        onExport={() => {
          downloadTextFile(exportFileName(todayIsoDate(clock())), transactionsToCsv(transactions));
          showToast(`Exported ${String(transactions.length)} transactions`);
        }}
        onConfirm={() => {
          resetAllData();
          setOpen(false);
          showToast('All data deleted');
          void navigate('/');
        }}
      />
    </section>
  );
}
