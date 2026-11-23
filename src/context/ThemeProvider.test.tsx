import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { useTheme } from '../hooks/useTheme';
import { mockMatchMedia } from '../test/mockMatchMedia';
import { renderRoute } from '../test/renderRoute';

const html = document.documentElement;

describe('Theme toggle', () => {
  it('switches between light and dark and remembers the choice', async () => {
    mockMatchMedia(false);
    const { user } = renderRoute('/');
    expect(html).not.toHaveClass('dark');

    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }));

    expect(html).toHaveClass('dark');
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }));

    expect(html).not.toHaveClass('dark');
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('light');
  });
});

describe('ThemeProvider', () => {
  it('restores the saved preference on start-up', () => {
    mockMatchMedia(false);
    localStorage.setItem(STORAGE_KEYS.theme, 'dark');

    renderRoute('/settings');

    expect(html).toHaveClass('dark');
    expect(screen.getByRole('radio', { name: /dark/i })).toBeChecked();
  });

  it('follows the operating system live when set to system', () => {
    const media = mockMatchMedia(false);
    renderRoute('/');
    expect(html).not.toHaveClass('dark');

    act(() => {
      media.setMatches(true);
    });
    expect(html).toHaveClass('dark');

    act(() => {
      media.setMatches(false);
    });
    expect(html).not.toHaveClass('dark');
  });

  it('ignores OS changes when an explicit theme is chosen', () => {
    const media = mockMatchMedia(false);
    localStorage.setItem(STORAGE_KEYS.theme, 'light');
    renderRoute('/');

    act(() => {
      media.setMatches(true);
    });

    expect(html).not.toHaveClass('dark');
  });

  it('throws a helpful error when useTheme is used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function Orphan() {
      useTheme();
      return null;
    }

    expect(() => render(<Orphan />)).toThrow('useTheme must be used inside <ThemeProvider>');
  });
});

describe('Appearance settings', () => {
  it('saves the chosen option, including system', async () => {
    mockMatchMedia(true);
    const { user } = renderRoute('/settings');

    await user.click(screen.getByRole('radio', { name: /light/i }));
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('light');
    expect(html).not.toHaveClass('dark');

    await user.click(screen.getByRole('radio', { name: /system/i }));
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('system');
    expect(html).toHaveClass('dark');
  });

  it('tells the user when the preference cannot be saved', async () => {
    mockMatchMedia(false);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const { user } = renderRoute('/settings');

    await user.click(screen.getByRole('radio', { name: /dark/i }));

    expect(html).toHaveClass('dark');
    expect(screen.getByRole('status')).toHaveTextContent(/blocked saving this preference/i);
  });
});
