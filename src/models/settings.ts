import { z } from 'zod';

/**
 * User settings stored with the app data. GBP is the only supported
 * currency; the field exists so the storage format will not need to change
 * if more are ever supported. (Theme lives in its own key; see theme.ts.)
 */
export const settingsSchema = z.object({
  currency: z.literal('GBP'),
});
export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = { currency: 'GBP' };
