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
let velX;
let velY;
let imgData;
const GRAVITY = 0.5;
const MAX_VEL = 5;
const MAX_HVEL = 3;

export function initCA(canvas, w, h) {
  if (!canvas) return;
  width = w;
  height = h;
  canvas.width = w;
  canvas.height = h;
  ctx = canvas.getContext('2d');
  cells = new Uint8Array(w * h);
  velX = new Float32Array(w * h);
  velY = new Float32Array(w * h);
  imgData = ctx.createImageData(w, h);
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
          velX[below] = velX[i];
          velY[below] = velY[i];
          velX[i] = 0;
          velY[i] = 0;
          const splash = i + (Math.random() < 0.5 ? -1 : 1);
          if (splash >= 0 && splash < cells.length && cells[splash] === EMPTY) {
            cells[splash] = WATER;
          }
          continue;
        }

        let v = velY[i] + acc;
        if (v > MAX_VEL) v = MAX_VEL;
        velY[i] = v;
        let ny = y;
        for (let step = 0; step < Math.floor(v); step++) {
          const belowStep = (ny + 1) * width + x;
          if (ny + 1 >= height || cells[belowStep] !== EMPTY) break;
          ny++;
        }
        const dest = ny * width + x;
        if (dest !== i) {
          swap(i, dest);
          velX[dest] = velX[i];
          velY[dest] = v;
          velX[i] = 0;
          velY[i] = 0;
          continue;
        }
        velY[i] = 0;
        if (cell === SAND) {
          const dir = Math.random() < 0.5 ? -1 : 1;
          const nx = x + dir;
          const ni = below + dir;
          if (nx >= 0 && nx < width && cells[ni] === EMPTY) {
            swap(i, ni);
            velX[ni] = velX[i];
            velY[ni] = velY[i];
            velX[i] = 0;
            velY[i] = 0;
          }
        } else if (cell === WATER) {
          // Water fluid dynamics using simple velocity-based momentum. Each
          // water cell remembers its horizontal velocity and will attempt to
          // keep flowing in that direction when obstructed.

          let vx = velX[i] * 0.99; // friction
          if (vx > MAX_HVEL) vx = MAX_HVEL;
          if (vx < -MAX_HVEL) vx = -MAX_HVEL;
          velX[i] = vx;
          const dir = vx !== 0 ? Math.sign(vx) : (Math.random() < 0.5 ? -1 : 1);
          const belowCell = cells[below];
          if (belowCell === EMPTY) {
            swap(i, below);
            velX[below] = vx;
            velY[below] = velY[i];
            velX[i] = 0;
            velY[i] = 0;
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
              velX[bi] = vx + d * 0.5;
              velY[bi] = velY[i];
              velX[i] = 0;
              velY[i] = 0;
              moved = true;
              break;
            }
            if (cells[ni] === EMPTY) {
              swap(i, ni);
              velX[ni] = vx + d * 0.5;
              velY[ni] = velY[i];
              velX[i] = 0;
              velY[i] = 0;
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
                velX[bi] = vx + d * 0.3;
                velY[bi] = velY[i];
                velX[i] = 0;
                velY[i] = 0;
                moved = true;
                break outer;
              }
              if (cells[ni] === EMPTY) {
                swap(i, ni);
                velX[ni] = vx + d * 0.3;
                velY[ni] = velY[i];
                velX[i] = 0;
                velY[i] = 0;
                moved = true;
                break outer;
              }
            }
          }
          if (!moved) {
            velX[i] = -vx * 0.5; // bump and reverse velocity
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
  velX[i] = 0;
  velY[i] = 0;
}

export const CellType = { EMPTY, SAND, WATER };

