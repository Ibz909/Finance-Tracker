import { CircleHelp } from 'lucide-react';
import { getCategory } from '../../constants/categories';

interface CategoryIconProps {
  categoryId: string;
  /** "tile" for list rows; "inline" for a small icon inside a table cell. */
  size?: 'tile' | 'inline';
}

/**
 * Decorative icon for a category, on a neutral tile: colour is kept for the
 * charts, where it carries meaning. The label is always shown as text nearby.
 */
export function CategoryIcon({ categoryId, size = 'tile' }: CategoryIconProps) {
  const Icon = getCategory(categoryId)?.icon ?? CircleHelp;

  if (size === 'inline') {
    return <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />;
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground"
    >
      <Icon className="size-[18px]" />
    </span>
  );
}
