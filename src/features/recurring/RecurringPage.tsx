import { Plus, Repeat } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAppData } from '../../hooks/useAppData';
import { useRecurringActions } from '../../hooks/useRecurringActions';
import { useToast } from '../../hooks/useToast';
import type { RecurringSchedule } from '../../models/recurring';
import { DeleteRecurringDialog } from './DeleteRecurringDialog';
import type { RecurringDialogState } from './RecurringFormDialog';
import { RecurringFormDialog } from './RecurringFormDialog';
import { RecurringList } from './RecurringList';
import { groupSchedules } from './scheduleDisplay';

export function RecurringPage() {
  const { recurringSchedules } = useAppData();
  const { setPaused } = useRecurringActions();
  const { showToast } = useToast();
  const [dialog, setDialog] = useState<RecurringDialogState>({ mode: 'closed' });
  const [pendingDelete, setPendingDelete] = useState<RecurringSchedule | null>(null);

  const { active, inactive } = useMemo(
    () => groupSchedules(recurringSchedules),
    [recurringSchedules],
  );

  const openAdd = () => {
    setDialog({ mode: 'add' });
  };
  const listActions = {
    onEdit: (schedule: RecurringSchedule) => {
      setDialog({ mode: 'edit', schedule });
    },
    onTogglePaused: (schedule: RecurringSchedule) => {
      setPaused(schedule.id, !schedule.paused);
      showToast(`${schedule.description} ${schedule.paused ? 'resumed' : 'paused'}`);
    },
    onDelete: setPendingDelete,
  };

  return (
    <>
      {recurringSchedules.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No recurring transactions yet"
          description="Add regular income and bills, like your salary, rent or subscriptions, once. Each payment is then added to your transactions when it falls due."
          action={
            <Button onClick={openAdd}>
              <Plus aria-hidden="true" className="size-5" />
              Add recurring transaction
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-prose text-sm text-muted-foreground">
              Payments are added to your transactions on their due date, the next time you open the
              app.
            </p>
            <Button onClick={openAdd}>
              <Plus aria-hidden="true" className="size-5" />
              Add recurring transaction
            </Button>
          </div>

          <ScheduleSection id="active-recurring" title="Active" schedules={active} {...listActions}>
            Nothing is active. Resume a paused item or add a new one.
          </ScheduleSection>
          {inactive.length > 0 && (
            <ScheduleSection
              id="inactive-recurring"
              title="Paused or ended"
              schedules={inactive}
              {...listActions}
            />
          )}
        </div>
      )}

      <RecurringFormDialog
        state={dialog}
        onClose={() => {
          setDialog({ mode: 'closed' });
        }}
      />
      <DeleteRecurringDialog
        schedule={pendingDelete}
        onClose={() => {
          setPendingDelete(null);
        }}
      />
    </>
  );
}

function ScheduleSection({
  id,
  title,
  schedules,
  children,
  ...actions
}: {
  id: string;
  title: string;
  schedules: readonly RecurringSchedule[];
  children?: string;
  onEdit: (schedule: RecurringSchedule) => void;
  onTogglePaused: (schedule: RecurringSchedule) => void;
  onDelete: (schedule: RecurringSchedule) => void;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="space-y-3">
      <h2 id={`${id}-heading`} className="text-base font-semibold">
        {title}
      </h2>
      {schedules.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <RecurringList schedules={schedules} {...actions} />
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-border px-5 py-4 text-sm text-muted-foreground">
          {children}
        </p>
      )}
    </section>
  );
}
