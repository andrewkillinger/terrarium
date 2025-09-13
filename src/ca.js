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
let waterDirs;
let imgData;
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
  waterDirs = new Int8Array(w * h);
  imgData = ctx.createImageData(w, h);
  drawCA();
}

function swap(i1, i2) {
  const tmp = cells[i1];
  cells[i1] = cells[i2];
  cells[i2] = tmp;
  const dtmp = waterDirs[i1];
  waterDirs[i1] = waterDirs[i2];
  waterDirs[i2] = dtmp;
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
          // Heuristic water flow inspired by sandspiel's `update_water` logic.
          // Water first tries to fall straight down, then diagonally, and if
          // blocked will slide horizontally. Each water cell remembers the last
          // horizontal direction it moved in so that streams tend to keep their
          // momentum.

          const dir = waterDirs[i] || (Math.random() < 0.5 ? -1 : 1);
          const belowCell = cells[below];
          if (belowCell === EMPTY) {
            swap(i, below);
            velocities[below] = velocities[i];
            velocities[i] = 0;
            waterDirs[below] = dir;
            continue;
          }

          // try diagonal in preferred direction first, then the other
          let moved = false;
          for (const d of [dir, -dir]) {
            const nx = x + d;
            if (nx < 0 || nx >= width) continue;
            const ni = i + d;
            const bi = ni + width;
            if (cells[bi] === EMPTY) {
              swap(i, bi);
              velocities[bi] = velocities[i];
              velocities[i] = 0;
              waterDirs[bi] = d;
              moved = true;
              break;
            }
            if (cells[ni] === EMPTY) {
              swap(i, ni);
              waterDirs[ni] = d;
              moved = true;
              break;
            }
          }
          if (moved) continue;

          // pressure-based horizontal search up to three cells, inspired by
          // the open-source water algorithm in The Powder Toy. This allows
          // water to flow around obstacles and into small cavities.
          outer: for (const d of [dir, -dir]) {
            for (let step = 1; step <= 3; step++) {
              const nx = x + d * step;
              if (nx < 0 || nx >= width) continue;
              const ni = i + d * step;
              const bi = ni + width;
              if (cells[ni] === EMPTY && cells[bi] === EMPTY) {
                swap(i, bi);
                velocities[bi] = velocities[i];
                velocities[i] = 0;
                waterDirs[bi] = d;
                moved = true;
                break outer;
              }
              if (cells[ni] === EMPTY) {
                swap(i, ni);
                waterDirs[ni] = d;
                moved = true;
                break outer;
              }
            }
          }
          if (!moved) {
            waterDirs[i] = -dir; // bump and change direction
          }
        }
      }
    }
  }
  drawCA();
}

export function drawCA() {
  if (!ctx || !cells || !imgData) return;
  const data = imgData.data;
  for (let i = 0; i < cells.length; i++) {
    const type = cells[i];
    const colour = colours[type];
    const off = i * 4;
    data[off] = colour[0];
    data[off + 1] = colour[1];
    data[off + 2] = colour[2];
    data[off + 3] = colour[3];
  }
  ctx.putImageData(imgData, 0, 0);
}

export function getTicks() {
  return ticks;
}

// Helper used by game.js to set cells when the user paints.
export function setCell(x, y, type) {
  if (!cells) return;
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const i = y * width + x;
  cells[i] = type;
  waterDirs[i] = 0;
}

export const CellType = { EMPTY, SAND, WATER };

