import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoAccessibilityViolations } from '../../test/axe';
import type { IsoDate, MonthKey } from '../../utils/dates';
import type { CalendarDayInfo } from './MonthCalendar';
import { MonthCalendar } from './MonthCalendar';

const days = new Map<IsoDate, CalendarDayInfo>([
  [
    '2026-11-28',
    {
      markers: ['positive'],
      figure: '+£2,650.00',
      figureTone: 'positive',
      description: '1 payment, £2,650.00 in',
    },
  ],
  [
    '2026-11-30',
    {
      markers: ['neutral', 'neutral', 'neutral', 'neutral', 'positive'],
      description: '5 payments',
    },
  ],
]);

function Harness({ initialMonth = '2026-11', initialSelected = '2026-11-15' }) {
  const [month, setMonth] = useState<MonthKey>(initialMonth);
  const [selected, setSelected] = useState<IsoDate>(initialSelected);
  return (
    <>
      <MonthCalendar
        label="Recurring payments"
        month={month}
        today="2026-11-15"
        selected={selected}
        days={days}
        onSelect={setSelected}
        onMonthChange={setMonth}
      />
      <output>{selected}</output>
    </>
  );
}

const day = (name: RegExp) => screen.getByRole('button', { name });

describe('MonthCalendar', () => {
  it('lays out a Monday-first month with today marked and one day in the tab order', () => {
    render(<Harness />);

    expect(screen.getByRole('grid', { name: 'Recurring payments, November 2026' })).toBeVisible();
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'MMonMonday',
      'TTueTuesday',
      'WWedWednesday',
      'TThuThursday',
      'FFriFriday',
      'SSatSaturday',
      'SSunSunday',
    ]);
    // 1 November 2026 is a Sunday: six empty cells come first.
    const firstRow = screen.getAllByRole('row')[1];
    expect(firstRow?.querySelectorAll('td[aria-hidden="true"]')).toHaveLength(6);

    const today = day(/^Today, Sunday 15 November 2026/);
    expect(today).toHaveAttribute('aria-current', 'date');
    expect(today).toHaveAttribute('aria-pressed', 'true');
    expect(today).toHaveAttribute('tabindex', '0');
    expect(screen.getAllByRole('button').filter((b) => b.getAttribute('tabindex') === '0')).toEqual(
      [today],
    );
  });

  it('describes each day and caps markers at three with a count', () => {
    render(<Harness />);

    expect(day(/^Saturday 28 November 2026, 1 payment, £2,650.00 in$/)).toHaveTextContent(
      '+£2,650.00',
    );
    expect(day(/^Monday 30 November 2026/)).toHaveTextContent('+2');
    expect(day(/^Monday 16 November 2026, No payments$/)).toBeInTheDocument();
  });

  it('selects a day by click', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(day(/^Saturday 28 November/));

    expect(screen.getByRole('status')).toHaveTextContent('2026-11-28');
    expect(day(/^Saturday 28 November/)).toHaveAttribute('aria-pressed', 'true');
  });

  it('moves by day and week with the arrow keys and turns the page at the edges', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    // Past the two month buttons, Tab lands on the selected day.
    await user.tab();
    await user.tab();
    await user.tab();
    expect(day(/^Today, Sunday 15/)).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(day(/^Monday 16 November/)).toHaveFocus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(day(/^Monday 30 November/)).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('grid', { name: /December 2026$/ })).toBeVisible();
    expect(day(/^Sunday 6 December/)).toHaveFocus();
    await user.keyboard('{Home}{ArrowUp}');
    expect(screen.getByRole('grid', { name: /November 2026$/ })).toBeVisible();
    expect(day(/^Monday 23 November/)).toHaveFocus();
  });

  it('changes month with Page Up and Page Down, keeping the day where it can', async () => {
    const user = userEvent.setup();
    render(<Harness initialMonth="2027-01" initialSelected="2027-01-31" />);

    await user.click(day(/^Sunday 31 January 2027/));
    await user.keyboard('{PageDown}');
    expect(day(/^Sunday 28 February 2027/)).toHaveFocus();
    await user.keyboard('{PageUp}');
    expect(day(/^Thursday 28 January 2027/)).toHaveFocus();
  });

  it('steps months with the arrow buttons', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Next month, December 2026' }));
    expect(screen.getByRole('heading', { name: 'December 2026' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Previous month, November 2026' }));
    expect(screen.getByRole('heading', { name: 'November 2026' })).toBeVisible();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Harness />);
    await expectNoAccessibilityViolations(container);
  });
});
