import { Outlet } from 'react-router';

export function AppShell() {
  return (
    <main id="main-content" className="p-6">
      <Outlet />
    </main>
  );
}
