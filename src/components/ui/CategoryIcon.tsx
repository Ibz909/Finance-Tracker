import { CircleHelp } from 'lucide-react';
import { getCategory } from '../../constants/categories';
import { CATEGORY_COLOR_CLASSES } from './categoryColorClasses';

/** Decorative coloured icon for a category; the label is always shown as text nearby. */
export function CategoryIcon({ categoryId }: { categoryId: string }) {
  const category = getCategory(categoryId);
  const Icon = category?.icon ?? CircleHelp;
  const colour = CATEGORY_COLOR_CLASSES[category?.color ?? 'chart-12'];

  return (
    <span
      aria-hidden="true"
      className={`flex size-10 shrink-0 items-center justify-center rounded-full ${colour}`}
    >
      <Icon className="size-5" />
    </span>
  );
}
