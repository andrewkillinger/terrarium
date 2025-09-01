let ctx;
let width = 0;
let height = 0;
let ticks = 0;

export function initCA(canvas, w, h) {
  if (!canvas) return;
  width = w;
  height = h;
  canvas.width = w;
  canvas.height = h;
  ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, w, h);
}

export function stepCA() {
  ticks++;
}

export function drawCA() {
  if (!ctx) return;
  const c = ticks % 255;
  ctx.fillStyle = `rgb(${c}, ${c}, ${c})`;
  ctx.fillRect(0, 0, width, height);
}

export function getTicks() {
  return ticks;
}
