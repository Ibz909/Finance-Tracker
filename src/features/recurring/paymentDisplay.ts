import type { IsoDate } from '../../utils/dates';
import { addDaysToIsoDate, formatDayHeading } from '../../utils/dates';
import { formatPence, formatSignedPence } from '../../utils/money';
import type { RecurringPayment } from './projection';
import { paymentTotals } from './projection';

/** "Today", "Tomorrow", or a short date such as "Mon 1 Dec". */
export function relativeDueDate(date: IsoDate, today: IsoDate): string {
  if (date === today) return 'Today';
  if (date === addDaysToIsoDate(today, 1)) return 'Tomorrow';
  return formatDayHeading(date, today).short;
}

/** A payment's amount with its direction sign. */
export function signedAmount(payment: RecurringPayment): string {
  return formatSignedPence(payment.amountPence, payment.type === 'income' ? 'in' : 'out');
}

/** A day's payments in words, e.g. "2 payments, £2,650.00 in, £950.00 out". */
export function describeDay(payments: readonly RecurringPayment[]): string {
  const { inPence, outPence } = paymentTotals(payments);
  return [
    `${String(payments.length)} ${payments.length === 1 ? 'payment' : 'payments'}`,
    inPence > 0 ? `${formatPence(inPence)} in` : null,
    outPence > 0 ? `${formatPence(outPence)} out` : null,
  ]
    .filter(Boolean)
    .join(', ');
}

/** A day's net, signed, or £0.00 when it balances. */
export function dayNet(payments: readonly RecurringPayment[]): { text: string; positive: boolean } {
  const { netPence } = paymentTotals(payments);
  if (netPence === 0) return { text: formatPence(0), positive: false };
  return {
    text: formatSignedPence(Math.abs(netPence), netPence > 0 ? 'in' : 'out'),
    positive: netPence > 0,
  };
}
