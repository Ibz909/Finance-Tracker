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
    // UK time, matching the app's users: GMT in winter, BST (UTC+1) in
    // summer. Tests that guard against UTC date bugs use summer dates,
    // when local time and UTC differ (see src/utils/dates.test.ts).
    env: { TZ: 'Europe/London' },
  },
});
