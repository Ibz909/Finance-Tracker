import { Repeat, X } from 'lucide-react';
import { Link } from 'react-router';
import { useRecurringCatchUp } from '../../hooks/useAppData';
import { Button } from '../ui/Button';

/**
 * Tells the user when opening the app added recurring payments, so
 * transactions never appear without explanation. A persistent, dismissible
 * message rather than a toast, which might vanish before it is read.
 */
export function RecurringCatchUpNotice() {
  const { added, dismiss } = useRecurringCatchUp();
  if (added === 0) return null;

  return (
    <div
      role="status"
      aria-labelledby="recurring-catch-up-title"
      className="mb-6 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm"
    >
      <Repeat aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" />
      <p id="recurring-catch-up-title" className="flex-1">
        <span className="font-medium">
          {added === 1
            ? '1 recurring transaction was added'
            : `${String(added)} recurring transactions were added`}
        </span>{' '}
        <span className="text-muted-foreground">
          because payments fell due since your last visit.
        </span>{' '}
        <Link to="/transactions" className="font-medium text-accent hover:underline">
          View transactions
        </Link>
      </p>
      <Button
        variant="ghost"
        size="icon"
        className="-my-2 -mr-2"
        aria-label="Dismiss message"
        onClick={dismiss}
      >
        <X aria-hidden="true" className="size-5" />
      </Button>
    </div>
  );
}
