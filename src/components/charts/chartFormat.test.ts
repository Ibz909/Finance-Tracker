import { describe, expect, it } from 'vitest';
import { formatAxisPence, formatTooltipPence, niceTicks } from './chartFormat';

describe('formatAxisPence', () => {
  it.each([
    [0, '£0'],
    [85000, '£850'],
    [100000, '£1k'],
    [125000, '£1.3k'],
    [1250000, '£13k'],
  ])('formats %i pence as %s', (pence, expected) => {
    expect(formatAxisPence(pence)).toBe(expected);
  });
});

describe('formatTooltipPence', () => {
  it('shows exact amounts', () => {
    expect(formatTooltipPence(123456)).toBe('£1,234.56');
  });
});

describe('niceTicks', () => {
  it.each([
    [340000, [0, 100000, 200000, 300000, 400000]], // up to £3,400 → £1k steps
    [220000, [0, 100000, 200000, 300000]],
    [9000, [0, 2500, 5000, 7500, 10000]],
    [0, [0]],
  ])('covers %i pence with round steps', (max, expected) => {
    expect(niceTicks(max)).toEqual(expected);
  });
});
