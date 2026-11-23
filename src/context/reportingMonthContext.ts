import { createContext } from 'react';
import type { MonthKey } from '../utils/dates';

export interface ReportingMonthContextValue {
  /** The calendar month being reported on, e.g. "2026-11". */
  month: MonthKey;
  /** Today's month, for "This month" and default selection. */
  currentMonth: MonthKey;
  setMonth: (month: MonthKey) => void;
}

export const ReportingMonthContext = createContext<ReportingMonthContextValue | null>(null);
