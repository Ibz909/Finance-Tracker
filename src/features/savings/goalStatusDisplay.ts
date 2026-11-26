import type { LucideIcon } from 'lucide-react';
import { CircleCheck, CircleDashed, TriangleAlert } from 'lucide-react';
import type { GoalStatus } from './goalProgress';

/** Words, icon and colours for each goal status, in one place. */
export const GOAL_STATUS_DISPLAY: Record<
  GoalStatus,
  { label: string; icon: LucideIcon; classes: string; bar: 'accent' | 'warning' }
> = {
  'in-progress': {
    label: 'In progress',
    icon: CircleDashed,
    classes: 'text-muted-foreground',
    bar: 'accent',
  },
  reached: {
    label: 'Goal reached',
    icon: CircleCheck,
    classes: 'text-positive',
    bar: 'accent',
  },
  overdue: {
    label: 'Target date passed',
    icon: TriangleAlert,
    classes: 'text-warning',
    bar: 'warning',
  },
};
