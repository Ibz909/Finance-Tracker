type Tone = 'accent' | 'warning' | 'negative';

const STROKE: Record<Tone, string> = {
  accent: 'stroke-accent',
  warning: 'stroke-warning',
  negative: 'stroke-negative',
};

interface ProgressRingProps {
  /** Percent used; may exceed 100 (the ring is capped, the figure is not). */
  percent: number;
  tone: Tone;
  /** Everything the ring shows, in words, e.g. "97% of your monthly budget used, nearing limit". */
  label: string;
}

const SIZE = 120;
const STROKE_WIDTH = 10;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * A single-stroke gauge: the share used, coloured by status, with the
 * percentage in the middle. Screen readers get the label as one image name.
 */
export function ProgressRing({ percent, tone, label }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(percent, 100));
  return (
    <div role="img" aria-label={label} className="relative size-28 sm:size-40">
      <svg viewBox={`0 0 ${String(SIZE)} ${String(SIZE)}`} className="size-full -rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          className="stroke-muted"
        />
        {/* At 0% a round cap would still draw a dot, so draw nothing. */}
        {clamped > 0 && (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - clamped / 100)}
            className={`${STROKE[tone]} transition-[stroke-dashoffset] duration-300 ease-out`}
          />
        )}
      </svg>
      <div
        aria-hidden="true"
        className="absolute inset-0 flex flex-col items-center justify-center leading-none"
      >
        <span className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">{percent}%</span>
        <span className="mt-1 text-xs text-muted-foreground">used</span>
      </div>
    </div>
  );
}
