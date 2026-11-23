import { afterEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { createEmptyAppData } from '../../models/appData';
import { makeTransaction } from '../../test/fixtures';
import { CURRENT_SCHEMA_VERSION } from './envelope';
import { createLocalStorageRepository } from './localStorageRepository';

const KEY = STORAGE_KEYS.data;
const NOW = new Date('2026-11-23T10:00:00.000Z');
const BACKUP_KEY = `${STORAGE_KEYS.dataBackupPrefix}${NOW.toISOString()}`;

function repository() {
  return createLocalStorageRepository({ now: () => NOW });
}

function storedEnvelope() {
  const raw = localStorage.getItem(KEY);
  return raw === null ? null : (JSON.parse(raw) as unknown);
}

/** Makes setItem throw for keys matching `shouldFail`, like a full disk. */
function failWrites(shouldFail: (key: string) => boolean) {
  // Kept unbound on purpose: it is re-called with the right `this` below.
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const original = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
    this: Storage,
    key: string,
    value: string,
  ) {
    if (shouldFail(key)) throw new DOMException('Storage full', 'QuotaExceededError');
    original.call(this, key, value);
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('localStorageRepository', () => {
  it('reports empty on first visit', () => {
    expect(repository().load()).toEqual({ status: 'empty', data: createEmptyAppData() });
  });

  it('persists data across a "refresh" (a fresh repository instance)', () => {
    const data = { ...createEmptyAppData(), transactions: [makeTransaction()] };

    expect(repository().save(data)).toEqual({ ok: true });

    expect(repository().load()).toEqual({ status: 'ok', data });
    expect(storedEnvelope()).toEqual({ schemaVersion: CURRENT_SCHEMA_VERSION, data });
  });

  it('backs up unreadable JSON, then starts empty', () => {
    localStorage.setItem(KEY, '{not json');

    const result = repository().load();

    expect(result).toMatchObject({
      status: 'recovered',
      data: createEmptyAppData(),
      backupKey: BACKUP_KEY,
    });
    expect(localStorage.getItem(BACKUP_KEY)).toBe('{not json');
    expect(storedEnvelope()).toEqual({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      data: createEmptyAppData(),
    });
  });

  it('salvages valid records, backs up the original and rewrites the cleaned data', () => {
    const good = makeTransaction();
    const raw = JSON.stringify({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      data: {
        transactions: [good, { broken: true }],
        budgets: [],
        settings: { currency: 'GBP' },
      },
    });
    localStorage.setItem(KEY, raw);

    const result = repository().load();

    expect(result).toMatchObject({ status: 'recovered', skippedRecords: 1, backupKey: BACKUP_KEY });
    expect(result.data.transactions).toEqual([good]);
    expect(localStorage.getItem(BACKUP_KEY)).toBe(raw);
    // The next load is clean, so the warning does not repeat on every visit.
    expect(repository().load()).toMatchObject({ status: 'ok' });
  });

  it('never overwrites damaged data if the backup cannot be written', () => {
    localStorage.setItem(KEY, '{not json');
    failWrites((key) => key.startsWith(STORAGE_KEYS.dataBackupPrefix));

    const result = repository().load();

    expect(result).toMatchObject({ status: 'recovered', backupKey: null });
    expect(localStorage.getItem(KEY)).toBe('{not json');
  });

  it('does not destroy data saved by a newer version of the app', () => {
    const raw = JSON.stringify({ schemaVersion: 99, data: { future: true } });
    localStorage.setItem(KEY, raw);

    const result = repository().load();

    expect(result).toMatchObject({ status: 'recovered', backupKey: BACKUP_KEY });
    if (result.status === 'recovered') expect(result.problem).toMatch(/newer version/);
    expect(localStorage.getItem(BACKUP_KEY)).toBe(raw);
  });

  it('reports unavailable storage without throwing', () => {
    const blocked = createLocalStorageRepository({
      getStorage: () => {
        throw new DOMException('Blocked', 'SecurityError');
      },
    });

    expect(blocked.load()).toEqual({ status: 'unavailable', data: createEmptyAppData() });
    expect(blocked.save(createEmptyAppData())).toMatchObject({ ok: false });
  });

  it('explains when storage is full', () => {
    const repo = repository();
    failWrites((key) => key === KEY);

    const result = repo.save(createEmptyAppData());

    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.error).toMatch(/full/);
  });

  it('upgrades and keeps data saved before budgets existed (version 1)', () => {
    const transaction = makeTransaction();
    localStorage.setItem(
      KEY,
      JSON.stringify({
        schemaVersion: 1,
        data: { transactions: [transaction], settings: { currency: 'GBP' } },
      }),
    );

    expect(repository().load()).toEqual({
      status: 'ok',
      data: { ...createEmptyAppData(), transactions: [transaction] },
    });
  });
});
