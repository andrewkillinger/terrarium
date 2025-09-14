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
  [WATER]: [100, 100, 255, 255],
};

const WATER_COLOR_DARK = [50, 50, 145, 255];
const WATER_COLOR_SHIFT = 0.25;
const WATER_BRIGHT_INC = (WATER_COLOR_SHIFT * 10) / 110;
const WATER_DARK_DEC = WATER_COLOR_SHIFT / 110;

let cells;
let velX;
let velY;
let waterDir;
let waterShade;
let waterUpdated;
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
  waterDir = new Uint8Array(w * h);
  waterShade = new Float32Array(w * h);
  waterUpdated = new Uint8Array(w * h);
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
  waterUpdated.fill(0);
  for (let y = height - 2; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const cell = cells[i];
      if (cell === SAND) {
        const below = i + width;
        if (cells[below] === WATER) {
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
        if (waterUpdated[i]) continue;
        const below = i + width;
        if (cells[below] === EMPTY) {
          swap(i, below);
          waterDir[below] = waterDir[i];
          waterShade[below] = Math.min(1, waterShade[i] + WATER_BRIGHT_INC);
          waterDir[i] = 0;
          waterShade[i] = 0;
          velX[i] = velY[i] = 0;
          velX[below] = velY[below] = 0;
          waterUpdated[below] = 1;
          continue;
        }
        if (x + 1 < width && cells[below + 1] === EMPTY) {
          swap(i, below + 1);
          waterDir[below + 1] = waterDir[i];
          waterShade[below + 1] = Math.min(1, waterShade[i] + WATER_BRIGHT_INC);
          waterDir[i] = 0;
          waterShade[i] = 0;
          velX[i] = velY[i] = 0;
          velX[below + 1] = velY[below + 1] = 0;
          waterUpdated[below + 1] = 1;
          continue;
        }
        if (x - 1 >= 0 && cells[below - 1] === EMPTY) {
          swap(i, below - 1);
          waterDir[below - 1] = waterDir[i];
          waterShade[below - 1] = Math.min(1, waterShade[i] + WATER_BRIGHT_INC);
          waterDir[i] = 0;
          waterShade[i] = 0;
          velX[i] = velY[i] = 0;
          velX[below - 1] = velY[below - 1] = 0;
          waterUpdated[below - 1] = 1;
          continue;
        }
        if (x - 1 >= 0 && cells[i - 1] === EMPTY && waterDir[i] !== 2) {
          swap(i, i - 1);
          waterDir[i - 1] = 1;
          waterShade[i - 1] = Math.min(1, waterShade[i] + WATER_BRIGHT_INC);
          waterDir[i] = 0;
          waterShade[i] = 0;
          velX[i] = velY[i] = 0;
          velX[i - 1] = velY[i - 1] = 0;
          waterUpdated[i - 1] = 1;
          continue;
        }
        if (x + 1 < width && cells[i + 1] === EMPTY && waterDir[i] !== 1) {
          swap(i, i + 1);
          waterDir[i + 1] = 2;
          waterShade[i + 1] = Math.min(1, waterShade[i] + WATER_BRIGHT_INC);
          waterDir[i] = 0;
          waterShade[i] = 0;
          velX[i] = velY[i] = 0;
          velX[i + 1] = velY[i + 1] = 0;
          waterUpdated[i + 1] = 1;
          continue;
        }
        if (y > 0 && cells[i - width] === SAND) {
          swap(i, i - width);
          waterDir[i - width] = waterDir[i];
          waterShade[i - width] = waterShade[i];
          waterDir[i] = 0;
          waterShade[i] = 0;
          velX[i] = velY[i] = 0;
          velX[i - width] = velY[i - width] = 0;
          waterUpdated[i - width] = 1;
          continue;
        }
        waterShade[i] = Math.max(0, waterShade[i] - WATER_DARK_DEC);
        waterDir[i] = 0;
        velX[i] = velY[i] = 0;
        waterUpdated[i] = 1;
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
    const off = i * 4;
    if (type === WATER) {
      const shade = waterShade[i];
      data[off] = WATER_COLOR_DARK[0] + (colours[WATER][0] - WATER_COLOR_DARK[0]) * shade;
      data[off + 1] = WATER_COLOR_DARK[1] + (colours[WATER][1] - WATER_COLOR_DARK[1]) * shade;
      data[off + 2] = WATER_COLOR_DARK[2] + (colours[WATER][2] - WATER_COLOR_DARK[2]) * shade;
      data[off + 3] = 255;
    } else {
      const colour = colours[type];
      data[off] = colour[0];
      data[off + 1] = colour[1];
      data[off + 2] = colour[2];
      data[off + 3] = colour[3];
    }
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
  waterDir[i] = 0;
  waterShade[i] = type === WATER ? 1 : 0;
  waterUpdated[i] = 0;
}

export const CellType = { EMPTY, SAND, WATER };

