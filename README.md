# Terrarium

Minimal mobile-friendly 2D ambient sandbox. A small cellular automata (CA) grid renders on a background canvas while [Excalibur.js](https://excaliburjs.com/) draws actors above it and [Tone.js](https://tonejs.github.io/) provides ambience.

Assets are loaded directly from **https://killinger.synology.me/** via absolute HTTPS URLs defined in [`config/assets.manifest.json`](config/assets.manifest.json).

## Run
Open `index.html` in a browser or serve the folder statically.

## Deploy to GitHub Pages
Push to `main` and enable GitHub Pages for the repo. Ensure `.nojekyll` is present. Pages will serve `index.html` at the root.

## Extend Assets
Add new image or audio URLs to `config/assets.manifest.json`. Entries should use absolute HTTPS links pointing at the asset host. Images will be available in `game.js` and audio via `audio.js` helpers.
