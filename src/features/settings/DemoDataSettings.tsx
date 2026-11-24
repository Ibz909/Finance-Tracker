import { FlaskConical } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useAppData } from '../../hooks/useAppData';
import { useDemoDataActions } from '../../hooks/useDemoDataActions';
import { useToast } from '../../hooks/useToast';

export function DemoDataSettings() {
  const { transactions, budgets, savingsGoals } = useAppData();
  const { loadDemoData, clearDemoData } = useDemoDataActions();
  const { showToast } = useToast();
  const [confirmingClear, setConfirmingClear] = useState(false);

  const parts = [
    { n: transactions.filter((t) => t.isDemo).length, noun: 'transaction' },
    { n: budgets.filter((b) => b.isDemo).length, noun: 'budget' },
    { n: savingsGoals.filter((g) => g.isDemo).length, noun: 'savings goal' },
  ]
    .filter(({ n }) => n > 0)
    .map(({ n, noun }) => `${String(n)} demo ${noun}${n === 1 ? '' : 's'}`);
  const demoCount = parts.length;
  // "a", "a and b", "a, b and c"
  const summary =
    parts.length > 1
      ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1) ?? ''}`
      : (parts[0] ?? '');

  return (
    <section
      id="demo-data"
      aria-labelledby="demo-data-heading"
      className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <FlaskConical aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
        <div>
          <h2 id="demo-data-heading" className="text-base font-semibold">
            Demo data
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Load about six months of fictional transactions, example budgets and savings goals to
            explore the app. Demo records are labelled “Demo”, and clearing them never touches your
            own data.
          </p>
          <p className="mt-3 text-sm font-medium">
            {demoCount > 0 ? `${summary} loaded.` : 'No demo data loaded.'}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button
          variant="secondary"
          onClick={() => {
            loadDemoData();
            showToast(demoCount > 0 ? 'Demo data refreshed' : 'Demo data loaded');
          }}
        >
          {demoCount > 0 ? 'Refresh demo data' : 'Load demo data'}
        </Button>
        {demoCount > 0 && (
          <Button
            variant="secondary"
            onClick={() => {
              setConfirmingClear(true);
            }}
          >
            Clear demo data
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmingClear}
        title="Clear demo data?"
        description={`This removes ${summary}. Your own data is not affected.`}
        confirmLabel="Clear demo data"
        onCancel={() => {
          setConfirmingClear(false);
        }}
        onConfirm={() => {
          clearDemoData();
          setConfirmingClear(false);
          showToast('Demo data cleared');
        }}
      />
    </section>
  );
}
