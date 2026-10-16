import { defineConfig } from 'vitest/config';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Modes: default (multi-file build for hosting) and `single` (everything inlined in one HTML, for previews).
export default defineConfig(({ mode }) => ({
  root: r('./apps/web'),
  base: './',
  resolve: {
    alias: {
      '@economy': r('./packages/economy/src/index.ts'),
      '@sim': r('./packages/sim/src/index.ts'),
      '@save': r('./packages/save/src/index.ts'),
      '@data': r('./packages/data'),
    },
  },
  server: { fs: { allow: [r('.')] }, host: true },
  build: {
    outDir: r('./dist'),
    emptyOutDir: true,
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
  },
  plugins: mode === 'single' ? [viteSingleFile()] : [],
  test: {
    root: r('.'),
    include: ['packages/**/*.test.ts'],
    environment: 'node',
  },
}));
