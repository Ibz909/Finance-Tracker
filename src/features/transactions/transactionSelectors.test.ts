import { describe, expect, it } from 'vitest';
import { makeTransaction } from '../../test/fixtures';
import { sortByNewest } from './transactionSelectors';

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
