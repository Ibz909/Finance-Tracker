import type { RecurringSchedule } from '../../models/recurring';
import { formatDisplayDate } from '../../utils/dates';

/** When the next payment is, in words: status is never shown by colour alone. */
export function scheduleStatusText(schedule: RecurringSchedule): string {
  if (schedule.nextDueDate === null) {
    return schedule.endDate ? `Ended ${formatDisplayDate(schedule.endDate)}` : 'Ended';
  }
  if (schedule.paused) return 'Paused';
  return `Next ${formatDisplayDate(schedule.nextDueDate)}`;
}

/** Active schedules by next payment; paused and ended ones listed separately. */
export function groupSchedules(schedules: readonly RecurringSchedule[]) {
  const active = schedules
    .filter((s) => !s.paused && s.nextDueDate !== null)
    .sort((a, b) => (a.nextDueDate ?? '').localeCompare(b.nextDueDate ?? ''));
  const inactive = schedules.filter((s) => s.paused || s.nextDueDate === null);
  return { active, inactive };
}
