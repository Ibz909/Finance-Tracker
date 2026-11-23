import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { APP_NAME, getPageTitle } from '../../constants/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);

  useEffect(() => {
    document.title = `${title} · ${APP_NAME}`;
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
        <TopBar title={title} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
