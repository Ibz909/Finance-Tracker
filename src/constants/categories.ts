import {
  Banknote,
  Briefcase,
  Bus,
  CircleEllipsis,
  Clapperboard,
  Dumbbell,
  Gift,
  GraduationCap,
  House,
  Laptop,
  Lightbulb,
  Plane,
  Repeat,
  RotateCcw,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import type { Category } from '../models/category';
import type { TransactionType } from '../models/primitives';

/**
 * Default categories. IDs are stable storage keys: never change or reuse
 * one, or existing transactions would point at the wrong category.
 */
export const DEFAULT_CATEGORIES = [
  // Expenses
  {
    id: 'food_groceries',
    label: 'Food & Groceries',
    type: 'expense',
    icon: ShoppingCart,
    color: 'chart-1',
  },
  {
    id: 'restaurants_takeaways',
    label: 'Restaurants & Takeaways',
    type: 'expense',
    icon: UtensilsCrossed,
    color: 'chart-2',
  },
  { id: 'transport', label: 'Transport', type: 'expense', icon: Bus, color: 'chart-3' },
  { id: 'shopping', label: 'Shopping', type: 'expense', icon: ShoppingBag, color: 'chart-4' },
  {
    id: 'bills_utilities',
    label: 'Bills & Utilities',
    type: 'expense',
    icon: Lightbulb,
    color: 'chart-5',
  },
  { id: 'rent_housing', label: 'Rent & Housing', type: 'expense', icon: House, color: 'chart-6' },
  {
    id: 'entertainment',
    label: 'Entertainment',
    type: 'expense',
    icon: Clapperboard,
    color: 'chart-7',
  },
  { id: 'subscriptions', label: 'Subscriptions', type: 'expense', icon: Repeat, color: 'chart-8' },
  {
    id: 'health_fitness',
    label: 'Health & Fitness',
    type: 'expense',
    icon: Dumbbell,
    color: 'chart-9',
  },
  { id: 'travel', label: 'Travel', type: 'expense', icon: Plane, color: 'chart-10' },
  { id: 'education', label: 'Education', type: 'expense', icon: GraduationCap, color: 'chart-11' },
  { id: 'other_expense', label: 'Other', type: 'expense', icon: CircleEllipsis, color: 'chart-12' },
  // Income
  { id: 'salary', label: 'Salary', type: 'income', icon: Briefcase, color: 'chart-1' },
  { id: 'freelance', label: 'Freelance', type: 'income', icon: Laptop, color: 'chart-3' },
  { id: 'side_income', label: 'Side Income', type: 'income', icon: Sparkles, color: 'chart-5' },
  { id: 'gifts', label: 'Gifts', type: 'income', icon: Gift, color: 'chart-7' },
  { id: 'refunds', label: 'Refunds', type: 'income', icon: RotateCcw, color: 'chart-9' },
  { id: 'other_income', label: 'Other Income', type: 'income', icon: Banknote, color: 'chart-12' },
] as const satisfies readonly Category[];

export type DefaultCategoryId = (typeof DEFAULT_CATEGORIES)[number]['id'];

const CATEGORY_BY_ID = new Map<string, Category>(DEFAULT_CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: string): Category | undefined {
  return CATEGORY_BY_ID.get(id);
}

export function getCategoriesByType(type: TransactionType): Category[] {
  return DEFAULT_CATEGORIES.filter((category) => category.type === type);
}

/** True if the category exists and belongs to the given transaction type. */
export function isCategoryForType(id: string, type: TransactionType): boolean {
  return getCategory(id)?.type === type;
}
