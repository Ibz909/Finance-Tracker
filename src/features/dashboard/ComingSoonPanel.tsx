import type { LucideIcon } from 'lucide-react';
import { useId } from 'react';

interface ComingSoonPanelProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Reserves a dashboard slot for a feature that is not built yet. Says so
 * plainly and shows no numbers, so nothing can be mistaken for real data.
 */
export function ComingSoonPanel({ title, description, icon: Icon }: ComingSoonPanelProps) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className="flex min-w-0 items-start gap-4 self-start rounded-2xl border border-dashed border-border bg-surface p-5"
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        <Icon className="size-5" />
      </span>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 id={titleId} className="text-sm font-semibold">
            {title}
          </h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Coming soon
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </section>
  );
}
