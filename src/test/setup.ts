import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Reset everything a test can change globally, so tests cannot leak into each other.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.className = '';
  document.documentElement.style.colorScheme = '';
});

/*
 * jsdom gaps
 * ----------
 * jsdom does not implement <dialog>'s showModal()/close() or
 * window.matchMedia. These minimal stand-ins mimic the browser behaviour our
 * components rely on (toggling `open`, firing `close`). They only apply in
 * tests and are skipped if a future jsdom adds the real APIs.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-deprecated --
   the DOM types claim these APIs always exist (they do not in jsdom), and
   MediaQueryList's type still requires its deprecated listener methods. */
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
  // Browsers close the top-most modal dialog on Escape; mimic that.
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const openDialogs = document.querySelectorAll<HTMLDialogElement>('dialog[open]');
    openDialogs[openDialogs.length - 1]?.close();
  });
}

if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  });
}
/* eslint-enable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-deprecated */
