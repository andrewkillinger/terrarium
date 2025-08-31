# Terrarium Sandbox

Web-based, mobile-friendly 2D "ambient god-sandbox". Paint materials and watch emergent behavior unfold.

## Run

This project is a static site; no build step is required. Serve the repo root or open `index.html` directly. The site is designed for GitHub Pages.

## Assets

All art and audio assets are hosted externally at [https://killinger.synology.me/](https://killinger.synology.me/) and referenced via `config/assets.manifest.json`. No binaries are committed to this repository.

## Acceptance Criteria

- Loads on mobile at 30–60 FPS and always renders a test sprite on boot.
- Painting materials is satisfying: sand piles, water flows, fire spreads; villager plants seeds.
- Audio starts after the first user gesture; ambient layers can be toggled; weather fades in/out.
- Diagnostics panel lists asset load status, FPS, body count, grid size, and page visibility state.

## Libraries

- [PixiJS](https://pixijs.com/)
- [PixiJS Filters](https://github.com/pixijs/filters)
- [Matter.js](https://brm.io/matter-js/)
- [Behavior3JS](https://github.com/behavior3/behavior3js)
- [Howler.js](https://howlerjs.com/)

## License

See [LICENSE](LICENSE).
