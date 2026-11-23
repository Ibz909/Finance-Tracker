import type { MonthKey } from '../../utils/dates';
import { shiftMonth } from '../../utils/dates';
import { monthsEndingAt } from './analytics';

export interface RangePreset {
  id: string;
  label: string;
  /** Short label for the segmented control on small screens. */
  shortLabel: string;
  /** How many calendar months the range covers. */
  months: number;
  /** Where the range ends relative to the current month (0 = this month, -1 = last month). */
  endOffset: number;
}

/**
 * Reporting ranges, always whole calendar months. "Last N months" means the
 * N calendar months ending with the current one, so "Last 3 months" in
 * November 2026 is September – November 2026.
 */
export const RANGE_PRESETS = [
  { id: 'this-month', label: 'This month', shortLabel: 'This month', months: 1, endOffset: 0 },
  { id: 'last-month', label: 'Last month', shortLabel: 'Last month', months: 1, endOffset: -1 },
  { id: 'last-3', label: 'Last 3 months', shortLabel: '3 months', months: 3, endOffset: 0 },
  { id: 'last-6', label: 'Last 6 months', shortLabel: '6 months', months: 6, endOffset: 0 },
  { id: 'last-12', label: 'Last 12 months', shortLabel: '12 months', months: 12, endOffset: 0 },
] as const satisfies readonly RangePreset[];

export type RangePresetId = (typeof RANGE_PRESETS)[number]['id'];

export const DEFAULT_RANGE_ID: RangePresetId = 'last-6';

export function isRangePresetId(value: unknown): value is RangePresetId {
  return RANGE_PRESETS.some((preset) => preset.id === value);
}

export function getRangePreset(id: RangePresetId): RangePreset {
  return RANGE_PRESETS.find((preset) => preset.id === id) ?? RANGE_PRESETS[3];
}

/** The exact calendar months a preset covers, oldest first. */
export function resolveRange(id: RangePresetId, currentMonth: MonthKey): MonthKey[] {
  const preset = getRangePreset(id);
  return monthsEndingAt(shiftMonth(currentMonth, preset.endOffset), preset.months);
}
