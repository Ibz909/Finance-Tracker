import type { BudgetStatus } from './budgetProgress';
import { STATUS_DISPLAY } from './budgetStatusDisplay';

/** Status as an icon *and* words, so it never relies on colour alone. */
export function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  const { label, icon: Icon, classes } = STATUS_DISPLAY[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}
