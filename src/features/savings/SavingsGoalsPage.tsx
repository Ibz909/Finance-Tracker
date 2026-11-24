import { PiggyBank, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAppData, useClock } from '../../hooks/useAppData';
import { useSavingsActions } from '../../hooks/useSavingsActions';
import { useToast } from '../../hooks/useToast';
import type { GoalContribution, SavingsGoal } from '../../models/savings';
import { formatDisplayDate, todayIsoDate } from '../../utils/dates';
import { formatPence } from '../../utils/money';
import type { ContributionDialogState } from './ContributionDialog';
import { ContributionDialog } from './ContributionDialog';
import { DeleteGoalDialog } from './DeleteGoalDialog';
import { GoalCard } from './GoalCard';
import type { GoalDialogState } from './GoalFormDialog';
import { GoalFormDialog } from './GoalFormDialog';
import { contributionsFor, getAllGoalProgress } from './goalProgress';

export function SavingsGoalsPage() {
  const { savingsGoals, goalContributions } = useAppData();
  const { deleteContribution } = useSavingsActions();
  const { showToast } = useToast();
  const today = todayIsoDate(useClock()());

  const [goalDialog, setGoalDialog] = useState<GoalDialogState>({ mode: 'closed' });
  const [contribution, setContribution] = useState<ContributionDialogState>(null);
  const [pendingDelete, setPendingDelete] = useState<SavingsGoal | null>(null);
  const [pendingEntry, setPendingEntry] = useState<GoalContribution | null>(null);

  const progress = useMemo(
    () => getAllGoalProgress(savingsGoals, goalContributions, today),
    [savingsGoals, goalContributions, today],
  );
  const totalSaved = progress.reduce((sum, p) => sum + Math.max(p.savedPence, 0), 0);

  const openAdd = () => {
    setGoalDialog({ mode: 'add' });
  };

  return (
    <>
      {savingsGoals.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No savings goals yet"
          description="Create a goal such as an emergency fund or a holiday, then record money as you set it aside. Saving isn’t counted as spending."
          action={
            <Button onClick={openAdd}>
              <Plus aria-hidden="true" className="size-5" />
              Add savings goal
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">
                {formatPence(totalSaved)}
              </span>{' '}
              saved across {progress.length} {progress.length === 1 ? 'goal' : 'goals'}.
            </p>
            <Button onClick={openAdd}>
              <Plus aria-hidden="true" className="size-5" />
              Add savings goal
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {progress.map((p) => (
              <GoalCard
                key={p.goal.id}
                progress={p}
                history={contributionsFor(goalContributions, p.goal.id)}
                onContribute={(goal, kind) => {
                  setContribution({ goal, kind });
                }}
                onEdit={(goal) => {
                  setGoalDialog({ mode: 'edit', goal });
                }}
                onDelete={setPendingDelete}
                onDeleteContribution={setPendingEntry}
              />
            ))}
          </div>
        </div>
      )}

      <GoalFormDialog
        state={goalDialog}
        onClose={() => {
          setGoalDialog({ mode: 'closed' });
        }}
      />
      <ContributionDialog
        state={contribution}
        onClose={() => {
          setContribution(null);
        }}
      />
      <DeleteGoalDialog
        goal={pendingDelete}
        onClose={() => {
          setPendingDelete(null);
        }}
      />
      <ConfirmDialog
        open={pendingEntry !== null}
        title={pendingEntry?.kind === 'withdrawal' ? 'Delete withdrawal?' : 'Delete deposit?'}
        description={
          pendingEntry &&
          `This removes the ${formatPence(pendingEntry.amountPence)} entry on ${formatDisplayDate(pendingEntry.date)} and updates the goal’s total.`
        }
        confirmLabel="Delete entry"
        onCancel={() => {
          setPendingEntry(null);
        }}
        onConfirm={() => {
          if (pendingEntry) {
            const result = deleteContribution(pendingEntry);
            showToast(result.ok ? 'Entry deleted' : result.error);
          }
          setPendingEntry(null);
        }}
      />
    </>
  );
}
