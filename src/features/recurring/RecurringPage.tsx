import { Plus, Repeat } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAppData, useClock } from '../../hooks/useAppData';
import { useRecurringActions } from '../../hooks/useRecurringActions';
import { useReportingMonth } from '../../hooks/useReportingMonth';
import { useToast } from '../../hooks/useToast';
import type { Frequency, RecurringSchedule } from '../../models/recurring';
import type { IsoDate } from '../../utils/dates';
import { getMonthBounds, isDateInMonth, todayIsoDate } from '../../utils/dates';
import { DeleteRecurringDialog } from './DeleteRecurringDialog';
import type { RecurringDialogState } from './RecurringFormDialog';
import { RecurringFormDialog } from './RecurringFormDialog';
import { RecurringCalendar, SelectedDay } from './RecurringCalendar';
import { RecurringList } from './RecurringList';
import { RecurringSummary } from './RecurringSummary';
import { UpcomingPayments } from './UpcomingPayments';
import { monthPayments, paymentsByDate, upcomingPayments } from './projection';
import { groupSchedules } from './scheduleDisplay';

export function RecurringPage() {
  const { recurringSchedules, transactions } = useAppData();
  const today = todayIsoDate(useClock()());
  const { month, setMonth } = useReportingMonth();
  const [picked, setPicked] = useState<IsoDate | null>(null);
  const { setPaused } = useRecurringActions();
  const { showToast } = useToast();
  const [dialog, setDialog] = useState<RecurringDialogState>({ mode: 'closed' });
  const [pendingDelete, setPendingDelete] = useState<RecurringSchedule | null>(null);

  const { active, inactive } = useMemo(
    () => groupSchedules(recurringSchedules),
    [recurringSchedules],
  );

  const payments = useMemo(
    () => monthPayments(recurringSchedules, transactions, month),
    [recurringSchedules, transactions, month],
  );
  const byDate = useMemo(() => paymentsByDate(payments), [payments]);
  const upcoming = useMemo(
    () => upcomingPayments(recurringSchedules, today),
    [recurringSchedules, today],
  );
  const frequencies = useMemo(
    () => new Map(recurringSchedules.map((s) => [s.id, s.frequency])),
    [recurringSchedules],
  );
  const frequencyOf = (id: string | null): Frequency | undefined =>
    id === null ? undefined : frequencies.get(id);

  // A day picked in another month gives way to today, or the month's first payment.
  const selected: IsoDate =
    picked !== null && isDateInMonth(picked, month)
      ? picked
      : isDateInMonth(today, month)
        ? today
        : (payments[0]?.date ?? getMonthBounds(month).start);

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
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-prose text-sm text-muted-foreground">
              Regular income and bills, on a calendar. Each payment is added to your transactions on
              its due date, the next time you open the app.
            </p>
            <Button variant="secondary" onClick={openAdd}>
              <Plus aria-hidden="true" className="size-5" />
              Add recurring transaction
            </Button>
          </div>

          <RecurringSummary
            month={month}
            payments={payments}
            activeCount={active.length}
            inactiveCount={inactive.length}
          />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:items-start">
            <RecurringCalendar
              month={month}
              today={today}
              selected={selected}
              byDate={byDate}
              onSelect={setPicked}
              onMonthChange={setMonth}
            />
            <div className="space-y-8">
              <SelectedDay
                date={selected}
                today={today}
                payments={byDate.get(selected) ?? []}
                frequencyOf={frequencyOf}
              />
              <UpcomingPayments payments={upcoming} today={today} frequencyOf={frequencyOf} />
            </div>
          </div>

          <section aria-labelledby="all-recurring-heading" className="space-y-6 pt-2">
            <h2 id="all-recurring-heading" className="text-lg font-semibold">
              All recurring
            </h2>
            <ScheduleSection
              id="active-recurring"
              title="Active"
              schedules={active}
              {...listActions}
            >
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
          </section>
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
    <section aria-labelledby={`${id}-heading`}>
      <h3 id={`${id}-heading`} className="text-sm font-medium text-muted-foreground">
        {title}
      </h3>
      {schedules.length > 0 ? (
        <div className="mt-1">
          <RecurringList schedules={schedules} {...actions} />
        </div>
      ) : (
        <p className="mt-2 border-t border-border pt-3 text-sm text-muted-foreground">{children}</p>
      )}
    </section>
  );
}
