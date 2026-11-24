import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

/**
 * Holds a drawn chart, which is a picture of the text summary and data
 * table beside it. It is hidden from assistive technology, and nothing
 * inside it may take keyboard focus.
 *
 * Why the tabindex workaround: Recharts draws layers into <g> elements
 * through React portals, and React attaches event listeners to every portal
 * container. Chrome treats an SVG element with focus listeners as a Tab
 * stop, so each layer became an invisible, unannounced stop for keyboard
 * users. An explicit tabindex="-1" takes them out of the Tab order while
 * mouse tooltips keep working (making the frame `inert` would block those).
 */
export function ChartFrame({ children }: { children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const removeTabStops = () => {
      for (const group of element.querySelectorAll('svg g:not([tabindex])')) {
        group.setAttribute('tabindex', '-1');
      }
    };
    removeTabStops();
    // Recharts adds layers as it draws and redraws, so keep checking.
    const observer = new MutationObserver(removeTabStops);
    observer.observe(element, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={frame} className="mt-4" aria-hidden="true">
      {children}
    </div>
  );
}
