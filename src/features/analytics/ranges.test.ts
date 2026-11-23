import { describe, expect, it } from 'vitest';
import { getRangePreset, isRangePresetId, RANGE_PRESETS, resolveRange } from './ranges';

describe('resolveRange', () => {
  it.each([
    ['this-month', ['2026-11']],
    ['last-month', ['2026-10']],
    ['last-3', ['2026-09', '2026-10', '2026-11']],
    ['last-6', ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11']],
  ] as const)('%s in November 2026 is %j', (id, expected) => {
    expect(resolveRange(id, '2026-11')).toEqual(expected);
  });

  it('crosses into the previous year', () => {
    expect(resolveRange('last-month', '2026-01')).toEqual(['2025-12']);
    expect(resolveRange('last-3', '2026-02')).toEqual(['2025-12', '2026-01', '2026-02']);
  });

  it('covers exactly twelve calendar months for the last year', () => {
    const months = resolveRange('last-12', '2024-02');
    expect(months).toHaveLength(12);
    expect(months[0]).toBe('2023-03');
    expect(months.at(-1)).toBe('2024-02'); // includes leap-year February
    expect(new Set(months).size).toBe(12); // no month counted twice
  });

  it('gives every preset a whole number of distinct months', () => {
    for (const preset of RANGE_PRESETS) {
      const months = resolveRange(preset.id, '2026-11');
      expect(months).toHaveLength(preset.months);
      expect(new Set(months).size).toBe(preset.months);
    }
  });
});

describe('preset lookup', () => {
  it('recognises valid IDs only', () => {
    expect(isRangePresetId('last-3')).toBe(true);
    expect(isRangePresetId('last-4')).toBe(false);
    expect(isRangePresetId(null)).toBe(false);
  });

  it('finds presets by ID', () => {
    expect(getRangePreset('last-12').label).toBe('Last 12 months');
  });
});
