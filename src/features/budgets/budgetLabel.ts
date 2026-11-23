import { getCategory } from '../../constants/categories';
import type { Budget } from '../../models/budget';

/** "Monthly" for the overall budget, otherwise the category name. */
export function budgetLabel(budget: Pick<Budget, 'scope' | 'categoryId'>): string {
  return budget.scope === 'overall'
    ? 'Monthly'
    : (getCategory(budget.categoryId ?? '')?.label ?? 'Unknown category');
}
