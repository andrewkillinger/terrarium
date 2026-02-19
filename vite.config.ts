import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// When deploying to GitHub Pages, set VITE_BASE_PATH to the repo name, e.g. /terrarium/
// For local dev, leave unset (defaults to /)
const base = process.env.VITE_BASE_PATH ?? '/'

export default defineConfig({
  plugins: [react()],
  base,
  test: {
    environment: 'node',
    globals: true,
  },
})
