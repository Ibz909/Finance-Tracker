import type { ReactNode } from 'react';
import type { FigureTone } from './HeroFigure';

const TONE: Record<FigureTone, string> = {
  neutral: 'text-foreground',
  positive: 'text-positive',
  warning: 'text-warning',
  negative: 'text-negative',
};

/**
 * A row of supporting figures as a description list, so each value is read
 * with its label. `framed` gives each figure a hairline box (Overview);
 * unframed figures sit bare inside a panel (Budgets).
 */
export function MetricList({
  label,
  framed = false,
  children,
}: {
  label: string;
  framed?: boolean;
  children: ReactNode;
}) {
  return (
    <dl
      aria-label={label}
      className={`grid grid-cols-2 min-[400px]:grid-cols-3 ${framed ? 'gap-2 sm:gap-3' : 'gap-x-4 gap-y-4 sm:gap-x-6'}`}
      data-framed={framed || undefined}
    >
      {children}
    </dl>
  );
}

interface MetricProps {
  label: string;
  value: string;
  tone?: FigureTone;
  /** A short qualifier under the value, e.g. a caveat or why it's missing. */
  note?: string;
  framed?: boolean;
}

export function Metric({ label, value, tone = 'neutral', note, framed = false }: MetricProps) {
  return (
    <div
      className={`flex min-w-0 flex-col ${framed ? 'rounded-lg border border-border px-3 py-3 sm:px-4' : ''}`}
    >
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={`mt-1 text-base font-semibold whitespace-nowrap sm:text-xl ${TONE[tone]}`}>
        {value}
      </dd>
      {note && <dd className="mt-0.5 text-xs text-muted-foreground">{note}</dd>}
    </div>
  );
}
