import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useReportingMonth } from '../../hooks/useReportingMonth';
import { formatMonthLabel, shiftMonth } from '../../utils/dates';
import { Button } from '../ui/Button';

/** Steps the shared reporting month backwards and forwards. */
export function MonthPicker() {
  const { month, currentMonth, setMonth } = useReportingMonth();
  const previous = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);

  return (
    <div role="group" aria-label="Reporting month" className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Previous month, ${formatMonthLabel(previous)}`}
        onClick={() => {
          setMonth(previous);
        }}
      >
        <ChevronLeft aria-hidden="true" className="size-5" />
      </Button>
      {/* Announced politely when it changes, so screen-reader users hear the new month. */}
      <p aria-live="polite" className="min-w-32 text-center text-sm font-medium tabular-nums">
        {formatMonthLabel(month)}
      </p>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Next month, ${formatMonthLabel(next)}`}
        onClick={() => {
          setMonth(next);
        }}
      >
        <ChevronRight aria-hidden="true" className="size-5" />
      </Button>
      {month !== currentMonth && (
        <Button
          variant="secondary"
          className="ml-1 h-9 px-3 sm:h-9"
          onClick={() => {
            setMonth(currentMonth);
          }}
        >
          This month
        </Button>
      )}
    </div>
  );
}
