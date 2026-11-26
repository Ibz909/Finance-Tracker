import { Plus, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAppData, useClock } from '../../hooks/useAppData';
import { useReportingMonth } from '../../hooks/useReportingMonth';
import type { Budget } from '../../models/budget';
import { formatMonthLabel, todayIsoDate } from '../../utils/dates';
import { monthTiming } from './allowance';
import type { BudgetDialogState } from './BudgetFormDialog';
import { BudgetFormDialog } from './BudgetFormDialog';
import { getMonthBudgets } from './budgetProgress';
import { CategoryBudgetRow } from './CategoryBudgetRow';
import { DeleteBudgetDialog } from './DeleteBudgetDialog';
import { MonthlyBudgetHero } from './MonthlyBudgetHero';

export function BudgetsPage() {
  const { budgets, transactions } = useAppData();
  const { month } = useReportingMonth();
  const today = todayIsoDate(useClock()());
  const timing = useMemo(() => monthTiming(month, today), [month, today]);
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
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Spending against your limits in {formatMonthLabel(month)}.
            </p>
            <Button variant="secondary" onClick={openAdd}>
              <Plus aria-hidden="true" className="size-5" />
              Add budget
            </Button>
          </div>

          {overall ? (
            <MonthlyBudgetHero progress={overall} month={month} timing={timing} {...cardActions} />
          ) : (
            <section
              aria-label="Monthly budget"
              className="rounded-xl border border-dashed border-input-border px-4 py-4 text-sm text-muted-foreground sm:px-5"
            >
              No overall limit set. Add one to cap all of your spending each month.
            </section>
          )}

          <section aria-labelledby="category-budgets-heading">
            <h2 id="category-budgets-heading" className="text-lg font-semibold">
              Category budgets
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Each is a separate limit for one category. They aren’t added to your monthly budget.
            </p>
            {categories.length > 0 ? (
              <ul className="mt-2 divide-y divide-border border-y border-border">
                {categories.map((progress) => (
                  <CategoryBudgetRow
                    key={progress.budget.id}
                    progress={progress}
                    {...cardActions}
                  />
                ))}
              </ul>
            ) : (
              <p className="mt-3 border-t border-border pt-4 text-sm text-muted-foreground">
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
