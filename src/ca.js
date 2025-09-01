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

export function initCA(canvas, w, h) {
  if (!canvas) return;
  width = w;
  height = h;
  canvas.width = w;
  canvas.height = h;
  ctx = canvas.getContext('2d');
  cells = new Uint8Array(w * h);
  drawCA();
}

function swap(i1, i2) {
  const tmp = cells[i1];
  cells[i1] = cells[i2];
  cells[i2] = tmp;
}

export function stepCA() {
  if (!cells) return;
  ticks++;
  // update from bottom to top so particles fall correctly
  for (let y = height - 2; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const cell = cells[i];
      if (cell === SAND) {
        const below = i + width;
        if (cells[below] === EMPTY) {
          swap(i, below);
        } else {
          const dir = Math.random() < 0.5 ? -1 : 1;
          const nx = x + dir;
          const ni = below + dir;
          if (nx >= 0 && nx < width && cells[ni] === EMPTY) {
            swap(i, ni);
          }
        }
      } else if (cell === WATER) {
        const below = i + width;
        if (cells[below] === EMPTY) {
          swap(i, below);
        } else {
          const dirs = [-1, 1];
          if (Math.random() < 0.5) dirs.reverse();
          for (const dir of dirs) {
            const nx = x + dir;
            const ni = i + dir;
            const bi = below + dir;
            if (nx >= 0 && nx < width && cells[bi] === EMPTY) {
              swap(i, bi);
              break;
            } else if (nx >= 0 && nx < width && cells[ni] === EMPTY) {
              swap(i, ni);
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

