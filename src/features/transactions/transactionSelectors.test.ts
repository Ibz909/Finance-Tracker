import { describe, expect, it } from 'vitest';
import { makeTransaction } from '../../test/fixtures';
import { groupByDate, sortByNewest, summarise, totalsOf } from './transactionSelectors';

describe('sortByNewest', () => {
  it('orders by date, then entry time, then ID, without mutating the input', () => {
    const older = makeTransaction({ id: 'a', date: '2026-01-01' });
    const sameDayEarly = makeTransaction({
      id: 'b',
      date: '2026-02-01',
      createdAt: '2026-02-01T08:00:00.000Z',
    });
    const sameDayLate = makeTransaction({
      id: 'c',
      date: '2026-02-01',
      createdAt: '2026-02-01T18:00:00.000Z',
    });
    const tieX = makeTransaction({ id: 'x', date: '2025-12-01' });
    const tieY = makeTransaction({ id: 'y', date: '2025-12-01' });
    const input = [older, tieY, sameDayEarly, tieX, sameDayLate];

    expect(sortByNewest(input).map((t) => t.id)).toEqual(['c', 'b', 'a', 'x', 'y']);
    expect(input.map((t) => t.id)).toEqual(['a', 'y', 'b', 'x', 'c']);
  });
});

describe('totalsOf', () => {
  it('adds money in and money out separately, in pence', () => {
    const list = [
      makeTransaction({ type: 'income', amountPence: 250000 }),
      makeTransaction({ type: 'expense', amountPence: 4599 }),
      makeTransaction({ type: 'expense', amountPence: 1 }),
    ];

    expect(totalsOf(list)).toEqual({ inPence: 250000, outPence: 4600 });
  });

  it('is zero for an empty list', () => {
    expect(totalsOf([])).toEqual({ inPence: 0, outPence: 0 });
  });
});

describe('groupByDate', () => {
  it('groups neighbouring transactions with the same date, keeping their order', () => {
    const a = makeTransaction({ id: 'a', date: '2026-11-25' });
    const b = makeTransaction({ id: 'b', date: '2026-11-25' });
    const c = makeTransaction({ id: 'c', date: '2026-11-24' });

    expect(groupByDate([a, b, c])).toEqual([
      { date: '2026-11-25', transactions: [a, b] },
      { date: '2026-11-24', transactions: [c] },
    ]);
  });

  it('never reorders: a date that comes back later starts a new group', () => {
    const a = makeTransaction({ id: 'a', date: '2026-11-25' });
    const b = makeTransaction({ id: 'b', date: '2026-11-24' });
    const c = makeTransaction({ id: 'c', date: '2026-11-25' });

    expect(groupByDate([a, b, c]).map((g) => g.date)).toEqual([
      '2026-11-25',
      '2026-11-24',
      '2026-11-25',
    ]);
  });
});

describe('summarise', () => {
  it('gives money in, money out, the net and the count', () => {
    const list = [
      makeTransaction({ type: 'income', amountPence: 10000 }),
      makeTransaction({ type: 'expense', amountPence: 12550 }),
    ];

    expect(summarise(list)).toEqual({ inPence: 10000, outPence: 12550, netPence: -2550, count: 2 });
  });

  it('is all zeros for an empty list', () => {
    expect(summarise([])).toEqual({ inPence: 0, outPence: 0, netPence: 0, count: 0 });
  });
});
