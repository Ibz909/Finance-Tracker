import { describe, expect, it } from 'vitest';
import { MAX_AMOUNT_PENCE } from '../constants/money';
import { formatPence, parsePoundsToPence, penceToInputValue, sumPence } from './money';

describe('parsePoundsToPence', () => {
  it.each([
    ['12', 1200],
    ['12.5', 1250],
    ['12.50', 1250],
    ['0.01', 1],
    ['.5', 50],
    ['£125.99', 12599],
    ['£ 7', 700],
    ['  3.20  ', 320],
    ['1,234.56', 123456],
    ['1,000,000', 100000000],
    ['007.10', 710],
    ['1.00', 100],
    ['10000000', MAX_AMOUNT_PENCE],
    ['10,000,000.00', MAX_AMOUNT_PENCE],
  ])('parses %j as %i pence', (input, expected) => {
    expect(parsePoundsToPence(input)).toEqual({ ok: true, pence: expected });
  });

  it('avoids floating-point rounding errors', () => {
    // parseFloat('1.15') * 100 === 114.99999999999999
    expect(parsePoundsToPence('1.15')).toEqual({ ok: true, pence: 115 });
    expect(parsePoundsToPence('4.35')).toEqual({ ok: true, pence: 435 });
  });

  it.each([
    ['', 'Enter an amount'],
    ['   ', 'Enter an amount'],
    ['£', 'Enter an amount'],
    ['0', 'greater than zero'],
    ['0.00', 'greater than zero'],
    ['-5', 'greater than zero'],
    ['1.234', 'two decimal places'],
    ['12,34', 'commas'],
    ['1,2345', 'commas'],
    ['abc', 'pounds and pence'],
    ['1e3', 'pounds and pence'],
    ['1.2.3', 'pounds and pence'],
    ['.', 'pounds and pence'],
    ['$5', 'pounds and pence'],
    ['10000000.01', 'more than £10,000,000.00'],
    ['999999999999999999999', 'more than £10,000,000.00'],
  ])('rejects %j', (input, message) => {
    const result = parsePoundsToPence(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(message);
  });
});

describe('formatPence', () => {
  it.each([
    [0, '£0.00'],
    [1, '£0.01'],
    [1050, '£10.50'],
    [123456, '£1,234.56'],
    [-2599, '-£25.99'],
  ])('formats %i as %s', (pence, expected) => {
    expect(formatPence(pence)).toBe(expected);
  });
});

describe('penceToInputValue', () => {
  it.each([
    [1250, '12.50'],
    [5, '0.05'],
    [100000, '1000.00'],
  ])('converts %i to %s', (pence, expected) => {
    expect(penceToInputValue(pence)).toBe(expected);
  });

  it('round-trips through the parser', () => {
    for (const pence of [1, 99, 100, 12345, MAX_AMOUNT_PENCE]) {
      expect(parsePoundsToPence(penceToInputValue(pence))).toEqual({ ok: true, pence });
    }
  });
});

describe('sumPence', () => {
  it('adds integer pence exactly', () => {
    // As floats, 0.1 + 0.2 !== 0.3; as pence, 10 + 20 === 30.
    expect(sumPence([10, 20])).toBe(30);
    expect(sumPence([])).toBe(0);
    expect(sumPence(new Set([1250, 99, 1]))).toBe(1350);
  });
});
