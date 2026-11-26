import type { LucideIcon } from 'lucide-react';
import { CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react';
import type { BudgetStatus } from './budgetProgress';

/** Words, icon and colours for each budget status, in one place. */
export const STATUS_DISPLAY: Record<
  BudgetStatus,
  { label: string; icon: LucideIcon; classes: string; bar: 'accent' | 'warning' | 'negative' }
> = {
  normal: {
    label: 'On track',
    icon: CircleCheck,
    classes: 'text-positive',
    bar: 'accent',
  },
  warning: {
    label: 'Nearing limit',
    icon: TriangleAlert,
    classes: 'text-warning',
    bar: 'warning',
  },
  exceeded: {
    label: 'Over budget',
    icon: CircleAlert,
    classes: 'text-negative',
    bar: 'negative',
  },
};
