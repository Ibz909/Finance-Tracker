import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { RowMenu } from '../../components/ui/RowMenu';
import { getCategory } from '../../constants/categories';
import type { RecurringSchedule } from '../../models/recurring';
import { formatSignedPence } from '../../utils/money';
import { FREQUENCY_LABELS } from './schedule';
import { scheduleStatusText } from './scheduleDisplay';

interface RecurringListProps {
  schedules: readonly RecurringSchedule[];
  onEdit: (schedule: RecurringSchedule) => void;
  onTogglePaused: (schedule: RecurringSchedule) => void;
  onDelete: (schedule: RecurringSchedule) => void;
}

export function RecurringList({ schedules, ...actions }: RecurringListProps) {
  return (
    <ul className="divide-y divide-border border-y border-border">
      {schedules.map((schedule) => (
        <RecurringRow key={schedule.id} schedule={schedule} {...actions} />
      ))}
    </ul>
  );
}

/**
 * One recurring item as an open row: what it is and how often, when it's
 * next due (or that it's paused or ended, in words), the signed amount, and
 * its actions behind one menu.
 */
function RecurringRow({
  schedule,
  onEdit,
  onTogglePaused,
  onDelete,
}: { schedule: RecurringSchedule } & Omit<RecurringListProps, 'schedules'>) {
  const { description, categoryId, type, amountPence, frequency, isDemo, paused } = schedule;
  const isIncome = type === 'income';
  const ended = schedule.nextDueDate === null;

  return (
    <li className="flex items-center gap-3 py-3">
      <CategoryIcon categoryId={categoryId} />

      <div className="min-w-0 flex-1">
        <p className="font-medium break-words">{description}</p>
        <p className="text-sm text-muted-foreground">
          {getCategory(categoryId)?.label ?? 'Unknown category'} · {FREQUENCY_LABELS[frequency]}
          {isDemo && ' · Demo'}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={`font-semibold whitespace-nowrap ${isIncome ? 'text-positive' : 'text-foreground'}`}
        >
          {formatSignedPence(amountPence, isIncome ? 'in' : 'out')}
          <span className="sr-only">{isIncome ? ', income' : ', expense'}</span>
        </p>
        <p
          className={`text-xs whitespace-nowrap ${paused && !ended ? 'font-medium text-warning' : 'text-muted-foreground'}`}
        >
          {scheduleStatusText(schedule)}
        </p>
      </div>

      <div className="-mr-1 shrink-0">
        <RowMenu
          label={`Actions for ${description}`}
          items={[
            {
              label: 'Edit',
              onSelect: () => {
                onEdit(schedule);
              },
            },
            ...(ended
              ? []
              : [
                  {
                    label: paused ? 'Resume' : 'Pause',
                    onSelect: () => {
                      onTogglePaused(schedule);
                    },
                  },
                ]),
            {
              label: 'Delete',
              destructive: true,
              onSelect: () => {
                onDelete(schedule);
              },
            },
          ]}
        />
      </div>
    </li>
  );
}
