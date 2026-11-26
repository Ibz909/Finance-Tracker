import { CategoryIcon } from '../../components/ui/CategoryIcon';
import type { CalendarDayInfo } from '../../components/ui/MonthCalendar';
import { MonthCalendar } from '../../components/ui/MonthCalendar';
import type { Frequency } from '../../models/recurring';
import type { IsoDate, MonthKey } from '../../utils/dates';
import { formatDayHeading } from '../../utils/dates';
import { PaymentRow } from './PaymentRow';
import { dayNet, describeDay } from './paymentDisplay';
import type { RecurringPayment } from './projection';

interface RecurringCalendarProps {
  month: MonthKey;
  today: IsoDate;
  selected: IsoDate;
  byDate: ReadonlyMap<IsoDate, RecurringPayment[]>;
  onSelect: (date: IsoDate) => void;
  onMonthChange: (month: MonthKey) => void;
}

/** The month's recurring payments on a calendar: a filled dot for money in, a ring for money out. */
export function RecurringCalendar({ byDate, ...props }: RecurringCalendarProps) {
  const days = new Map<IsoDate, CalendarDayInfo>();
  for (const [date, payments] of byDate) {
    const net = dayNet(payments);
    days.set(date, {
      markers: payments.map((p) => (p.type === 'income' ? 'positive' : 'neutral')),
      // Up to "+£9,999.99" fits a day cell whole; larger figures are left to the day panel.
      figure: net.text.length <= 10 ? net.text : undefined,
      figureTone: net.positive ? 'positive' : 'neutral',
      description: describeDay(payments),
    });
  }

  return (
    <section
      aria-label="Calendar"
      className="rounded-xl border border-border bg-surface p-3 sm:p-5"
    >
      <MonthCalendar label="Recurring payments" days={days} {...props} />
      <p
        aria-hidden="true"
        className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-muted-foreground"
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-accent" />
          Money in
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full border border-muted-foreground" />
          Money out
        </span>
      </p>
    </section>
  );
}

interface SelectedDayProps {
  date: IsoDate;
  today: IsoDate;
  payments: readonly RecurringPayment[];
  frequencyOf: (scheduleId: string | null) => Frequency | undefined;
}

/** What falls on the chosen day: paid if it's already in your transactions, due if it's still to come. */
export function SelectedDay({ date, today, payments, frequencyOf }: SelectedDayProps) {
  const heading = formatDayHeading(date, today);
  const title = date === today ? `Today, ${heading.full}` : heading.full;

  return (
    <section aria-labelledby="selected-day-heading">
      <h2 id="selected-day-heading" className="text-lg font-semibold">
        {title}
      </h2>
      {payments.length > 0 ? (
        <ul className="mt-2 divide-y divide-border border-y border-border">
          {payments.map((payment) => (
            <PaymentRow
              key={payment.key}
              payment={payment}
              frequency={frequencyOf(payment.scheduleId)}
              lead={<CategoryIcon categoryId={payment.categoryId} />}
              note={payment.status === 'paid' ? 'Paid' : 'Due'}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-2 border-t border-border pt-3 text-sm text-muted-foreground">
          No recurring payments on this day.
        </p>
      )}
    </section>
  );
}
