import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Only the stylesheet's raw text is needed, by the theme contrast test.
    css: { include: [/src\/styles\/index\.css/] },
    restoreMocks: true,
    // A timezone behind UTC, so any accidental UTC date conversion shifts
    // a date by a day and fails a test instead of passing on a UK machine.
    env: { TZ: 'America/Los_Angeles' },
  },
});
