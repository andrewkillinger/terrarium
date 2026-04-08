import { AMBIENT_TEMP, CELL_COUNT, FLAG_MOVED, GRID_H, GRID_W } from '../config';
import { ElementId } from '../elements/types';

// Parallel typed-array grid. Hot loops should index the raw arrays directly
// rather than going through accessors.
export class Grid {
  readonly width = GRID_W;
  readonly height = GRID_H;
  readonly id: Uint8Array;
  readonly life: Uint8Array;
  readonly temp: Int16Array;
  readonly flags: Uint8Array;

  constructor() {
    this.id = new Uint8Array(CELL_COUNT);
    this.life = new Uint8Array(CELL_COUNT);
    this.temp = new Int16Array(CELL_COUNT);
    this.flags = new Uint8Array(CELL_COUNT);
    this.temp.fill(AMBIENT_TEMP);
  }

  clear(): void {
    this.id.fill(ElementId.EMPTY);
    this.life.fill(0);
    this.temp.fill(AMBIENT_TEMP);
    this.flags.fill(0);
  }

  clearMovedFlags(): void {
    const f = this.flags;
    const mask = ~FLAG_MOVED & 0xff;
    for (let i = 0; i < f.length; i++) f[i] &= mask;
  }

  idAt(x: number, y: number): number {
    if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return ElementId.WALL;
    return this.id[y * GRID_W + x];
  }

  set(i: number, id: number, life: number, temp: number): void {
    this.id[i] = id;
    this.life[i] = life;
    this.temp[i] = temp;
    this.flags[i] = 0;
  }
}
