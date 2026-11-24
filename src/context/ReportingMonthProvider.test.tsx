import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { useReportingMonth } from '../hooks/useReportingMonth';
import { ReportingMonthProvider } from './ReportingMonthProvider';

describe('ReportingMonthProvider', () => {
  it('starts at the local current month and can change it', () => {
    // 00:30 on 1 August in BST is still 31 July in UTC.
    const now = new Date(2026, 7, 1, 0, 30);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ReportingMonthProvider now={now}>{children}</ReportingMonthProvider>
    );
    const { result } = renderHook(() => useReportingMonth(), { wrapper });

    expect(result.current).toMatchObject({ month: '2026-08', currentMonth: '2026-08' });

    act(() => {
      result.current.setMonth('2026-07');
    });
    expect(result.current).toMatchObject({ month: '2026-07', currentMonth: '2026-08' });
  });
});
