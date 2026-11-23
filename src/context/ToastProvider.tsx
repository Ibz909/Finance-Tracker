import { CircleCheck, Info, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ToastTone } from './toastContext';
import { ToastContext } from './toastContext';

export const TOAST_DURATION_MS = 4000;

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

/**
 * Short confirmation messages ("Transaction added"). The container is an
 * aria-live region that is always in the DOM, so screen readers announce
 * each new message without moving focus.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, tone }]);
      timers.current.set(
        id,
        setTimeout(() => {
          dismiss(id);
        }, TOAST_DURATION_MS),
      );
    },
    [dismiss],
  );

  // Clear any pending timers if the provider unmounts.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) clearTimeout(timer);
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((toast) => {
          const Icon = toast.tone === 'success' ? CircleCheck : Info;
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm shadow-lg transition-[opacity,translate] duration-200 starting:translate-y-2 starting:opacity-0"
            >
              <Icon
                aria-hidden="true"
                className={`size-5 shrink-0 ${toast.tone === 'success' ? 'text-positive' : 'text-accent'}`}
              />
              <p className="flex-1">{toast.message}</p>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => {
                  dismiss(toast.id);
                }}
                className="-my-1 -mr-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext>
  );
}
