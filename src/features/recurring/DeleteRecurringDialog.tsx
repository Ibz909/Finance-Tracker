import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useRecurringActions } from '../../hooks/useRecurringActions';
import { useToast } from '../../hooks/useToast';
import type { RecurringSchedule } from '../../models/recurring';

export function DeleteRecurringDialog({
  schedule,
  onClose,
}: {
  schedule: RecurringSchedule | null;
  onClose: () => void;
}) {
  const { deleteSchedule } = useRecurringActions();
  const { showToast } = useToast();

  return (
    <ConfirmDialog
      open={schedule !== null}
      title={schedule ? `Stop “${schedule.description}”?` : 'Delete recurring transaction?'}
      description="No more payments will be added. Transactions it has already added stay in your history."
      confirmLabel="Delete recurring transaction"
      onCancel={onClose}
      onConfirm={() => {
        if (schedule) {
          deleteSchedule(schedule.id);
          showToast('Recurring transaction deleted');
        }
        onClose();
      }}
    />
  );
}
