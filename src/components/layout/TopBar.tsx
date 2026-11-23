import { Menu, Plus } from 'lucide-react';
import { useMatches } from 'react-router';
import { routeUsesReportingMonth } from '../../app/routeHandle';
import { useTransactionDialog } from '../../hooks/useTransactionDialog';
import { Button } from '../ui/Button';
import { MOBILE_NAV_ID } from './MobileNav';
import { MonthPicker } from './MonthPicker';
import { ThemeToggle } from './ThemeToggle';

interface TopBarProps {
  title: string;
  isMenuOpen: boolean;
  onOpenMenu: () => void;
}

export function TopBar({ title, isMenuOpen, onOpenMenu }: TopBarProps) {
  const { openAddTransaction } = useTransactionDialog();
  const showMonthPicker = routeUsesReportingMonth(useMatches());

  return (
    <header className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center gap-x-2 border-b border-border bg-surface/90 px-2 py-2.5 backdrop-blur sm:flex-nowrap sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation menu"
        aria-haspopup="dialog"
        aria-expanded={isMenuOpen}
        aria-controls={MOBILE_NAV_ID}
        onClick={onOpenMenu}
      >
        <Menu aria-hidden="true" className="size-5" />
      </Button>
      <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
      {showMonthPicker && (
        // On phones the picker drops to its own row below the title.
        <div className="order-last flex w-full justify-center pt-1 sm:order-none sm:ml-4 sm:w-auto sm:pt-0">
          <MonthPicker />
        </div>
      )}
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <Button onClick={openAddTransaction} className="ml-1 px-3 sm:px-4">
          <Plus aria-hidden="true" className="size-5" />
          {/* Visually hidden on phones, but always the button's accessible name. */}
          <span className="sr-only sm:not-sr-only">Add transaction</span>
        </Button>
      </div>
    </header>
  );
}
