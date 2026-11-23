import type { LucideIcon } from 'lucide-react';
import type { TransactionType } from './primitives';

/** The category palette, matching `--chart-1` … `--chart-12` in index.css. */
export const CATEGORY_COLORS = [
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'chart-6',
  'chart-7',
  'chart-8',
  'chart-9',
  'chart-10',
  'chart-11',
  'chart-12',
] as const;
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

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
