import { describe, expect, it } from 'vitest';
import type { AppData } from '../models/appData';
import { createEmptyAppData } from '../models/appData';
import type { RecurringSchedule } from '../models/recurring';
import { makeSchedule, makeTransaction } from '../test/fixtures';
import { appDataReducer } from './appDataReducer';

const today = '2026-11-15';
const now = '2026-11-15T12:00:00.000Z';

function stateWith(schedules: RecurringSchedule[], transactions = [makeTransaction()]): AppData {
  return { ...createEmptyAppData(), recurringSchedules: schedules, transactions };
}

const dates = (state: AppData) =>
  state.transactions.filter((t) => t.recurringScheduleId).map((t) => t.date);

describe('recurring schedules in the reducer', () => {
  it('adds a schedule and any payments already due', () => {
    const schedule = makeSchedule({ id: 's1', startDate: '2026-10-01', nextDueDate: '2026-10-01' });
    const after = appDataReducer(stateWith([]), {
      type: 'recurringScheduleAdded',
      schedule,
      today,
      now,
    });

    expect(dates(after)).toEqual(['2026-10-01', '2026-11-01']);
    expect(after.recurringSchedules[0]?.nextDueDate).toBe('2026-12-01');
  });

  it('adds nothing yet for a schedule starting in the future', () => {
    const schedule = makeSchedule({ startDate: '2026-12-01', nextDueDate: '2026-12-01' });
    const after = appDataReducer(stateWith([]), {
      type: 'recurringScheduleAdded',
      schedule,
      today,
      now,
    });

    expect(dates(after)).toEqual([]);
    expect(after.recurringSchedules).toEqual([schedule]);
  });

  it('catching up with nothing due returns the same state', () => {
    const before = stateWith([makeSchedule({ nextDueDate: '2026-12-01' })]);
    expect(appDataReducer(before, { type: 'recurringCaughtUp', today, now })).toBe(before);
  });

  it('never re-adds a payment the user deleted', () => {
    let state = stateWith([makeSchedule({ id: 's1', nextDueDate: '2026-11-01' })], []);
    state = appDataReducer(state, { type: 'recurringCaughtUp', today, now });
    state = appDataReducer(state, { type: 'transactionDeleted', id: 'rec-s1-2026-11-01' });
    state = appDataReducer(state, { type: 'recurringCaughtUp', today, now });

    expect(state.transactions).toEqual([]);
  });

  it('keeps the schedule position when only the amount changes', () => {
    const schedule = makeSchedule({ id: 's1', nextDueDate: '2026-12-01' });
    const after = appDataReducer(stateWith([schedule]), {
      type: 'recurringScheduleUpdated',
      id: 's1',
      changes: { ...draftOf(schedule), amountPence: 99000, notes: '' },
      today,
      now,
    });

    expect(after.recurringSchedules[0]).toMatchObject({
      amountPence: 99000,
      nextDueDate: '2026-12-01',
      updatedAt: now,
    });
    expect(after.recurringSchedules[0]).not.toHaveProperty('notes');
  });

  it('recalculates from today when the timing changes, without back-filling', () => {
    const schedule = makeSchedule({ id: 's1', startDate: '2026-09-01', nextDueDate: '2026-12-01' });
    const after = appDataReducer(stateWith([schedule]), {
      type: 'recurringScheduleUpdated',
      id: 's1',
      changes: { ...draftOf(schedule), startDate: '2026-09-20' },
      today,
      now,
    });

    expect(after.recurringSchedules[0]?.nextDueDate).toBe('2026-11-20');
    expect(dates(after)).toEqual([]);
  });

  it('removes the end date when the form clears it', () => {
    const schedule = makeSchedule({ id: 's1', endDate: '2026-10-15', nextDueDate: null });
    const { endDate: _ignored, ...withoutEnd } = draftOf(schedule);
    const after = appDataReducer(stateWith([schedule]), {
      type: 'recurringScheduleUpdated',
      id: 's1',
      changes: withoutEnd,
      today,
      now,
    });

    expect(after.recurringSchedules[0]).not.toHaveProperty('endDate');
    expect(after.recurringSchedules[0]?.nextDueDate).toBe('2026-12-01');
  });

  it('pausing stops payments; resuming skips the ones missed', () => {
    const schedule = makeSchedule({ id: 's1', paused: true, nextDueDate: '2026-09-01' });
    let state = appDataReducer(stateWith([schedule]), { type: 'recurringCaughtUp', today, now });
    expect(dates(state)).toEqual([]);

    state = appDataReducer(state, {
      type: 'recurringSchedulePaused',
      id: 's1',
      paused: false,
      today,
      now,
    });
    expect(dates(state)).toEqual([]);
    expect(state.recurringSchedules[0]).toMatchObject({ paused: false, nextDueDate: '2026-12-01' });
  });

  it('deleting a schedule keeps the transactions it already added', () => {
    let state = stateWith([makeSchedule({ id: 's1', nextDueDate: '2026-11-01' })], []);
    state = appDataReducer(state, { type: 'recurringCaughtUp', today, now });
    state = appDataReducer(state, { type: 'recurringScheduleDeleted', id: 's1' });

    expect(state.recurringSchedules).toEqual([]);
    expect(dates(state)).toEqual(['2026-11-01']);
  });

  it('clearing demo data removes demo schedules only', () => {
    const real = makeSchedule({ id: 'real' });
    const state = stateWith([real, makeSchedule({ id: 'demo', isDemo: true })]);
    expect(appDataReducer(state, { type: 'demoDataCleared' }).recurringSchedules).toEqual([real]);
  });
});

function draftOf(schedule: RecurringSchedule) {
  const { type, amountPence, categoryId, description, notes, frequency, startDate, endDate } =
    schedule;
  return {
    type,
    amountPence,
    categoryId,
    description,
    frequency,
    startDate,
    ...(notes ? { notes } : {}),
    ...(endDate ? { endDate } : {}),
  };
}
