import { defineConfig } from 'vite'

// When deploying to GitHub Pages, set VITE_BASE_PATH to the repo name, e.g. /terrarium/
// For local dev, leave unset (defaults to /)
const base = process.env.VITE_BASE_PATH ?? '/'

export default defineConfig({
  base,
  test: {
    environment: 'node',
    globals: true,
  },
})
