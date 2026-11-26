import { SearchX } from 'lucide-react';
import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <section
      aria-labelledby="not-found-heading"
      className="mx-auto flex max-w-lg flex-col items-center px-6 py-12 text-center"
    >
      <SearchX aria-hidden="true" className="size-10 text-muted-foreground" />
      <h2 id="not-found-heading" className="mt-4 text-lg font-semibold">
        We couldn’t find that page
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The address may be mistyped, or the page may have moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex h-11 items-center rounded-lg bg-accent-fill px-4 text-sm font-medium text-accent-fill-foreground hover:bg-accent-fill/90 sm:h-10"
      >
        Back to dashboard
      </Link>
    </section>
  );
}
