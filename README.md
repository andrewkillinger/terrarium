# Terrarium

Terrarium is the foundational codebase for a browser-based 16-bit pixel art simulation built with Phaser 3, TypeScript, and Vite. This scaffold focuses on the rendering engine, tooling, and deployment pipeline so future gameplay systems can be implemented quickly.

## Features

- ⚙️ **Phaser 3 engine** configured for pixel-perfect rendering (320×240 internal resolution, nearest-neighbor scaling).
- 🧱 **Modular scene architecture** with boot, preload, and play phases plus a toggleable debug overlay.
- 🗂️ **Core services** for assets, storage, event messaging, and timekeeping.
- 🧪 **Quality tooling** including ESLint, Prettier, TypeScript strict mode, and Vitest unit tests.
- 🚀 **Vite build + GitHub Pages deployment** with CI workflows for linting, tests, type checking, and builds.

## Getting Started

```bash
npm install
npm run dev
```

Visit the URL printed in the terminal. You should see the Phaser canvas with a pixel-perfect placeholder sprite and the debug overlay instructions.

### Available Scripts

- `npm run dev` – Start the Vite development server.
- `npm run build` – Build the production-ready static site to `dist/`.
- `npm run preview` – Preview the built site locally.
- `npm run lint` – Run ESLint against TypeScript sources.
- `npm run lint:fix` – Auto-fix lint issues where possible.
- `npm run format` – Check code formatting with Prettier.
- `npm run format:write` – Format code with Prettier.
- `npm run typecheck` – Run the TypeScript compiler in no-emit mode.
- `npm run test` – Execute Vitest in run mode.
- `npm run test:watch` – Run Vitest in watch mode.

## Environment Variables

Environment variables are managed via Vite. Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

- `ASSET_BASE_URL` – Base URL for loading external assets.
- `BASE_URL` – Deploy path for GitHub Pages (e.g., `/Terrarium/`).

## Project Structure

```
terrarium/
├── .github/workflows/       # Continuous integration and deployment
├── public/                  # Static assets served at the root
├── src/
│   ├── core/                # Shared configuration, services, and types
│   ├── game/                # Phaser scenes and game config
│   ├── styles/              # Global styles
│   ├── test/                # Vitest suites
│   └── ui/                  # UI overlays and utilities
├── .env.example             # Sample environment configuration
├── package.json             # Scripts and dependencies
├── tsconfig.json            # TypeScript compiler settings
├── vite.config.ts           # Vite configuration with env injection
└── README.md                # Project overview (this file)
```

## Debug Overlay

Press the **D** key while the game is running to toggle the debug overlay. It displays frame timing information sourced from the core `Time` service and provides placeholders for future diagnostics.

## Continuous Integration & Deployment

- **CI** (`.github/workflows/ci.yml`) installs dependencies, lints, type checks, tests, and builds the project.
- **GitHub Pages** (`.github/workflows/pages.yml`) builds the site and publishes the `dist/` directory to the `gh-pages` branch using GitHub Pages.

## License

This project is provided under the MIT License.
