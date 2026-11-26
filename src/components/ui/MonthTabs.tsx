import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { MonthKey } from '../../utils/dates';
import { formatMonthLabel, formatShortMonth } from '../../utils/dates';

/** A month key such as "2026-11", or "all" for All time. */
export type MonthTabValue = MonthKey;

interface MonthTabsProps {
  /** The selected month, "all", or null when neither applies (e.g. a custom range). */
  value: MonthTabValue | null;
  onChange: (value: MonthTabValue) => void;
  /** Year to show when nothing is selected, usually the current one. */
  fallbackYear: number;
  /** Names the group for screen readers, e.g. "Period". */
  legend: string;
}

const MONTH_NUMBERS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

const yearOf = (value: MonthTabValue | null, fallback: number) =>
  value && value !== 'all' ? Number(value.slice(0, 4)) : fallback;

/**
 * Month navigation: "All time", a year switcher and the twelve months as
 * one radio group, so arrow keys move between them and screen readers
 * announce "November 2026, selected". On narrow screens the months scroll
 * sideways and the selected one is brought into view.
 */
export function MonthTabs({ value, onChange, fallbackYear, legend }: MonthTabsProps) {
  const [year, setYear] = useState(() => yearOf(value, fallbackYear));
  // Follow the selection to its year when it changes from outside.
  const [shownFor, setShownFor] = useState(value);
  if (value !== shownFor) {
    setShownFor(value);
    if (value && value !== 'all') setYear(yearOf(value, fallbackYear));
  }

  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const selected = stripRef.current?.querySelector<HTMLElement>('[data-selected="true"]');
    // Centred, so the neighbouring months show on both sides of the selection.
    selected?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [value, year]);

  const tab =
    'relative flex h-11 shrink-0 cursor-pointer items-center px-3 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground has-checked:text-accent has-checked:after:absolute has-checked:after:inset-x-2 has-checked:after:-bottom-px has-checked:after:h-0.5 has-checked:after:rounded-full has-checked:after:bg-accent has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-accent sm:h-10';

  return (
    <fieldset className="min-w-0 border-b border-border">
      <legend className="sr-only">{legend}</legend>
      {/* Phones: All time and the year on one row, the months scrolling full width below. */}
      <div className="flex flex-wrap items-center sm:flex-nowrap">
        <label className={tab} data-selected={value === 'all'}>
          <input
            type="radio"
            name="month-tabs"
            value="all"
            checked={value === 'all'}
            onChange={() => {
              onChange('all');
            }}
            className="sr-only"
          />
          All time
        </label>

        <span aria-hidden="true" className="mx-1 hidden h-5 w-px shrink-0 bg-border sm:block" />

        <div className="ml-auto flex shrink-0 items-center sm:ml-0">
          <button
            type="button"
            aria-label={`Show ${String(year - 1)}`}
            onClick={() => {
              setYear(year - 1);
            }}
            className="flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground sm:size-9"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
          <span aria-live="polite" className="w-11 text-center text-sm font-medium">
            {year}
          </span>
          <button
            type="button"
            aria-label={`Show ${String(year + 1)}`}
            onClick={() => {
              setYear(year + 1);
            }}
            className="flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground sm:size-9"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </div>

        <div
          ref={stripRef}
          // A short fade at each edge says there is more to scroll to.
          className="flex min-w-0 basis-full overflow-x-auto sm:flex-1 sm:basis-auto [mask-image:linear-gradient(to_right,transparent,black_1rem,black_calc(100%-1rem),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {MONTH_NUMBERS.map((mm) => {
            const month = `${String(year)}-${mm}`;
            return (
              <label key={month} className={tab} data-selected={value === month}>
                <input
                  type="radio"
                  name="month-tabs"
                  value={month}
                  checked={value === month}
                  onChange={() => {
                    onChange(month);
                  }}
                  className="sr-only"
                  aria-label={formatMonthLabel(month)}
                />
                <span aria-hidden="true">{formatShortMonth(month)}</span>
              </label>
            );
          })}
        </div>
      </div>
    </fieldset>
  );
}
