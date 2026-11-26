import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigation } from 'react-router';
import { APP_TITLE, getPageTitle } from '../../constants/navigation';
import { DemoDataBanner } from './DemoDataBanner';
import { MobileNav } from './MobileNav';
import { RecurringCatchUpNotice } from './RecurringCatchUpNotice';
import { Sidebar } from './Sidebar';
import { StorageNotice } from './StorageNotice';
import { TopBar } from './TopBar';

export function AppShell() {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // True while the next page's code is downloading; the current page stays put.
  const isLoadingPage = useNavigation().state === 'loading';
  // Stable identity so MobileNav's effects don't re-subscribe every render.
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  useEffect(() => {
    // The page name first keeps tabs and screen-reader titles distinct per page.
    document.title = `${title} · ${APP_TITLE}`;
  }, [title]);

  return (
    <div className="min-h-dvh lg:pl-64">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-md"
      >
        Skip to main content
      </a>
      <Sidebar />
      <div className="flex min-h-dvh flex-col">
        <TopBar
          title={title}
          isMenuOpen={isMenuOpen}
          onOpenMenu={() => {
            setIsMenuOpen(true);
          }}
        />
        <main
          id="main-content"
          tabIndex={-1}
          aria-busy={isLoadingPage}
          className="relative flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8"
        >
          {isLoadingPage && (
            // Visual only: aria-busy tells assistive technology the page is changing.
            <div
              aria-hidden="true"
              data-testid="page-loading-bar"
              className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-accent"
            />
          )}
          <div className="mx-auto max-w-7xl">
            <StorageNotice />
            <DemoDataBanner />
            <RecurringCatchUpNotice />
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav open={isMenuOpen} onClose={closeMenu} />
    </div>
  );
}
