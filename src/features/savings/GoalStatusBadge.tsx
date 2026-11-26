import type { GoalStatus } from './goalProgress';
import { GOAL_STATUS_DISPLAY } from './goalStatusDisplay';

/** Status as an icon *and* words, so it never relies on colour alone. */
export function GoalStatusBadge({ status }: { status: GoalStatus }) {
  const { label, icon: Icon, classes } = GOAL_STATUS_DISPLAY[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-medium ${classes}`}>
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}
