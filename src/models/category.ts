import type { LucideIcon } from 'lucide-react';
import type { TransactionType } from './primitives';

/** Number of colours in the category palette (`--chart-1` … `--chart-12`). */
export const CATEGORY_COLOR_COUNT = 12;
export type CategoryColor = `chart-${number}`;

/**
 * A spending or income category. `id` is permanent and stored on every
 * transaction; `label` is display-only, so it can be renamed freely.
 * Custom categories can later be added with the same shape.
 */
export interface Category {
  id: string;
  label: string;
  type: TransactionType;
  icon: LucideIcon;
  color: CategoryColor;
}
