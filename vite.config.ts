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
  };
});
