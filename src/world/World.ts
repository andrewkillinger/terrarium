import { AMBIENT_TEMP, FLAG_MOVED, GRID_H, GRID_W } from '../config';
import { ELEMENTS, initElements } from '../elements/registry';
import { ElementId } from '../elements/types';
import { mulberry32, Rng } from '../rng';
import { Grid } from './Grid';
import type { Creature } from '../creatures/Creature';

// An explosion scheduled during a tick and drained at end-of-tick.
// Kept as plain numbers to avoid object allocation.
export type PendingExplosion = {
  x: number;
  y: number;
  radius: number;
  power: number;
};

// Deferred grid writes requested by creatures during their update pass.
// Creatures must not mutate the grid directly (would depend on iteration
// order); they enqueue changes here and the world applies them at tick end.
export type DeferredWrite = {
  x: number;
  y: number;
  id: number;
  life: number;
  temp: number;
};

export class World {
  readonly grid: Grid;
  readonly rng: Rng;
  readonly creatures: Creature[] = [];
  private explosionQueue: PendingExplosion[] = [];
  private creatureWrites: DeferredWrite[] = [];
  tickCount = 0;

  constructor(seed = 0xc0ffee) {
    initElements();
    this.grid = new Grid();
    this.rng = mulberry32(seed);
    // Carve border into WALL cells so nothing escapes the world.
    const g = this.grid;
    for (let x = 0; x < GRID_W; x++) {
      g.id[x] = ElementId.WALL;
      g.id[(GRID_H - 1) * GRID_W + x] = ElementId.WALL;
    }
    for (let y = 0; y < GRID_H; y++) {
      g.id[y * GRID_W] = ElementId.WALL;
      g.id[y * GRID_W + (GRID_W - 1)] = ElementId.WALL;
    }
  }

  clear(): void {
    this.grid.clear();
    // Re-carve walls.
    const g = this.grid;
    for (let x = 0; x < GRID_W; x++) {
      g.id[x] = ElementId.WALL;
      g.id[(GRID_H - 1) * GRID_W + x] = ElementId.WALL;
    }
    for (let y = 0; y < GRID_H; y++) {
      g.id[y * GRID_W] = ElementId.WALL;
      g.id[y * GRID_W + (GRID_W - 1)] = ElementId.WALL;
    }
    this.creatures.length = 0;
    this.explosionQueue.length = 0;
    this.creatureWrites.length = 0;
  }

  queueExplosion(x: number, y: number, radius: number, power: number): void {
    this.explosionQueue.push({ x, y, radius, power });
  }

  deferCreatureWrite(x: number, y: number, id: number, life: number, temp: number): void {
    this.creatureWrites.push({ x, y, id, life, temp });
  }

  tick(): void {
    const g = this.grid;
    g.clearMovedFlags();

    const lr = (this.tickCount & 1) === 0; // alternate row direction
    // Iterate bottom-up so falling materials don't double-step.
    for (let y = GRID_H - 2; y >= 1; y--) {
      if (lr) {
        for (let x = 1; x < GRID_W - 1; x++) this.updateCell(x, y);
      } else {
        for (let x = GRID_W - 2; x >= 1; x--) this.updateCell(x, y);
      }
    }

    // Update creatures and apply their deferred grid writes.
    for (let i = this.creatures.length - 1; i >= 0; i--) {
      const c = this.creatures[i];
      c.update(this);
      if (c.dead) this.creatures.splice(i, 1);
    }
    if (this.creatureWrites.length) {
      for (const w of this.creatureWrites) {
        const i = w.y * GRID_W + w.x;
        if (g.id[i] !== ElementId.WALL) {
          g.id[i] = w.id;
          g.life[i] = w.life;
          g.temp[i] = w.temp;
          g.flags[i] = 0;
        }
      }
      this.creatureWrites.length = 0;
    }

    // Drain explosion queue. Each explosion may enqueue more (chain reactions)
    // via temp changes on the next tick, not via recursion here.
    while (this.explosionQueue.length > 0) {
      const e = this.explosionQueue.pop()!;
      this.detonate(e.x, e.y, e.radius, e.power);
    }

    this.tickCount++;
  }

