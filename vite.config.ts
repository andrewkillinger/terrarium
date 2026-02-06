import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const rootDir = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(rootDir, 'src');
const publicDir = resolve(rootDir, 'public');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    root: srcDir,
    publicDir,
    base: env.BASE_URL || '/',
    define: {
      'import.meta.env.ASSET_BASE_URL': JSON.stringify(env.ASSET_BASE_URL || ''),
    },
    resolve: {
      alias: {
        '@': srcDir,
      },
    },
    server: {
      open: true,
    },
    build: {
      outDir: resolve(rootDir, 'dist'),
      emptyOutDir: true,
      sourcemap: true,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['../test/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        reportsDirectory: resolve(rootDir, 'coverage'),
        lines: 70,
        functions: 70,
        statements: 70,
        branches: 60,
        enabled: true,
        all: false,
        include: ['core/services/**/*.ts', 'core/ecs/**/*.ts', 'core/sim/**/*.ts'],
        exclude: ['**/*.d.ts'],
      },
    },
  };
});
