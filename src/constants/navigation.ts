import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  ChartPie,
  LayoutDashboard,
  PiggyBank,
  Repeat,
  Settings,
  Target,
} from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Single source of truth for primary navigation. The sidebar, mobile menu
 * and top-bar title all read from this list, so adding a page is one edit.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/recurring', label: 'Recurring', icon: Repeat },
  { path: '/budgets', label: 'Budgets', icon: Target },
  { path: '/analytics', label: 'Analytics', icon: ChartPie },
  { path: '/savings', label: 'Savings Goals', icon: PiggyBank },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const APP_NAME = 'Finance Tracker';

export function getPageTitle(pathname: string): string {
  const normalised = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return NAV_ITEMS.find((item) => item.path === normalised)?.label ?? 'Page not found';
}
