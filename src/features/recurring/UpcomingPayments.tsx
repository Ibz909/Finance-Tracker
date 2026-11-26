import type { Frequency } from '../../models/recurring';
import type { IsoDate } from '../../utils/dates';
import { PaymentRow } from './PaymentRow';
import { relativeDueDate } from './paymentDisplay';
import type { RecurringPayment } from './projection';

interface UpcomingPaymentsProps {
  payments: readonly RecurringPayment[];
  today: IsoDate;
  frequencyOf: (scheduleId: string | null) => Frequency | undefined;
}

/** The next few payments across every active item, soonest first. */
export function UpcomingPayments({ payments, today, frequencyOf }: UpcomingPaymentsProps) {
  return (
    <section aria-labelledby="upcoming-heading">
      <h2 id="upcoming-heading" className="text-lg font-semibold">
        Upcoming
      </h2>
      {payments.length > 0 ? (
        <ul className="mt-2 divide-y divide-border border-y border-border">
          {payments.map((payment) => (
            <PaymentRow
              key={payment.key}
              payment={payment}
              frequency={frequencyOf(payment.scheduleId)}
              lead={
                <span className="w-[5.5rem] shrink-0 text-sm font-medium whitespace-nowrap tabular-nums">
                  {relativeDueDate(payment.date, today)}
                </span>
              }
            />
          ))}
        </ul>
      ) : (
        <p className="mt-2 border-t border-border pt-3 text-sm text-muted-foreground">
          Nothing coming up. Resume a paused item or add a new one.
        </p>
      )}
    </section>
  );
}
