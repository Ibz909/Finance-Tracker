import { Pause, Pencil, Play, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
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
    <ul className="divide-y divide-border">
      {schedules.map((schedule) => (
        <RecurringRow key={schedule.id} schedule={schedule} {...actions} />
      ))}
    </ul>
  );
}

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
    <li className="flex flex-wrap items-center gap-x-3 px-4 py-3 sm:flex-nowrap sm:gap-4 sm:px-6">
      <CategoryIcon categoryId={categoryId} />

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
          <span className="min-w-0 break-words">{description}</span>
          {isDemo && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Demo
            </span>
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          {getCategory(categoryId)?.label ?? 'Unknown category'} · {FREQUENCY_LABELS[frequency]} ·{' '}
          <span className={paused && !ended ? 'font-medium text-warning' : undefined}>
            {scheduleStatusText(schedule)}
          </span>
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={`font-semibold tabular-nums ${isIncome ? 'text-positive' : 'text-foreground'}`}
        >
          {formatSignedPence(amountPence, isIncome ? 'in' : 'out')}
        </p>
        <p className="text-xs text-muted-foreground">{isIncome ? 'Income' : 'Expense'}</p>
      </div>

      <div className="-mb-2 flex shrink-0 basis-full justify-end sm:mb-0 sm:basis-auto">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Edit ${description}`}
          onClick={() => {
            onEdit(schedule);
          }}
        >
          <Pencil aria-hidden="true" className="size-4" />
        </Button>
        {!ended && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${paused ? 'Resume' : 'Pause'} ${description}`}
            onClick={() => {
              onTogglePaused(schedule);
            }}
          >
            {paused ? (
              <Play aria-hidden="true" className="size-4" />
            ) : (
              <Pause aria-hidden="true" className="size-4" />
            )}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="hover:text-negative"
          aria-label={`Delete ${description}`}
          onClick={() => {
            onDelete(schedule);
          }}
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </li>
  );
}
