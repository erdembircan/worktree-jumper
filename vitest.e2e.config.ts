import { defineConfig, mergeConfig } from 'vitest/config';
import shared from './vitest.shared.js';

export default mergeConfig(
  shared,
  defineConfig({
    test: {
      include: ['test-e2e/**/*.test.ts'],
      globalSetup: ['test-e2e/globalSetup.ts'],
      testTimeout: 30_000,
      hookTimeout: 30_000,
    },
  }),
);
