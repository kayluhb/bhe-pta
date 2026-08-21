import {defineConfig} from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      exclude: [
        '**/node_modules/**',
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        'app/lib/types.ts',
      ],
      include: ['app/data/**/*.ts', 'app/hooks/**/*.{ts,tsx}', 'app/lib/**/*.ts'],
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      // Thresholds apply to `include` only (library + hooks + data). ~100% lines;
      // branches/functions stay slightly lower due to Gemini/JWT/D1 edge paths.
      thresholds: {
        branches: 86,
        functions: 93,
        lines: 99,
        statements: 99,
      },
    },
    environment: 'node',
    include: ['app/**/__tests__/**/*.test.ts', 'app/**/__tests__/**/*.test.tsx'],
    setupFiles: ['./app/vitest-setup.ts'],
  },
});
