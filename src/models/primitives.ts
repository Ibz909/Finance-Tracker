import { z } from 'zod';
import { MAX_AMOUNT_PENCE } from '../constants/money';
import { isValidIsoDate } from '../utils/dates';

export const idSchema = z.string().min(1).max(100);

/** Calendar date "YYYY-MM-DD" that exists (rejects 30 February). */
export const isoDateSchema = z.string().refine(isValidIsoDate, { message: 'Enter a valid date' });

/** Instant in time, e.g. createdAt. */
export const isoDateTimeSchema = z.iso.datetime();

/** A positive, whole number of pence within the supported maximum. */
export const penceSchema = z
  .number()
  .int('Amount must be a whole number of pence')
  .positive('Amount must be greater than zero')
  .max(MAX_AMOUNT_PENCE, 'Amount is above the supported maximum');

export const TRANSACTION_TYPES = ['income', 'expense'] as const;
export const transactionTypeSchema = z.enum(TRANSACTION_TYPES);
export type TransactionType = z.infer<typeof transactionTypeSchema>;
