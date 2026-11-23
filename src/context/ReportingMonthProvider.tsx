import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import type { MonthKey } from '../utils/dates';
import { currentMonthKey } from '../utils/dates';
import { ReportingMonthContext } from './reportingMonthContext';

interface ReportingMonthProviderProps {
  children: ReactNode;
  /** Overrides "today" so tests never depend on the real date. */
  now?: Date;
}

/**
 * The reporting month shared by every page that reports on one (dashboard
 * now; budgets and analytics later). Held in memory, so a reload starts
 * at the current month again.
 */
export function ReportingMonthProvider({ children, now }: ReportingMonthProviderProps) {
  const [currentMonth] = useState(() => currentMonthKey(now));
  const [month, setMonth] = useState<MonthKey>(currentMonth);

  const value = useMemo(() => ({ month, currentMonth, setMonth }), [month, currentMonth]);
  return <ReportingMonthContext value={value}>{children}</ReportingMonthContext>;
}
