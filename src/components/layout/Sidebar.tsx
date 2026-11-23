import { Logo } from './Logo';
import { NavList } from './NavList';

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>
      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-4">
        <NavList />
      </nav>
      <p className="px-5 py-4 text-xs text-muted-foreground">Your data stays in this browser.</p>
    </aside>
  );
}
