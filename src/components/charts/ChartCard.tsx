import type { ReactNode } from 'react';
import { Suspense, useId } from 'react';
import { ChartFrame } from './ChartFrame';

interface ChartCardProps {
  title: string;
  /** The chart's message in words; always visible, never chart-only. */
  summary: string;
  /** Shown instead of the chart when there isn't enough data to be meaningful. */
  emptyMessage?: string | undefined;
  /** Heading level, so cards fit the page outline. */
  headingLevel?: 2 | 3;
  chart: ReactNode;
  /** Usually a <DataTable />. */
  table?: ReactNode;
  /** Controls beside the title, e.g. a range picker. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Frame for every chart (min-w-0 lets it shrink inside CSS grids, which
 * charts otherwise push wider than the screen): title, text summary, the chart (lazy-loaded, with
 * a placeholder while it downloads), and an optional data table.
 */
export function ChartCard({
  title,
  summary,
  emptyMessage,
  headingLevel = 2,
  chart,
  table,
  actions,
  className = '',
}: ChartCardProps) {
  const titleId = useId();
  const Heading = headingLevel === 2 ? 'h2' : 'h3';

  return (
    <section
      aria-labelledby={titleId}
      className={`min-w-0 rounded-xl border border-border bg-surface p-4 sm:p-5 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Heading id={titleId} className="text-lg font-semibold">
          {title}
        </Heading>
        {actions}
      </div>
      {emptyMessage ? (
        <p className="mt-5 mb-1 rounded-lg bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
          <ChartFrame>
            <Suspense fallback={<ChartSkeleton />}>{chart}</Suspense>
          </ChartFrame>
          {table}
        </>
      )}
    </section>
  );
}

function ChartSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-64 w-full animate-pulse rounded-lg bg-muted motion-reduce:animate-none"
    />
  );
}
