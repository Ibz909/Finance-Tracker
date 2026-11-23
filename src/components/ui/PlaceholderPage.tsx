import type { LucideIcon } from 'lucide-react';

interface PlaceholderPageProps {
  icon: LucideIcon;
  heading: string;
  description: string;
}

/**
 * Shown on routes whose feature has not been built yet. It says so plainly
 * rather than rendering controls that look functional but do nothing.
 */
export function PlaceholderPage({ icon: Icon, heading, description }: PlaceholderPageProps) {
  return (
    <section
      aria-labelledby="placeholder-heading"
      className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <p className="mt-4 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        Coming soon
      </p>
      <h2 id="placeholder-heading" className="mt-3 text-lg font-semibold">
        {heading}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </section>
  );
}
