# Terrarium Sandbox

A fun visual 2D sandbox game in the browser. Paint elements, watch them interact,
grow plants, spawn creatures, and blow it all up. Every cell is simulated and
every wall is destructible.

Built with Vite + TypeScript, no framework, runs on a pure HTML5 canvas.

## Features

- ~22 interactive elements, each with its own behavior:
  - **Solids** — sand, dirt, stone, wood, brick, metal, glass, ice
  - **Liquids** — water, oil, lava, acid
  - **Gases** — steam, smoke, fire
  - **Plants** — seeds that sprout into grass and growing vines
  - **Explosives** — TNT, gunpowder, dynamite
- Six creature types with simple AI: ant, fish, bird, worm, frog, beetle
- Fully destructible environment — chain reactions, acid corrosion, melting, freezing, burning
- Cellular-automaton simulation at 60 Hz on a ~100k-cell grid
- Direct `ImageData` pixel renderer upscaled crisply to any window size

## Controls

| Input | Action |
|---|---|
| Left-click / drag | Paint selected element |
| Right-click / drag | Erase (paint empty) |
| `Space` | Pause / resume |
| `C` | Clear everything |
| `R` | Reset to default scene |
| `[` / `]` | Decrease / increase brush size |
| `+` / `-` | Sim speed up / down |
| `1`–`9` | Quick-select from the palette |

Click a **creature** button in the palette to switch the cursor to "spawn creature"
mode — each click drops one of that creature into the world.

## Development

```bash
npm install
npm run dev      # local dev server
npm test         # run Vitest test suite
npm run build    # TypeScript check + production build
npm run preview  # preview the production build locally
```

## Deployment

Pushes to `main` / `master` are built and published to GitHub Pages by
`.github/workflows/deploy.yml`. Set the repository variable `VITE_BASE_PATH`
to `/<repo-name>/` so asset URLs resolve under the Pages subdirectory.
