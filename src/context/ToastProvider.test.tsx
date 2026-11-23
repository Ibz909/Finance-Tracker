import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useToast } from '../hooks/useToast';
import { TOAST_DURATION_MS, ToastProvider } from './ToastProvider';

function Trigger() {
  const { showToast } = useToast();
  return (
    <button
      type="button"
      onClick={() => {
        showToast('Saved');
      }}
    >
      Save
    </button>
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe('ToastProvider', () => {
  it('announces a message and removes it after the timeout', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    const region = screen.getByRole('status', { name: 'Notifications' });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(region).toHaveTextContent('Saved');

    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION_MS);
    });
    expect(region).toBeEmptyDOMElement();
  });

  it('can be dismissed early', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));

    expect(screen.getByRole('status', { name: 'Notifications' })).toBeEmptyDOMElement();
  });
});
