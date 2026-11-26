import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useEffect, useId, useRef } from 'react';
import type { IsoDate, MonthKey } from '../../utils/dates';
import {
  addDaysToIsoDate,
  formatDayHeading,
  formatMonthLabel,
  getMonthBounds,
  parseIsoDate,
  shiftMonth,
  toMonthKey,
} from '../../utils/dates';
import { Button } from './Button';

/** What a day carries: one marker per item, a short figure and words for screen readers. */
export interface CalendarDayInfo {
  /** One per item on the day, in order. "positive" draws a filled turquoise dot; "neutral" a grey ring. */
  markers: readonly ('positive' | 'neutral')[];
  /** A short figure shown when the grid is wide enough to fit it whole, e.g. "+£2,650.00". */
  figure?: string;
  /** Tone of the figure. */
  figureTone?: 'positive' | 'neutral';
  /** Read after the date, e.g. "2 payments, £2,650.00 in". */
  description: string;
}

interface MonthCalendarProps {
  month: MonthKey;
  today: IsoDate;
  selected: IsoDate;
  days: ReadonlyMap<IsoDate, CalendarDayInfo>;
  onSelect: (date: IsoDate) => void;
  onMonthChange: (month: MonthKey) => void;
  /** Names the grid, e.g. "Recurring payments". The month is added to it. */
  label: string;
}

const WEEKDAYS = [
  ['Mon', 'Monday'],
  ['Tue', 'Tuesday'],
  ['Wed', 'Wednesday'],
  ['Thu', 'Thursday'],
  ['Fri', 'Friday'],
  ['Sat', 'Saturday'],
  ['Sun', 'Sunday'],
] as const;

const MAX_MARKERS = 3;

