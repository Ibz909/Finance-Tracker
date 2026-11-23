import { describe, expect, it } from 'vitest';
import { CATEGORY_COLOR_COUNT } from '../models/category';
import {
  DEFAULT_CATEGORIES,
  getCategoriesByType,
  getCategory,
  isCategoryForType,
} from './categories';

describe('default categories', () => {
  it('have unique, snake_case IDs', () => {
    const ids = DEFAULT_CATEGORIES.map((category) => category.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z]+(?:_[a-z]+)*$/);
  });

  it('include the 12 expense and 6 income categories from the brief', () => {
    expect(getCategoriesByType('expense')).toHaveLength(12);
    expect(getCategoriesByType('income')).toHaveLength(6);
  });

  it('use colours from the defined palette', () => {
    for (const { color } of DEFAULT_CATEGORIES) {
      const index = Number(color.replace('chart-', ''));
      expect(index).toBeGreaterThanOrEqual(1);
      expect(index).toBeLessThanOrEqual(CATEGORY_COLOR_COUNT);
    }
  });

  it('give every category in a type a distinct colour', () => {
    for (const type of ['income', 'expense'] as const) {
      const colours = getCategoriesByType(type).map((category) => category.color);
      expect(new Set(colours).size).toBe(colours.length);
    }
  });
});

describe('category lookups', () => {
  it('find categories by ID', () => {
    expect(getCategory('salary')?.label).toBe('Salary');
    expect(getCategory('not_a_category')).toBeUndefined();
  });

  it('check that a category matches a transaction type', () => {
    expect(isCategoryForType('salary', 'income')).toBe(true);
    expect(isCategoryForType('salary', 'expense')).toBe(false);
    expect(isCategoryForType('missing', 'expense')).toBe(false);
  });
});
