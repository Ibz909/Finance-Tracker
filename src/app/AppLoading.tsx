import { Logo } from '../components/layout/Logo';

/**
 * Shown for a moment on the very first load while the opening page's code
 * downloads. Announced politely so screen readers know something is coming.
 */
export function AppLoading() {
  return (
    <div role="status" className="flex min-h-dvh flex-col items-center justify-center gap-3">
      <Logo />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}
