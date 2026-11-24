import { z } from 'zod';

/**
 * Bump this whenever the stored data shape changes, and add a migration
 * from the previous version in migrations.ts.
 */
export const CURRENT_SCHEMA_VERSION = 3;

/** What is written to storage: the data plus the shape version it uses. */
export const envelopeSchema = z.object({
  schemaVersion: z.number().int().positive(),
  data: z.unknown(),
});

export type Envelope = z.infer<typeof envelopeSchema>;
