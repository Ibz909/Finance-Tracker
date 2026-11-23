import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useBudgetActions } from '../../hooks/useBudgetActions';
import { useToast } from '../../hooks/useToast';
import type { Budget } from '../../models/budget';
import { formatPence } from '../../utils/money';
import { budgetLabel } from './budgetLabel';

export function DeleteBudgetDialog({
  budget,
  onClose,
}: {
  budget: Budget | null;
  onClose: () => void;
}) {
  const { deleteBudget } = useBudgetActions();
  const { showToast } = useToast();

  return (
    <ConfirmDialog
      open={budget !== null}
      title={budget ? `Delete ${budgetLabel(budget)} budget?` : 'Delete budget?'}
      description={
        budget &&
        `This removes the ${formatPence(budget.limitPence)} monthly limit. Your transactions are not affected.`
      }
      confirmLabel="Delete budget"
      onCancel={onClose}
      onConfirm={() => {
        if (budget) {
          deleteBudget(budget.id);
          showToast('Budget deleted');
        }
        onClose();
      }}
    />
  );
}
