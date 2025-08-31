# Terrarium

Minimal vertical slice for a mobile-friendly 2D ambient god-sandbox.

## Stack
- [PixiJS](https://github.com/pixijs/pixijs) for rendering.
- [Matter.js](https://github.com/liabru/matter-js) for physics.
- [Behavior3JS](https://github.com/behavior3/behavior3js) for agent logic.
- [pixijs/filters](https://github.com/pixijs/filters) for subtle bloom/adjustment.
- [Howler.js](https://github.com/goldfire/howler.js) for audio.

## Run
```bash
npm install
npm run dev
```
The Vite dev server hosts the project. Open in a mobile browser; audio starts after the first tap.

## Structure
```
src/
  rendering/  // PixiJS setup and filters
  physics/    // Matter.js world
  grid/       // cellular materials
  agents/     // Behavior3JS trees
  audio/      // Howler wiring
  ui/         // minimal brush toolbar
assets/
  sprites/ normal maps/ audio placeholders (.gitkeep only)
```

## Extending
- **Materials**: see `src/grid/index.js` for simple rules. Add entries in the `colors` map and update logic. Future TODO: move to JSON-driven registry.
- **Agents**: author trees with Behavior3 Editor and load JSON in `src/agents`.
- **Scene seeds**: integrate [`seedrandom`](https://github.com/davidbau/seedrandom) to allow deterministic worlds.
- **Pathfinding**: optional [`PathFinding.js`](https://github.com/qiao/PathFinding.js) for navigation.

## Credits
Implementation borrows patterns from:
- [PixiJS Examples: Graphics > Simple](https://pixijs.com/8.x/examples/simpleGraphics)
- [Matter.js demo: Rigid Bodies](https://brm.io/matter-js/demo/#rigidBodies)
- [Behavior3JS basic example](https://github.com/behavior3/behavior3js/tree/master/examples)

## TODO
- More material types and interactions.
- Proper sprites/normal maps and lighting via `@pixi/lights`.
- Agent interactions with grid and physics bodies.
- Mobile UX polish and performance tuning.
