import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useId, useRef } from 'react';
import { Button } from './Button';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}

/**
 * Accessible modal built on the native <dialog> element.
 *
 * showModal() traps focus, makes the page behind inert, closes on Escape
 * and restores focus to the opener when closed. Content only mounts while
 * open, so forms inside start fresh every time. If the opener has been
 * removed, focus falls back to #main-content. Put `data-autofocus` on the
 * element that should receive focus first; otherwise the browser picks the
 * first focusable element.
 */
export function Dialog({ open, onClose, title, description, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={() => {
        // The browser returns focus to whatever opened the dialog. If that
        // element is gone (e.g. the row was just deleted), focus would be
        // lost, so fall back to the main content area.
        if (document.activeElement === document.body) {
          document.getElementById('main-content')?.focus();
        }
        onClose();
      }}
      onClick={(event) => {
        // A click whose target is the <dialog> itself landed on the backdrop.
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-border bg-surface p-0 text-foreground shadow-xl transition-[opacity,scale] duration-150 ease-out backdrop:bg-black/40 starting:open:scale-95 starting:open:opacity-0"
    >
      {open && (
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                {title}
              </h2>
              {description && (
                <div id={descriptionId} className="mt-1 text-sm text-muted-foreground">
                  {description}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="-mt-2 -mr-2 shrink-0"
              aria-label="Close dialog"
              onClick={onClose}
            >
              <X aria-hidden="true" className="size-5" />
            </Button>
          </div>
          <div className="mt-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
