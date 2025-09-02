// Simple cellular automata for a falling sand style demo.
// This is **not** a full recreation of sandspiel's complex
// simulation, but it provides a lightweight approximation that
// lets the page look and behave similarly to the original site.

let ctx;
let width = 0;
let height = 0;
let ticks = 0;

// cell types
const EMPTY = 0;
const SAND = 1;
const WATER = 2;

// colour lookup for each cell type
const colours = {
  [EMPTY]: [0, 0, 0, 0],
  [SAND]: [194, 178, 128, 255],
  [WATER]: [64, 164, 223, 255],
};

let cells;
let velocities;
const GRAVITY = 0.5;
const MAX_VEL = 5;

export function initCA(canvas, w, h) {
  if (!canvas) return;
  width = w;
  height = h;
  canvas.width = w;
  canvas.height = h;
  ctx = canvas.getContext('2d');
  cells = new Uint8Array(w * h);
  velocities = new Float32Array(w * h);
  drawCA();
}

function swap(i1, i2) {
  const tmp = cells[i1];
  cells[i1] = cells[i2];
  cells[i2] = tmp;
}

export function stepCA(dt = 16) {
  if (!cells) return;
  ticks++;
  const acc = GRAVITY * dt / 16;
  for (let y = height - 2; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const cell = cells[i];
      if (cell === SAND || cell === WATER) {
        const below = i + width;
        if (cell === SAND && cells[below] === WATER) {
          swap(i, below);
          const splash = i + (Math.random() < 0.5 ? -1 : 1);
          if (splash >= 0 && splash < cells.length && cells[splash] === EMPTY) {
            cells[splash] = WATER;
          }
          velocities[below] = velocities[i];
          velocities[i] = 0;
          continue;
        }

        let v = velocities[i] + acc;
        if (v > MAX_VEL) v = MAX_VEL;
        velocities[i] = v;
        let ny = y;
        for (let step = 0; step < Math.floor(v); step++) {
          const belowStep = (ny + 1) * width + x;
          if (ny + 1 >= height || cells[belowStep] !== EMPTY) break;
          ny++;
        }
        const dest = ny * width + x;
        if (dest !== i) {
          swap(i, dest);
          velocities[dest] = v;
          velocities[i] = 0;
          continue;
        }
        velocities[i] = 0;
        if (cell === SAND) {
          const dir = Math.random() < 0.5 ? -1 : 1;
          const nx = x + dir;
          const ni = below + dir;
          if (nx >= 0 && nx < width && cells[ni] === EMPTY) {
            swap(i, ni);
            velocities[ni] = velocities[i];
            velocities[i] = 0;
          }
        } else if (cell === WATER) {
          // Water should conserve mass and flow naturally. The previous
          // implementation spawned extra "splash" particles above bodies of
          // water, which caused it to rapidly fill the entire simulation. By
          // removing that behaviour and only allowing movement into empty
          // neighbouring cells, water now falls under gravity and pools
          // realistically.

          const dir = Math.random() < 0.5 ? -1 : 1;
          for (let step = 1; step <= 3; step++) {
            const nx = x + dir * step;
            if (nx < 0 || nx >= width) break;
            const ni = y * width + nx;
            const bi = ni + width;
            if (cells[bi] === EMPTY) {
              swap(i, bi);
              velocities[bi] = velocities[i];
              velocities[i] = 0;
              break;
            } else if (cells[ni] === EMPTY) {
              swap(i, ni);
              velocities[ni] = velocities[i];
              velocities[i] = 0;
              break;
            }
          }
        }
      }
    }
  }
  drawCA();
}

export function drawCA() {
  if (!ctx || !cells) return;
  const img = ctx.createImageData(width, height);
  for (let i = 0; i < cells.length; i++) {
    const type = cells[i];
    const colour = colours[type];
    const off = i * 4;
    img.data[off] = colour[0];
    img.data[off + 1] = colour[1];
    img.data[off + 2] = colour[2];
    img.data[off + 3] = colour[3];
  }
  ctx.putImageData(img, 0, 0);
}

export function getTicks() {
  return ticks;
}

// Helper used by game.js to set cells when the user paints.
export function setCell(x, y, type) {
  if (!cells) return;
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  cells[y * width + x] = type;
}

export const CellType = { EMPTY, SAND, WATER };

