import { Menu, Plus } from 'lucide-react';
import { useMatches } from 'react-router';
import { routeUsesReportingMonth } from '../../app/routeHandle';
import { useTransactionDialog } from '../../hooks/useTransactionDialog';
import { Button } from '../ui/Button';
import { DemoDataToggle } from './DemoDataToggle';
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
    <header className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center gap-x-1 border-b border-border bg-background px-2 py-2.5 sm:px-6 lg:px-8 xl:flex-nowrap">
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
      {/* basis-0 keeps the controls on this row; a long title wraps rather than pushing them down. */}
      <h1 className="min-w-0 grow basis-0 text-xl leading-tight font-semibold tracking-tight min-[400px]:text-2xl xl:grow-0 xl:basis-auto">
        {title}
      </h1>
      {showMonthPicker && (
        // Until there's room beside the title (xl), the picker takes its own row.
        <div className="order-last flex w-full justify-center pt-1 sm:justify-start xl:order-none xl:ml-4 xl:w-auto xl:pt-0">
          <MonthPicker />
        </div>
      )}
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <DemoDataToggle />
        {/* Below 400px the title needs the room; Settings → Appearance still changes the theme. */}
        <div className="hidden min-[400px]:block">
          <ThemeToggle />
        </div>
        <Button onClick={openAddTransaction} className="ml-1 px-3 sm:px-4">
          <Plus aria-hidden="true" className="size-5" />
          {/* Visually hidden on phones, but always the button's accessible name. */}
          <span className="sr-only md:not-sr-only">Add transaction</span>
        </Button>
      </div>
    </header>
  );
}
