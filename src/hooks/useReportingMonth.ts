import { use } from 'react';
import { ReportingMonthContext } from '../context/reportingMonthContext';

export function useReportingMonth() {
  const context = use(ReportingMonthContext);
  if (!context) throw new Error('useReportingMonth must be used inside <ReportingMonthProvider>');
  return context;
}
