import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'clarinet',
    globals: true,
    include: ['tests/**/*.test.ts'],
    testTimeout: 30000,
  },
});
