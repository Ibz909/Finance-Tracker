import { describe, expect, it } from 'vitest';
import { formatAxisPence, formatTooltipPence } from './chartFormat';

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
