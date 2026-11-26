import type { ReactNode } from 'react';
import { useId } from 'react';

export type FigureTone = 'neutral' | 'positive' | 'warning' | 'negative';

const TONE: Record<FigureTone, string> = {
  neutral: 'text-foreground',
  positive: 'text-positive',
  warning: 'text-warning',
  negative: 'text-negative',
};

interface HeroFigureProps {
  /** The question this figure answers, e.g. "Net cash flow this month". */
  label: string;
  value: string;
  tone?: FigureTone;
  /** A plain sentence that reads the figure for the user. */
  children?: ReactNode;
  /** Sits to the right on wider screens, e.g. a budget gauge. */
  aside?: ReactNode;
}

/**
 * The one answer a page leads with. Each page has exactly one, so the eye
 * knows where to land; supporting figures stay visibly smaller.
 */
export function HeroFigure({ label, value, tone = 'neutral', children, aside }: HeroFigureProps) {
  const labelId = useId();
  return (
    // The figure shares its row with the aside (e.g. a gauge) when it fits; on
    // narrow phones the aside wraps below instead of overlapping, and the
    // sentence always gets the full width.
    <section
      aria-labelledby={labelId}
      className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-6 sm:gap-y-0"
    >
      <div className="sm:min-w-0">
        <h2 id={labelId} className="text-sm font-medium text-muted-foreground">
          {label}
        </h2>
        <p
          className={`mt-1.5 text-[2rem] leading-[1.1] font-semibold tracking-[-0.02em] whitespace-nowrap sm:text-[2.5rem] ${TONE[tone]}`}
        >
          {value}
        </p>
      </div>
      {aside && <div className="sm:row-span-2">{aside}</div>}
      {children && (
        <div className="-mt-1 basis-full text-sm text-muted-foreground sm:col-start-1 sm:mt-2">
          {children}
        </div>
      )}
    </section>
  );
}
