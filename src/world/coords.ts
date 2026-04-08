import { GRID_H, GRID_W } from '../config';

export function idx(x: number, y: number): number {
  return y * GRID_W + x;
}

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < GRID_W && y >= 0 && y < GRID_H;
}
