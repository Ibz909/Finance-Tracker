import { describe, expect, it } from 'vitest';
import { makeSchedule } from '../../test/fixtures';
import { buildAddSchedule, buildUpdateSchedule, earliestStartDate } from './recurringCommands';

const clock = { today: '2026-11-15', now: '2026-11-15T12:00:00.000Z' };
const input = {
  type: 'expense',
  amountPence: 1199,
  categoryId: 'subscriptions',
  description: 'Music streaming',
  frequency: 'monthly',
  startDate: '2026-11-05',
};

describe('buildAddSchedule', () => {
  it('creates an active schedule whose first payment is the start date', () => {
    const result = buildAddSchedule(input, { id: 'new', ...clock });

    expect(result).toMatchObject({
      ok: true,
      value: {
        type: 'recurringScheduleAdded',
        schedule: { id: 'new', nextDueDate: '2026-11-05', paused: false, isDemo: false },
        today: clock.today,
      },
    });
  });

  it('rejects an income category on an expense', () => {
    const result = buildAddSchedule({ ...input, categoryId: 'salary' }, { id: 'x', ...clock });
    expect(result).toEqual({
      ok: false,
      fieldErrors: { categoryId: ['Choose an expense category'] },
    });
  });

  it('rejects an end date before the start date', () => {
    const result = buildAddSchedule({ ...input, endDate: '2026-11-01' }, { id: 'x', ...clock });
    expect(result).toMatchObject({ ok: false, fieldErrors: { endDate: [expect.any(String)] } });
  });

  it('allows a start up to 12 months ago, but no earlier', () => {
    expect(earliestStartDate('2026-11-15')).toBe('2025-11-15');
    expect(buildAddSchedule({ ...input, startDate: '2025-11-15' }, { id: 'x', ...clock }).ok).toBe(
      true,
    );
    expect(
      buildAddSchedule({ ...input, startDate: '2025-11-14' }, { id: 'x', ...clock }),
    ).toMatchObject({
      ok: false,
      fieldErrors: { startDate: [expect.stringMatching(/12 months/)] },
    });
  });
});

describe('buildUpdateSchedule', () => {
  it('lets an old schedule be edited without moving its start date', () => {
    const old = makeSchedule({ startDate: '2024-01-01' });
    const result = buildUpdateSchedule(old, { ...input, startDate: '2024-01-01' }, clock);
    expect(result.ok).toBe(true);
  });

  it('still rejects moving the start date too far back', () => {
    const current = makeSchedule({ startDate: '2026-09-01' });
    const result = buildUpdateSchedule(current, { ...input, startDate: '2024-01-01' }, clock);
    expect(result.ok).toBe(false);
  });
});
