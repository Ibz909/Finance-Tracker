import { describe, expect, it } from 'vitest';
import { makeSchedule, makeTransaction } from '../../test/fixtures';
import {
  duePayments,
  monthPayments,
  paymentsByDate,
  paymentTotals,
  upcomingPayments,
} from './projection';

// "Today" in these tests is Sunday 15 November 2026.
const TODAY = '2026-11-15';

const rent = makeSchedule({
  id: 'rent',
  description: 'Rent',
  amountPence: 95000,
  startDate: '2026-09-01',
  nextDueDate: '2026-12-01',
});
const salary = makeSchedule({
  id: 'salary',
  type: 'income',
  categoryId: 'salary',
  description: 'Salary',
  amountPence: 265000,
  startDate: '2026-09-28',
  nextDueDate: '2026-11-28',
});
const gym = makeSchedule({
  id: 'gym',
  description: 'Gym',
  amountPence: 3000,
  frequency: 'weekly',
  startDate: '2026-11-02',
  nextDueDate: '2026-11-16',
});

describe('monthPayments', () => {
  it('shows what was paid up to today and what is still due after it', () => {
    const paidRent = makeTransaction({
      id: 'r-nov',
      description: 'Rent',
      amountPence: 95000,
      date: '2026-11-01',
      recurringScheduleId: 'rent',
    });
    const oneOff = makeTransaction({ date: '2026-11-03', description: 'Coffee' });

    const payments = monthPayments([rent, salary], [paidRent, oneOff], '2026-11');

    expect(payments.map((p) => [p.date, p.description, p.status])).toEqual([
      ['2026-11-01', 'Rent', 'paid'],
      ['2026-11-28', 'Salary', 'due'],
    ]);
  });

  it('never shows a paused schedule as due, nor a skipped past payment as paid', () => {
    const paused = { ...salary, paused: true };
    expect(monthPayments([paused], [], '2026-11')).toEqual([]);
    expect(monthPayments([paused], [], '2026-12')).toEqual([]);
  });

  it('stops at the end date and ignores ended schedules', () => {
    const ending = { ...gym, endDate: '2026-11-23' };
    expect(monthPayments([ending], [], '2026-11').map((p) => p.date)).toEqual([
      '2026-11-16',
      '2026-11-23',
    ]);
    expect(monthPayments([{ ...gym, nextDueDate: null }], [], '2026-11')).toEqual([]);
  });

  it('projects a future month in full, with several payments on one day', () => {
    const payments = monthPayments(
      [rent, salary, { ...gym, startDate: '2026-11-30' }],
      [],
      '2026-12',
    );
    const days = paymentsByDate(payments);

    expect(days.get('2026-12-01')?.map((p) => p.description)).toEqual(['Rent']);
    expect(days.get('2026-12-28')?.map((p) => p.description)).toEqual(['Gym', 'Salary']);
  });
});

describe('upcomingPayments', () => {
  it('lists the next payments across schedules in date order', () => {
    const next = upcomingPayments([rent, salary, gym], TODAY, 5);
    expect(next.map((p) => `${p.date} ${p.description}`)).toEqual([
      '2026-11-16 Gym',
      '2026-11-23 Gym',
      '2026-11-28 Salary',
      '2026-11-30 Gym',
      '2026-12-01 Rent',
    ]);
  });

  it('finds the next payment of a yearly schedule', () => {
    const insurance = makeSchedule({
      frequency: 'yearly',
      startDate: '2026-03-10',
      nextDueDate: '2027-03-10',
    });
    expect(upcomingPayments([insurance], TODAY).map((p) => p.date)).toEqual(['2027-03-10']);
  });
});

describe('paymentTotals', () => {
  it('adds money in and out and works out the net', () => {
    const payments = duePayments([rent, salary], '2026-11-16', '2026-12-31');
    // Salary twice (28 Nov, 28 Dec) in; rent once (1 Dec) out.
    expect(paymentTotals(payments)).toEqual({
      inPence: 530000,
      outPence: 95000,
      netPence: 435000,
    });
  });
});
