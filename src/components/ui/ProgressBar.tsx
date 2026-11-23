type Tone = 'accent' | 'warning' | 'negative';

interface ProgressBarProps {
  /** Percent used; may exceed 100 (the bar is capped, the text is not). */
  percent: number;
  label: string;
  tone: Tone;
}

const FILL: Record<Tone, string> = {
  accent: 'bg-accent',
  warning: 'bg-warning',
  negative: 'bg-negative',
};

/**
 * Accessible progress bar. Screen readers hear the real figure through
 * aria-valuetext ("112% used"), even when the bar itself is full.
 */
export function ProgressBar({ percent, label, tone }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(percent, 100));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-valuetext={`${String(percent)}% used`}
      className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${FILL[tone]}`}
        style={{ width: `${String(clamped)}%` }}
      />
    </div>
  );
}
