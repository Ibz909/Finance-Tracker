import { FlaskConical } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useAppData } from '../../hooks/useAppData';
import { useDemoDataActions } from '../../hooks/useDemoDataActions';
import { useToast } from '../../hooks/useToast';

export function DemoDataSettings() {
  const { transactions } = useAppData();
  const { loadDemoData, clearDemoData } = useDemoDataActions();
  const { showToast } = useToast();
  const [confirmingClear, setConfirmingClear] = useState(false);

  const demoCount = transactions.filter((t) => t.isDemo).length;
  const plural = (n: number) => `${String(n)} demo transaction${n === 1 ? '' : 's'}`;

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
            Load about six months of fictional transactions to explore the app. Demo records are
            labelled “Demo”, and clearing them never touches your own transactions.
          </p>
          <p className="mt-3 text-sm font-medium">
            {demoCount > 0 ? `${plural(demoCount)} loaded.` : 'No demo data loaded.'}
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
        description={`This removes ${plural(demoCount)}. Your own transactions are not affected.`}
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
