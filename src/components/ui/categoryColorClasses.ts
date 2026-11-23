import type { CategoryColor } from '../../models/category';

/**
 * Full class names per palette colour. Tailwind only generates classes it
 * can find written out in the source, so `bg-${color}/15` would not work.
 */
export const CATEGORY_COLOR_CLASSES: Record<CategoryColor, string> = {
  'chart-1': 'bg-chart-1/15 text-chart-1',
  'chart-2': 'bg-chart-2/15 text-chart-2',
  'chart-3': 'bg-chart-3/15 text-chart-3',
  'chart-4': 'bg-chart-4/15 text-chart-4',
  'chart-5': 'bg-chart-5/15 text-chart-5',
  'chart-6': 'bg-chart-6/15 text-chart-6',
  'chart-7': 'bg-chart-7/15 text-chart-7',
  'chart-8': 'bg-chart-8/15 text-chart-8',
  'chart-9': 'bg-chart-9/15 text-chart-9',
  'chart-10': 'bg-chart-10/15 text-chart-10',
  'chart-11': 'bg-chart-11/15 text-chart-11',
  'chart-12': 'bg-chart-12/15 text-chart-12',
};