  private updateCell(x: number, y: number): void {
    const g = this.grid;
    const i = y * GRID_W + x;
    if ((g.flags[i] & FLAG_MOVED) !== 0) return;
    const id = g.id[i];
    const el = ELEMENTS[id];
    if (el !== undefined && el.update !== undefined) {
      el.update(this, x, y, i);
    }
  }

  private detonate(cx: number, cy: number, radius: number, power: number): void {
    const g = this.grid;
    const r2 = radius * radius;
    const hardR2 = (radius * 0.55) * (radius * 0.55);
    const rng = this.rng;
    const minX = Math.max(1, cx - radius);
    const maxX = Math.min(GRID_W - 2, cx + radius);
    const minY = Math.max(1, cy - radius);
    const maxY = Math.min(GRID_H - 2, cy + radius);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        const i = y * GRID_W + x;
        const id = g.id[i];
        if (id === ElementId.WALL) continue;
        const hard = id === ElementId.BRICK || id === ElementId.METAL;
        if (hard && d2 > hardR2) {
          // Heat it even if we don't break it.
          g.temp[i] = Math.min(3000, g.temp[i] + 200);
          continue;
        }
        // Inner core = FIRE, mid = SMOKE, outer = EMPTY (mostly).
        const rel = d2 / r2;
        let newId: number;
        if (rel < 0.33) {
          newId = ElementId.FIRE;
        } else if (rel < 0.66) {
          newId = rng.chance(0.6) ? ElementId.SMOKE : ElementId.FIRE;
        } else {
          newId = rng.chance(0.5) ? ElementId.SMOKE : ElementId.EMPTY;
        }
        // Glass shatters into sand.
        if (id === ElementId.GLASS && rng.chance(0.5)) newId = ElementId.SAND;
        g.id[i] = newId;
        g.life[i] = newId === ElementId.FIRE ? 30 : newId === ElementId.SMOKE ? 120 : 0;
        g.temp[i] = Math.min(3000, g.temp[i] + power + 400);
        g.flags[i] = 0;
      }
    }
    // Kill creatures in the blast radius.
    for (const c of this.creatures) {
      const dx = c.x - cx;
      const dy = c.y - cy;
      if (dx * dx + dy * dy <= r2) c.dead = true;
    }
  }

  // Seed a pleasant default scene so the sandbox isn't empty on load.
  defaultScene(): void {
    this.clear();
    const g = this.grid;
    // Dirt floor with a grass top, a pond, some stone outcrops, a wood shelf.
    const floorY = GRID_H - 30;
    for (let x = 1; x < GRID_W - 1; x++) {
      const height = floorY + ((Math.sin(x * 0.05) * 3) | 0) + ((Math.sin(x * 0.13) * 2) | 0);
      for (let y = height; y < GRID_H - 1; y++) {
        const i = y * GRID_W + x;
        g.id[i] = y === height ? ElementId.GRASS : ElementId.DIRT;
        g.temp[i] = AMBIENT_TEMP;
      }
    }
    // Pond
    for (let x = 60; x < 110; x++) {
      for (let y = floorY - 4; y < floorY + 6; y++) {
        const i = y * GRID_W + x;
        if (g.id[i] === ElementId.DIRT || g.id[i] === ElementId.GRASS || g.id[i] === ElementId.EMPTY) {
          g.id[i] = ElementId.WATER;
        }
      }
    }
    // Stone pile
    for (let x = 200; x < 230; x++) {
      for (let y = floorY - 18; y < floorY; y++) {
        const i = y * GRID_W + x;
        const dx = x - 215;
        const dy = y - (floorY - 2);
        if (dx * dx * 0.6 + dy * dy < 120) g.id[i] = ElementId.STONE;
      }
    }
    // Wooden platform
    for (let x = 150; x < 185; x++) {
      const y = floorY - 20;
      g.id[y * GRID_W + x] = ElementId.WOOD;
    }
  }
}
