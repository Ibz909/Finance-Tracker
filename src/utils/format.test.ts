import { describe, expect, it } from 'vitest';
import { formatPercent } from './format';

describe('formatPercent', () => {
  it.each([
    [62.4, '62.4%'],
    [0, '0.0%'],
    [100, '100.0%'],
    [-25, '−25.0%'],
    [1234.5, '1,234.5%'],
  ])('formats %d as %s', (value, expected) => {
    expect(formatPercent(value)).toBe(expected);
  });
});
