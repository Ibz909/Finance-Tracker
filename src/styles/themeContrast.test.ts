// The stylesheet's text, so the real token values are what's tested.
import css from './index.css?raw';
import { describe, expect, it } from 'vitest';
import type { Rgb } from '../test/contrast';
import { contrastRatio, over, readTokens } from '../test/contrast';

/** WCAG 2.2 AA: 4.5:1 for normal text, 3:1 for UI component boundaries and states. */
const TEXT = 4.5;
const UI = 3;

type Pair = [
  label: string,
  foreground: (t: Tokens) => Rgb,
  background: (t: Tokens) => Rgb,
  min: number,
];
type Tokens = Record<string, Rgb>;

const token = (name: string) => (t: Tokens) => {
  const value = t[name];
  if (!value) throw new Error(`Missing token --${name}`);
  return value;
};
/** A Tailwind `bg-<name>/<percent>` tint over the card surface. */
const tint = (name: string, percent: number) => (t: Tokens) =>
  over(token(name)(t), percent / 100, token('surface')(t));

const PAIRS: Pair[] = [
  // Body and secondary text
  ['foreground on surface', token('foreground'), token('surface'), TEXT],
  ['foreground on background', token('foreground'), token('background'), TEXT],
  ['muted text on surface', token('muted-foreground'), token('surface'), TEXT],
  ['muted text on background', token('muted-foreground'), token('background'), TEXT],
  ['muted text on muted', token('muted-foreground'), token('muted'), TEXT],
  // Links, amounts and status text
  ['accent text on surface', token('accent'), token('surface'), TEXT],
  ['accent text on background', token('accent'), token('background'), TEXT],
  ['positive text on surface', token('positive'), token('surface'), TEXT],
  ['negative text on surface', token('negative'), token('surface'), TEXT],
  ['warning text on surface', token('warning'), token('surface'), TEXT],
  // Status badges: coloured text on a pale tint of the same colour
  ['On track / Goal reached badge', token('positive'), tint('positive', 10), TEXT],
  ['Over budget badge', token('negative'), tint('negative', 10), TEXT],
  ['Nearing limit / Target date passed badge', token('warning'), tint('warning', 15), TEXT],
  ['accent text on accent tint', token('accent'), tint('accent', 10), TEXT],
  // Buttons
  ['primary button text', token('accent-foreground'), token('accent'), TEXT],
  ['danger button text', token('negative-foreground'), token('negative'), TEXT],
  // Non-text: form field outlines, focus ring, progress bars
  ['form field border on surface', token('input-border'), token('surface'), UI],
  ['form field border on background', token('input-border'), token('background'), UI],
  ['focus ring on surface', token('accent'), token('surface'), UI],
  ['focus ring on background', token('accent'), token('background'), UI],
  ['progress fill (accent) on track', token('accent'), token('muted'), UI],
  ['progress fill (warning) on track', token('warning'), token('muted'), UI],
  ['progress fill (negative) on track', token('negative'), token('muted'), UI],
];

describe.each([
  ['light', readTokens(css, ':root')],
  ['dark', readTokens(css, '.dark')],
])('%s theme contrast', (_theme, tokens) => {
  it.each(PAIRS)('%s', (_label, foreground, background, min) => {
    expect(contrastRatio(foreground(tokens), background(tokens))).toBeGreaterThanOrEqual(min);
  });
});
