import { MoreHorizontal } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';

export interface RowMenuItem {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
}

interface RowMenuProps {
  /** Names the trigger, e.g. "Actions for Groceries budget". */
  label: string;
  items: readonly RowMenuItem[];
}

/**
 * A row's secondary actions behind one ⋯ button, following the WAI-ARIA menu
 * button pattern: arrow keys move, Home/End jump, Escape or Tab closes, and
 * focus returns to the button so a following dialog can return it there too.
 */
export function RowMenu({ label, items }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) itemRefs.current[active]?.focus();
  }, [open, active]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
    };
  }, [open]);

  const openAt = (index: number) => {
    setActive(index);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onTriggerKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openAt(0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openAt(items.length - 1);
    }
  };

  const onMenuKeyDown = (event: KeyboardEvent) => {
    const last = items.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: active === last ? 0 : active + 1,
      ArrowUp: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    };
    const next = moves[event.key];
    if (next !== undefined) {
      event.preventDefault();
      setActive(next);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          if (open) setOpen(false);
          else openAt(0);
        }}
        onKeyDown={onTriggerKeyDown}
        className="flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground sm:size-9"
      >
        <MoreHorizontal aria-hidden="true" className="size-5" />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className="absolute top-full right-0 z-20 mt-1 min-w-36 rounded-xl border border-border bg-surface p-1 shadow-xl"
        >
          {items.map((item, index) => (
            <button
              key={item.label}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              type="button"
              role="menuitem"
              tabIndex={index === active ? 0 : -1}
              onClick={() => {
                close();
                item.onSelect();
              }}
              className={`flex h-10 w-full items-center rounded-md px-3 text-left text-sm whitespace-nowrap transition-colors duration-150 hover:bg-muted focus-visible:bg-muted ${
                item.destructive ? 'text-negative' : 'text-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
