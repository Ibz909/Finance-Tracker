import { APP_NAME, APP_TAGLINE } from '../../constants/navigation';

/**
 * The PencePlot mark: a plotted line coming into focus on its last point.
 * Drawn in the current text colour so it follows the theme; the same shape
 * is the favicon (public/favicon.svg).
 */
export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path
        d="M7 22l6-6 4.5 3L24 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="11" r="3.2" fill="currentColor" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent-fill text-accent-fill-foreground">
        <LogoMark className="size-7" />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        {/* Set in lowercase as a wordmark; screen readers get the proper name. */}
        <span aria-hidden="true" className="text-base font-semibold tracking-[-0.01em]">
          penceplot
        </span>
        <span className="sr-only">{APP_NAME}</span>
        <span className="text-xs text-muted-foreground">{APP_TAGLINE}</span>
      </span>
    </span>
  );
}
