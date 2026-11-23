import type { LucideIcon } from 'lucide-react';
import { useId } from 'react';

type Tone = 'neutral' | 'positive' | 'negative';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Colours the value. Meaning is always also given in words (footnote). */
  tone?: Tone;
  iconTone?: Tone | 'accent';
  footnote: string;
}

const VALUE_TONE: Record<Tone, string> = {
  neutral: 'text-foreground',
  positive: 'text-positive',
  negative: 'text-negative',
};

const ICON_TONE: Record<Tone | 'accent', string> = {
  neutral: 'bg-muted text-muted-foreground',
  positive: 'bg-positive/10 text-positive',
  negative: 'bg-negative/10 text-negative',
  accent: 'bg-accent/10 text-accent',
};

/** A headline figure. Exposed as a region named by its label, e.g. "Income". */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'neutral',
  iconTone = 'accent',
  footnote,
}: StatCardProps) {
  const labelId = useId();
  return (
    <section
      aria-labelledby={labelId}
      className="min-w-0 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 id={labelId} className="text-sm font-medium text-muted-foreground">
          {label}
        </h3>
        <span
          aria-hidden="true"
          className={`hidden size-9 shrink-0 items-center justify-center rounded-full sm:flex ${ICON_TONE[iconTone]}`}
        >
          <Icon className="size-5" />
        </span>
      </div>
      <p
        className={`mt-2 text-xl font-semibold tracking-tight break-words tabular-nums sm:mt-3 sm:text-2xl ${VALUE_TONE[tone]}`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{footnote}</p>
    </section>
  );
}
