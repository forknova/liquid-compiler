import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    alias: {
      '@test': './test',
      '@': './src',
    },
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.test.ts'],
  },
});
