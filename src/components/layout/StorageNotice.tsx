import { TriangleAlert, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useStorageStatus } from '../../hooks/useAppData';
import { Button } from '../ui/Button';

/**
 * Explains storage problems in plain language so the app never fails
 * silently: damaged data that was recovered, storage being unavailable,
 * or a change that could not be saved.
 */
export function StorageNotice() {
  const { load, saveError, dismissLoadProblem } = useStorageStatus();

  return (
    <>
      {saveError && (
        <Banner role="alert" title="Your latest change wasn’t saved">
          {saveError} It is still shown here, but may be lost when you close this tab.
        </Banner>
      )}
      {load.status === 'unavailable' && (
        <Banner role="status" title="Changes won’t be kept">
          Your browser is blocking local storage, so anything you add will be lost when you close
          this tab. Check your privacy settings or try a different browser.
        </Banner>
      )}
      {load.status === 'recovered' && (
        <Banner
          role="status"
          title="Some saved data couldn’t be loaded"
          onDismiss={dismissLoadProblem}
        >
          {load.problem}{' '}
          {load.backupKey
            ? 'A copy of the original was kept in your browser storage, and everything that could be read has been loaded.'
            : 'The original has been left untouched.'}
        </Banner>
      )}
    </>
  );
}

interface BannerProps {
  role: 'alert' | 'status';
  title: string;
  children: ReactNode;
  onDismiss?: () => void;
}

function Banner({ role, title, children, onDismiss }: BannerProps) {
  return (
    <div
      role={role}
      className="mb-6 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4"
    >
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
      <div className="flex-1 text-sm">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-muted-foreground">{children}</p>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="-my-2 -mr-2"
          aria-label="Dismiss message"
          onClick={onDismiss}
        >
          <X aria-hidden="true" className="size-5" />
        </Button>
      )}
    </div>
  );
}
