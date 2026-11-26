import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { MonthTabValue } from './MonthTabs';
import { MonthTabs } from './MonthTabs';

function Harness({
  initial,
  onChange,
}: {
  initial: MonthTabValue | null;
  onChange?: (value: MonthTabValue) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <MonthTabs
      legend="Period"
      fallbackYear={2026}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

describe('MonthTabs', () => {
  it('offers All time and the twelve months of the selected month’s year', () => {
    render(<Harness initial="2026-11" />);

    expect(screen.getByRole('group', { name: 'Period' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'All time' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'November 2026' })).toBeChecked();
    expect(screen.getAllByRole('radio')).toHaveLength(13);
    expect(screen.getByText('Nov')).toBeInTheDocument();
  });

  it('selects a month or All time', async () => {
    const onChange = vi.fn();
    render(<Harness initial="2026-11" onChange={onChange} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('radio', { name: 'March 2026' }));
    expect(onChange).toHaveBeenLastCalledWith('2026-03');
    expect(screen.getByRole('radio', { name: 'March 2026' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'All time' }));
    expect(onChange).toHaveBeenLastCalledWith('all');
    expect(screen.getByRole('radio', { name: 'All time' })).toBeChecked();
  });

  it('switches years without changing the selection, crossing into January of the next year', async () => {
    const onChange = vi.fn();
    render(<Harness initial="2026-12" onChange={onChange} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Show 2027' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('radio', { name: 'December 2026' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'January 2027' }));
    expect(onChange).toHaveBeenLastCalledWith('2027-01');

    await user.click(screen.getByRole('button', { name: 'Show 2026' }));
    await user.click(screen.getByRole('button', { name: 'Show 2025' }));
    expect(screen.getByRole('radio', { name: 'December 2025' })).not.toBeChecked();
  });

  it('moves between months with the arrow keys', async () => {
    const onChange = vi.fn();
    render(<Harness initial="2026-11" onChange={onChange} />);
    const user = userEvent.setup();

    screen.getByRole('radio', { name: 'November 2026' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(onChange).toHaveBeenLastCalledWith('2026-12');
  });

  it('selects nothing when neither a month nor All time applies', () => {
    render(<Harness initial={null} />);

    expect(screen.getAllByRole('radio').filter((r) => (r as HTMLInputElement).checked)).toEqual([]);
    expect(screen.getByRole('radio', { name: 'January 2026' })).toBeInTheDocument();
  });
});
