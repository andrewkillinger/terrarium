import { GRID_H, GRID_W } from '../config';
import { ELEMENTS } from '../elements/registry';
import { ElementId } from '../elements/types';
import { CREATURE_DEFS } from '../creatures/Creature';
import type { World } from '../world/World';

// Renderer uses an offscreen ImageData the size of the grid and then draws
// it to the display canvas scaled up with nearest-neighbor sampling. One
// allocation up front; per frame just one linear write and one putImageData.
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private back: OffscreenCanvas | HTMLCanvasElement;
  private backCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  private image: ImageData;
  private pixels: Uint32Array;
  private palette: Uint32Array;
  private scale = 3;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;

    // Offscreen backing buffer.
    if (typeof OffscreenCanvas !== 'undefined') {
      this.back = new OffscreenCanvas(GRID_W, GRID_H);
    } else {
      const b = document.createElement('canvas');
      b.width = GRID_W;
      b.height = GRID_H;
      this.back = b;
    }
    const bctx = this.back.getContext('2d', { alpha: false }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!bctx) throw new Error('backing 2D context unavailable');
    this.backCtx = bctx;
    this.image = this.backCtx.createImageData(GRID_W, GRID_H);
    this.pixels = new Uint32Array(this.image.data.buffer);

    this.palette = new Uint32Array(256);
    for (let i = 0; i < ELEMENTS.length; i++) {
      const el = ELEMENTS[i];
      this.palette[i] = el ? el.color : 0xff000000;
    }

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scaleX = Math.max(1, Math.floor(w / GRID_W));
    const scaleY = Math.max(1, Math.floor(h / GRID_H));
    this.scale = Math.max(1, Math.min(scaleX, scaleY));
    const cw = GRID_W * this.scale;
    const ch = GRID_H * this.scale;
    this.canvas.width = cw;
    this.canvas.height = ch;
    this.canvas.style.width = cw + 'px';
    this.canvas.style.height = ch + 'px';
    this.ctx.imageSmoothingEnabled = false;
  }

  scaleFactor(): number {
    return this.scale;
  }

  render(world: World): void {
    const g = world.grid;
    const id = g.id;
    const temp = g.temp;
    const px = this.pixels;
    const pal = this.palette;
    const len = id.length;

    for (let i = 0; i < len; i++) {
      const el = id[i];
      let color = pal[el];
      // Tint hot cells slightly red/orange.
      if (temp[i] > 250 && el !== ElementId.FIRE && el !== ElementId.LAVA) {
        const t = Math.min(1, (temp[i] - 250) / 750);
        const mix = (t * 180) | 0;
        // Add red (which in little-endian BGRA is the low byte of the RGB... careful).
        // color is 0xAABBGGRR: R is the low 8 bits.
        const r = (color & 0xff) + mix;
        color = (color & 0xffffff00) | (r > 255 ? 255 : r);
      }
      // Sparkle fire & lava a bit so they don't look static.
      if (el === ElementId.FIRE || el === ElementId.LAVA) {
        const j = ((i * 2654435761) >>> 0) + (world.tickCount | 0);
        const flick = (j & 0x1f) - 16;
        const r = Math.max(100, Math.min(255, (color & 0xff) + flick));
        color = (color & 0xffffff00) | r;
      }
      px[i] = color;
    }

    this.backCtx.putImageData(this.image, 0, 0);
    const s = this.scale;
    // Draw backing buffer upscaled.
    (this.ctx as CanvasRenderingContext2D).drawImage(
      this.back as CanvasImageSource,
      0,
      0,
      GRID_W * s,
      GRID_H * s,
    );

    // Creatures on top as scaled rects.
    for (const c of world.creatures) {
      const def = CREATURE_DEFS[c.kind];
      this.ctx.fillStyle = def.color;
      this.ctx.fillRect(
        ((c.x - def.width * 0.5) | 0) * s,
        ((c.y - def.height * 0.5) | 0) * s,
        def.width * s,
        def.height * s,
      );
    }
  }

  // Convert a clientX/Y on the canvas to integer grid coordinates.
  clientToGrid(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const gx = ((clientX - rect.left) / this.scale) | 0;
    const gy = ((clientY - rect.top) / this.scale) | 0;
    return { x: gx, y: gy };
  }
}
