import { describe, expect, it } from 'vitest';
import { makeSchedule, makeTransaction } from '../../test/fixtures';
import { catchUpAll, catchUpSchedule, dayAfter, recurringTransactionId } from './catchUp';

const NOW = '2026-11-15T12:00:00.000Z';
const ctx = { today: '2026-11-15', now: NOW, existingIds: new Set<string>() };

describe('catchUpSchedule', () => {
  it('adds every payment due up to today and moves nextDueDate past today', () => {
    const schedule = makeSchedule({ id: 's1', startDate: '2026-09-01', nextDueDate: '2026-09-01' });

    const result = catchUpSchedule(schedule, ctx);

    expect(result.transactions.map((t) => t.date)).toEqual([
      '2026-09-01',
      '2026-10-01',
      '2026-11-01',
    ]);
    expect(result.schedule.nextDueDate).toBe('2026-12-01');
  });

  it('copies the schedule onto each transaction and links it back', () => {
    const schedule = makeSchedule({
      id: 's1',
      nextDueDate: '2026-11-01',
      notes: 'Standing order',
      isDemo: true,
    });

    const [transaction] = catchUpSchedule(schedule, ctx).transactions;

    expect(transaction).toEqual({
      id: 'rec-s1-2026-11-01',
      type: 'expense',
      amountPence: 95000,
      categoryId: 'rent_housing',
      description: 'Rent',
      date: '2026-11-01',
      notes: 'Standing order',
      createdAt: NOW,
      updatedAt: NOW,
      recurringScheduleId: 's1',
      isDemo: true,
    });
  });

  it('includes a payment due today', () => {
    const schedule = makeSchedule({ startDate: '2026-11-15', nextDueDate: '2026-11-15' });
    const result = catchUpSchedule(schedule, ctx);

    expect(result.transactions.map((t) => t.date)).toEqual(['2026-11-15']);
    expect(result.schedule.nextDueDate).toBe('2026-12-15');
  });

  it('keeps month-end dates from drifting', () => {
    const schedule = makeSchedule({ startDate: '2026-08-31', nextDueDate: '2026-08-31' });
    const result = catchUpSchedule(schedule, ctx);

    expect(result.transactions.map((t) => t.date)).toEqual([
      '2026-08-31',
      '2026-09-30',
      '2026-10-31',
    ]);
    expect(result.schedule.nextDueDate).toBe('2026-11-30');
  });

  it('does nothing when the next payment is in the future', () => {
    const schedule = makeSchedule({ nextDueDate: '2026-12-01' });
    const result = catchUpSchedule(schedule, ctx);

    expect(result.schedule).toBe(schedule);
    expect(result.transactions).toEqual([]);
  });

  it('does nothing while paused', () => {
    const schedule = makeSchedule({ paused: true, nextDueDate: '2026-09-01' });
    expect(catchUpSchedule(schedule, ctx).transactions).toEqual([]);
  });

  it('stops at the end date and marks the schedule finished', () => {
    const schedule = makeSchedule({ endDate: '2026-10-15', nextDueDate: '2026-09-01' });
    const result = catchUpSchedule(schedule, ctx);

    expect(result.transactions.map((t) => t.date)).toEqual(['2026-09-01', '2026-10-01']);
    expect(result.schedule.nextDueDate).toBeNull();
  });

  it('skips payments whose transaction already exists', () => {
    const schedule = makeSchedule({ id: 's1', nextDueDate: '2026-10-01' });
    const result = catchUpSchedule(schedule, {
      ...ctx,
      existingIds: new Set([recurringTransactionId('s1', '2026-10-01')]),
    });

    expect(result.transactions.map((t) => t.date)).toEqual(['2026-11-01']);
  });
});

describe('catchUpAll', () => {
  it('returns the same arrays when nothing is due, so nothing is re-saved', () => {
    const schedules = [makeSchedule({ nextDueDate: '2026-12-01' })];
    const transactions = [makeTransaction()];

    const result = catchUpAll(schedules, transactions, ctx);

    expect(result.schedules).toBe(schedules);
    expect(result.transactions).toBe(transactions);
  });

  it('catches up several schedules, keeping existing transactions', () => {
    const existing = makeTransaction();
    const result = catchUpAll(
      [
        makeSchedule({ id: 'rent', nextDueDate: '2026-11-01' }),
        makeSchedule({
          id: 'pay',
          type: 'income',
          categoryId: 'salary',
          frequency: 'fortnightly',
          startDate: '2026-10-23',
          nextDueDate: '2026-10-23',
        }),
      ],
      [existing],
      ctx,
    );

    expect(result.transactions.map((t) => t.id)).toEqual([
      existing.id,
      'rec-rent-2026-11-01',
      'rec-pay-2026-10-23',
      'rec-pay-2026-11-06',
    ]);
    expect(result.schedules.map((s) => s.nextDueDate)).toEqual(['2026-12-01', '2026-11-20']);
  });
});

describe('across the UK clock changes', () => {
  it('steps one calendar day at a time over the 23- and 25-hour days', () => {
    expect(dayAfter('2026-03-28')).toBe('2026-03-29');
    expect(dayAfter('2026-03-29')).toBe('2026-03-30');
    expect(dayAfter('2026-10-24')).toBe('2026-10-25');
    expect(dayAfter('2026-10-25')).toBe('2026-10-26');
  });

  it('adds weekly payments on the right days through the spring change', () => {
    const schedule = makeSchedule({
      frequency: 'weekly',
      startDate: '2026-03-22',
      nextDueDate: '2026-03-22',
    });
    const result = catchUpSchedule(schedule, {
      today: '2026-04-06',
      now: '2026-04-06T12:00:00.000Z',
      existingIds: new Set<string>(),
    });

    expect(result.transactions.map((t) => t.date)).toEqual([
      '2026-03-22',
      '2026-03-29',
      '2026-04-05',
    ]);
    expect(result.schedule.nextDueDate).toBe('2026-04-12');
  });
});
