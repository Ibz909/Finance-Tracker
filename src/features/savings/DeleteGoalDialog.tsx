import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useSavingsActions } from '../../hooks/useSavingsActions';
import { useToast } from '../../hooks/useToast';
import type { SavingsGoal } from '../../models/savings';

export function DeleteGoalDialog({
  goal,
  onClose,
}: {
  goal: SavingsGoal | null;
  onClose: () => void;
}) {
  const { deleteGoal } = useSavingsActions();
  const { showToast } = useToast();

  return (
    <ConfirmDialog
      open={goal !== null}
      title={goal ? `Delete ${goal.name}?` : 'Delete goal?'}
      description="This deletes the goal and its history of deposits and withdrawals. Your transactions are not affected."
      confirmLabel="Delete goal"
      onCancel={onClose}
      onConfirm={() => {
        if (goal) {
          deleteGoal(goal.id);
          showToast('Goal deleted');
        }
        onClose();
      }}
    />
  );
}
