import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  define: {
    __VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    include: ['test-e2e/**/*.test.ts'],
    globalSetup: ['test-e2e/globalSetup.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