/** Monday-first weeks covering the month; null pads the days of other months. */
function weeksOf(month: MonthKey): (IsoDate | null)[][] {
  const { start, end } = getMonthBounds(month);
  // getDay(): Sunday 0 … Saturday 6; shifted so Monday is 0.
  const lead = (parseIsoDate(start).getDay() + 6) % 7;
  const cells: (IsoDate | null)[] = Array.from({ length: lead }, () => null);
  for (let date = start; date <= end; date = addDaysToIsoDate(date, 1)) cells.push(date);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (IsoDate | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Where a navigation key moves the selection, or null for keys it ignores. */
function targetFor(key: string, date: IsoDate): IsoDate | null {
  const weekday = (parseIsoDate(date).getDay() + 6) % 7;
  switch (key) {
    case 'ArrowLeft':
      return addDaysToIsoDate(date, -1);
    case 'ArrowRight':
      return addDaysToIsoDate(date, 1);
    case 'ArrowUp':
      return addDaysToIsoDate(date, -7);
    case 'ArrowDown':
      return addDaysToIsoDate(date, 7);
    case 'Home':
      return addDaysToIsoDate(date, -weekday);
    case 'End':
      return addDaysToIsoDate(date, 6 - weekday);
    case 'PageUp':
    case 'PageDown': {
      const month = shiftMonth(toMonthKey(date), key === 'PageUp' ? -1 : 1);
      const { end } = getMonthBounds(month);
      // The same day of the month, or the last day of a shorter month.
      const same = `${month}-${date.slice(8)}`;
      return same > end ? end : same;
    }
    default:
      return null;
  }
}

/**
 * A month as a Monday-first grid of days, following the WAI-ARIA date grid
 * pattern: one day is in the tab order, the arrow keys move by day and week,
 * Home and End go to the week's start and end, Page Up and Page Down change
 * month. Moving past either end of the month turns the page.
 */
export function MonthCalendar({
  month,
  today,
  selected,
  days,
  onSelect,
  onMonthChange,
  label,
}: MonthCalendarProps) {
  const headingId = useId();
  const gridRef = useRef<HTMLTableElement>(null);
  // Focus follows the selection only after a key press, never on first render.
  const focusAfterRender = useRef(false);

  useEffect(() => {
    if (!focusAfterRender.current) return;
    focusAfterRender.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${selected}"]`)?.focus();
  }, [selected, month]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, date: IsoDate) => {
    const target = targetFor(event.key, date);
    if (target === null) return;
    event.preventDefault();
    focusAfterRender.current = true;
    const targetMonth = toMonthKey(target);
    if (targetMonth !== month) onMonthChange(targetMonth);
    onSelect(target);
  };

  const previous = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);

  return (
    // A container, so day figures appear only when the grid itself is wide enough to show them whole.
    <div className="@container">
      <div className="flex items-center justify-between gap-2">
        <h2 id={headingId} aria-live="polite" className="text-base font-semibold">
          {formatMonthLabel(month)}
        </h2>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Previous month, ${formatMonthLabel(previous)}`}
            onClick={() => {
              onMonthChange(previous);
            }}
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Next month, ${formatMonthLabel(next)}`}
            onClick={() => {
              onMonthChange(next);
            }}
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </Button>
        </div>
      </div>

      <table
        ref={gridRef}
        role="grid"
        aria-label={`${label}, ${formatMonthLabel(month)}`}
        className="mt-3 w-full table-fixed border-separate border-spacing-0.5 sm:border-spacing-1"
      >
        <thead>
          <tr>
            {WEEKDAYS.map(([short, long]) => (
              <th
                key={short}
                scope="col"
                abbr={long}
                className="pb-1 pl-1.5 text-left text-xs font-medium text-muted-foreground sm:pl-2"
              >
                {/* Lines up with the day numbers below. */}
                <span aria-hidden="true" className="inline-block px-1">
                  <span className="sm:hidden">{short.charAt(0)}</span>
                  <span className="hidden sm:inline">{short}</span>
                </span>
                <span className="sr-only">{long}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeksOf(month).map((week) => (
            <tr key={week.find((d) => d !== null) ?? ''}>
              {week.map((date, i) =>
                date === null ? (
                  // Padding cells have no identity of their own; position is their key.
                  <td key={`pad-${String(i)}`} aria-hidden="true" />
                ) : (
                  <td key={date} className="p-0">
                    <DayButton
                      date={date}
                      info={days.get(date)}
                      isToday={date === today}
                      isPast={date < today}
                      isSelected={date === selected}
                      onSelect={onSelect}
                      onKeyDown={onKeyDown}
                    />
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DayButton({
  date,
  info,
  isToday,
  isPast,
  isSelected,
  onSelect,
  onKeyDown,
}: {
  date: IsoDate;
  info: CalendarDayInfo | undefined;
  isToday: boolean;
  isPast: boolean;
  isSelected: boolean;
  onSelect: (date: IsoDate) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, date: IsoDate) => void;
}) {
  const markers = info?.markers ?? [];
  const extra = markers.length - MAX_MARKERS;
  const name = [
    isToday ? 'Today' : null,
    formatDayHeading(date, date).full,
    info?.description ?? 'No payments',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <button
      type="button"
      data-date={date}
      tabIndex={isSelected ? 0 : -1}
      aria-pressed={isSelected}
      aria-current={isToday ? 'date' : undefined}
      aria-label={name}
      onClick={() => {
        onSelect(date);
      }}
      onKeyDown={(event) => {
        onKeyDown(event, date);
      }}
      className={`flex h-14 w-full flex-col items-start justify-between rounded-md border p-1.5 text-left transition-colors duration-150 sm:h-20 sm:p-2 ${
        isSelected ? 'border-input-border bg-muted' : 'border-transparent hover:bg-muted/60'
      }`}
    >
      <span
        className={`flex h-6 min-w-6 items-center rounded-sm px-1 text-sm tabular-nums ${
          isToday
            ? 'border border-accent font-semibold text-accent'
            : isPast
              ? 'text-muted-foreground'
              : 'font-medium text-foreground'
        }`}
      >
        {Number(date.slice(8))}
      </span>
      {markers.length > 0 && (
        <span className="flex w-full min-w-0 flex-col gap-1 px-1">
          {info?.figure && (
            <span
              className={`hidden text-xs leading-none font-medium whitespace-nowrap tabular-nums @[36rem]:block ${
                info.figureTone === 'positive' ? 'text-positive' : 'text-muted-foreground'
              }`}
            >
              {info.figure}
            </span>
          )}
          <span className="flex items-center gap-1">
            {markers.slice(0, MAX_MARKERS).map((tone, i) => (
              <span
                // Markers are positional.
                key={i}
                className={`size-2 shrink-0 rounded-full ${
                  tone === 'positive'
                    ? 'bg-accent'
                    : 'border border-muted-foreground bg-transparent'
                }`}
              />
            ))}
            {extra > 0 && (
              <span className="text-[11px] leading-none text-muted-foreground">+{extra}</span>
            )}
          </span>
        </span>
      )}
    </button>
  );
}
