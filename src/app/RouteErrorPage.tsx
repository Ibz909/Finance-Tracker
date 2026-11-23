import { useRouteError } from 'react-router';

/**
 * Last-resort screen if a page throws while rendering. Keeps the user out of
 * a blank white page and offers a way back.
 */
export function RouteErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div role="alert" className="max-w-md rounded-2xl border border-border bg-surface p-8">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error stopped this page from loading. Your saved data has not been changed.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex h-11 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent/90 sm:h-10"
        >
          Reload the app
        </a>
      </div>
    </main>
  );
}
