import { describe, expect, it } from 'vitest';
import { getPageTitle, NAV_ITEMS } from './navigation';

describe('getPageTitle', () => {
  it.each(NAV_ITEMS.map((item) => [item.path, item.label]))('maps %s to %s', (path, label) => {
    expect(getPageTitle(path)).toBe(label);
  });

  it('ignores a trailing slash', () => {
    expect(getPageTitle('/budgets/')).toBe('Budgets');
  });

  it('falls back for unknown paths', () => {
    expect(getPageTitle('/does-not-exist')).toBe('Page not found');
  });
});
