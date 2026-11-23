/**
 * Every localStorage key the app uses, in one place.
 *
 * The theme key is duplicated in the inline script in index.html (which
 * runs before any bundled code); keep the two in sync.
 */
export const STORAGE_KEYS = {
  theme: 'finance-tracker:theme',
} as const;
