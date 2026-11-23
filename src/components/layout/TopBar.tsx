import { Menu } from 'lucide-react';
import { Button } from '../ui/Button';
import { MOBILE_NAV_ID } from './MobileNav';
import { ThemeToggle } from './ThemeToggle';

interface TopBarProps {
  title: string;
  isMenuOpen: boolean;
  onOpenMenu: () => void;
}

export function TopBar({ title, isMenuOpen, onOpenMenu }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b border-border bg-surface/90 px-2 backdrop-blur sm:px-6 lg:px-8">
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
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  );
}
