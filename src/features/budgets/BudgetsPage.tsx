import { Plus, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAppData } from '../../hooks/useAppData';
import { useReportingMonth } from '../../hooks/useReportingMonth';
import type { Budget } from '../../models/budget';
import { formatMonthLabel } from '../../utils/dates';
import { BudgetCard } from './BudgetCard';
import type { BudgetDialogState } from './BudgetFormDialog';
import { BudgetFormDialog } from './BudgetFormDialog';
import { getMonthBudgets } from './budgetProgress';
import { DeleteBudgetDialog } from './DeleteBudgetDialog';

export function BudgetsPage() {
  const { budgets, transactions } = useAppData();
  const { month } = useReportingMonth();
  const [dialog, setDialog] = useState<BudgetDialogState>({ mode: 'closed' });
  const [pendingDelete, setPendingDelete] = useState<Budget | null>(null);

  const { overall, categories } = useMemo(
    () => getMonthBudgets(budgets, transactions, month),
    [budgets, transactions, month],
  );

  const openAdd = () => {
    setDialog({ mode: 'add' });
  };
  const cardActions = {
    onEdit: (budget: Budget) => {
      setDialog({ mode: 'edit', budget });
    },
    onDelete: setPendingDelete,
  };

  return (
    <>
      {budgets.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No budgets yet"
          description="Set a monthly limit for all your spending, or for individual categories like groceries or eating out, and see how you’re tracking each month."
          action={
            <Button onClick={openAdd}>
              <Plus aria-hidden="true" className="size-5" />
              Add budget
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Spending against your limits in {formatMonthLabel(month)}.
            </p>
            <Button onClick={openAdd}>
              <Plus aria-hidden="true" className="size-5" />
              Add budget
            </Button>
          </div>

          <section aria-labelledby="overall-budget-heading" className="space-y-3">
            <h2 id="overall-budget-heading" className="text-base font-semibold">
              Monthly budget
            </h2>
            {overall ? (
              <BudgetCard progress={overall} {...cardActions} />
            ) : (
              <p className="rounded-2xl border border-dashed border-border px-5 py-4 text-sm text-muted-foreground">
                No overall limit set. Add one to cap all of your spending each month.
              </p>
            )}
          </section>

          <section aria-labelledby="category-budgets-heading" className="space-y-3">
            <div>
              <h2 id="category-budgets-heading" className="text-base font-semibold">
                Category budgets
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Each is a separate limit for one category. They aren’t added to your monthly budget.
              </p>
            </div>
            {categories.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {categories.map((progress) => (
                  <BudgetCard key={progress.budget.id} progress={progress} {...cardActions} />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-border px-5 py-4 text-sm text-muted-foreground">
                No category budgets yet.
              </p>
            )}
          </section>
        </div>
      )}

      <BudgetFormDialog
        state={dialog}
        onClose={() => {
          setDialog({ mode: 'closed' });
        }}
      />
      <DeleteBudgetDialog
        budget={pendingDelete}
        onClose={() => {
          setPendingDelete(null);
        }}
      />
    </>
  );
}
