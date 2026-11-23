import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { Logo } from './Logo';
import { NavList } from './NavList';

export const MOBILE_NAV_ID = 'mobile-navigation';

/** Matches Tailwind's `lg` breakpoint, where the permanent sidebar takes over. */
const DESKTOP_QUERY = '(min-width: 64rem)';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Slide-in navigation drawer for small screens.
 *
 * Built on the native <dialog> element opened with showModal(), which gives
 * us for free: a backdrop, focus moved into the drawer, the rest of the page
 * made inert, Escape to close, and focus returned to the menu button.
 */
export function MobileNav({ open, onClose }: MobileNavProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Keep the DOM dialog in step with React state.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // If the window grows to desktop width, the sidebar is visible, so close.
  useEffect(() => {
    if (!open) return;
    const query = window.matchMedia(DESKTOP_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) onClose();
    };
    query.addEventListener('change', handleChange);
    return () => {
      query.removeEventListener('change', handleChange);
    };
  }, [open, onClose]);

  return (
    <dialog
      ref={dialogRef}
      id={MOBILE_NAV_ID}
      aria-label="Navigation menu"
      // Fires for Escape and for dialog.close(), so state never drifts.
      onClose={onClose}
      // A click whose target is the <dialog> itself landed on the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[85vw] border-r border-border bg-surface p-0 text-foreground shadow-xl transition-transform duration-200 ease-out backdrop:bg-black/40 starting:open:-translate-x-full lg:hidden"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between pr-2 pl-5">
          <Logo />
          <Button variant="ghost" size="icon" aria-label="Close navigation menu" onClick={onClose}>
            <X aria-hidden="true" className="size-5" />
          </Button>
        </div>
        <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-4">
          <NavList onNavigate={onClose} />
        </nav>
        <p className="px-5 py-4 text-xs text-muted-foreground">Your data stays in this browser.</p>
      </div>
    </dialog>
  );
}
