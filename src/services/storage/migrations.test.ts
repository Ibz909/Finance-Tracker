import { describe, expect, it } from 'vitest';
import { MIGRATIONS, migrate } from './migrations';

const steps = {
  1: (data: unknown) => ({ ...(data as object), budgets: [] }),
  2: (data: unknown) => ({ ...(data as object), goals: [] }),
};

describe('migrate', () => {
  it('returns data unchanged when already current', () => {
    expect(migrate({ a: 1 }, 3, 3, steps)).toEqual({ ok: true, data: { a: 1 } });
  });

  it('applies each step in order', () => {
    expect(migrate({ a: 1 }, 1, 3, steps)).toEqual({
      ok: true,
      data: { a: 1, budgets: [], goals: [] },
    });
  });

  it('can start part-way through the chain', () => {
    expect(migrate({ a: 1 }, 2, 3, steps)).toEqual({ ok: true, data: { a: 1, goals: [] } });
  });

  it('refuses data from a newer app version', () => {
    const result = migrate({}, 4, 3, steps);
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.problem).toMatch(/newer version/);
  });

  it('reports a missing step instead of guessing', () => {
    const result = migrate({}, 1, 3, { 2: steps[2] });
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.problem).toMatch(/version 1/);
  });
});

describe('MIGRATIONS', () => {
  it('1 → 2 adds an empty budgets list and keeps everything else', () => {
    const v1 = { transactions: [{ id: 'a' }], settings: { currency: 'GBP' }, extra: true };
    expect(migrate(v1, 1, 2)).toEqual({ ok: true, data: { ...v1, budgets: [] } });
  });

  it('1 → 2 leaves unrecognisable data alone for validation to reject', () => {
    expect(MIGRATIONS[1]?.(['not', 'an', 'object'])).toEqual(['not', 'an', 'object']);
  });
});
