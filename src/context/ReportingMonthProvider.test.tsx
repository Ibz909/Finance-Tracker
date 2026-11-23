import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { useReportingMonth } from '../hooks/useReportingMonth';
import { ReportingMonthProvider } from './ReportingMonthProvider';

describe('ReportingMonthProvider', () => {
  it('starts at the local current month and can change it', () => {
    // 11pm on 31 Jan in Los Angeles is already February in UTC.
    const now = new Date(2026, 0, 31, 23, 0);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ReportingMonthProvider now={now}>{children}</ReportingMonthProvider>
    );
    const { result } = renderHook(() => useReportingMonth(), { wrapper });

    expect(result.current).toMatchObject({ month: '2026-01', currentMonth: '2026-01' });

    act(() => {
      result.current.setMonth('2025-12');
    });
    expect(result.current).toMatchObject({ month: '2025-12', currentMonth: '2026-01' });
  });
});
