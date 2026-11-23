import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { RangePresetId } from '../features/analytics/ranges';
import {
  DEFAULT_RANGE_ID,
  getRangePreset,
  isRangePresetId,
  resolveRange,
} from '../features/analytics/ranges';
import { useReportingMonth } from './useReportingMonth';

export const RANGE_PARAM = 'range';

/**
 * The Analytics date range, kept in the URL (?range=last-12) so it survives
 * a refresh, can be bookmarked or shared, and works with Back/Forward.
 * A missing or unknown value falls back to the default range.
 */
export function useAnalyticsRange() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentMonth } = useReportingMonth();

  const raw = searchParams.get(RANGE_PARAM);
  const rangeId: RangePresetId = isRangePresetId(raw) ? raw : DEFAULT_RANGE_ID;
  const months = useMemo(() => resolveRange(rangeId, currentMonth), [rangeId, currentMonth]);

  const setRange = useCallback(
    (id: RangePresetId) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        // Keep URLs tidy: the default range needs no parameter.
        if (id === DEFAULT_RANGE_ID) next.delete(RANGE_PARAM);
        else next.set(RANGE_PARAM, id);
        return next;
      });
    },
    [setSearchParams],
  );

  return { rangeId, preset: getRangePreset(rangeId), months, setRange };
}
