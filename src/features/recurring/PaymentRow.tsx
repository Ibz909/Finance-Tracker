import type { ReactNode } from 'react';
import { getCategory } from '../../constants/categories';
import type { Frequency } from '../../models/recurring';
import type { RecurringPayment } from './projection';
import { signedAmount } from './paymentDisplay';
import { FREQUENCY_LABELS } from './schedule';

interface PaymentRowProps {
  payment: RecurringPayment;
  /** Shown before the name: a category tile or a date. */
  lead: ReactNode;
  /** The schedule's frequency, when it still exists. */
  frequency: Frequency | undefined;
  /** A word under the amount, e.g. "Paid" or "Due". */
  note?: string;
}

/** One recurring payment as an open row: name, category and frequency, then the signed amount. */
export function PaymentRow({ payment, lead, frequency, note }: PaymentRowProps) {
  const isIncome = payment.type === 'income';
  const category = getCategory(payment.categoryId)?.label ?? 'Unknown category';

  return (
    <li className="flex items-center gap-3 py-3">
      {lead}
      <div className="min-w-0 flex-1">
        <p className="font-medium break-words">{payment.description}</p>
        <p className="text-sm text-muted-foreground">
          {frequency ? `${category} · ${FREQUENCY_LABELS[frequency]}` : category}
          {payment.isDemo && ' · Demo'}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={`font-semibold whitespace-nowrap ${isIncome ? 'text-positive' : 'text-foreground'}`}
        >
          {signedAmount(payment)}
          <span className="sr-only">{isIncome ? ', income' : ', expense'}</span>
        </p>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
    </li>
  );
}
