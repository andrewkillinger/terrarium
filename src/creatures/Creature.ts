import { ElementId } from '../elements/types';
import type { World } from '../world/World';

export const enum CreatureKind {
  ANT = 0,
  FISH = 1,
  BIRD = 2,
  WORM = 3,
  FROG = 4,
  BEETLE = 5,
}

export type CreatureDef = {
  kind: CreatureKind;
  name: string;
  color: string; // CSS hex for fillRect
  width: number;
  height: number;
};

export const CREATURE_DEFS: Record<CreatureKind, CreatureDef> = {
  [CreatureKind.ANT]: { kind: CreatureKind.ANT, name: 'Ant', color: '#1a0c08', width: 2, height: 2 },
  [CreatureKind.FISH]: { kind: CreatureKind.FISH, name: 'Fish', color: '#ffb060', width: 3, height: 2 },
  [CreatureKind.BIRD]: { kind: CreatureKind.BIRD, name: 'Bird', color: '#ffffff', width: 3, height: 2 },
  [CreatureKind.WORM]: { kind: CreatureKind.WORM, name: 'Worm', color: '#ff88cc', width: 2, height: 2 },
  [CreatureKind.FROG]: { kind: CreatureKind.FROG, name: 'Frog', color: '#40a030', width: 3, height: 3 },
  [CreatureKind.BEETLE]: { kind: CreatureKind.BEETLE, name: 'Beetle', color: '#553b1f', width: 2, height: 2 },
};

export class Creature {
  kind: CreatureKind;
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  hp = 30;
  timer = 0;
  dead = false;

  constructor(kind: CreatureKind, x: number, y: number) {
    this.kind = kind;
    this.x = x;
    this.y = y;
  }

  update(world: World): void {
    this.timer++;
    const id = world.grid.idAt(this.x | 0, this.y | 0);
    // Death by fire/lava/explosion.
    if (id === ElementId.FIRE || id === ElementId.LAVA) {
      this.dead = true;
      return;
    }
    switch (this.kind) {
      case CreatureKind.ANT:
        updateAnt(this, world);
        break;
      case CreatureKind.FISH:
        updateFish(this, world);
        break;
      case CreatureKind.BIRD:
        updateBird(this, world);
        break;
      case CreatureKind.WORM:
        updateWorm(this, world);
        break;
      case CreatureKind.FROG:
        updateFrog(this, world);
        break;
      case CreatureKind.BEETLE:
        updateBeetle(this, world);
        break;
    }
  }
}

// ---- per-kind updates ----

function isSolid(id: number): boolean {
  return (
    id === ElementId.SAND ||
    id === ElementId.DIRT ||
    id === ElementId.STONE ||
    id === ElementId.WOOD ||
    id === ElementId.BRICK ||
    id === ElementId.METAL ||
    id === ElementId.GLASS ||
    id === ElementId.ICE ||
    id === ElementId.GRASS ||
    id === ElementId.VINE ||
    id === ElementId.WALL
  );
}

function isAir(id: number): boolean {
  return id === ElementId.EMPTY || id === ElementId.SMOKE || id === ElementId.STEAM;
}

function isWater(id: number): boolean {
  return id === ElementId.WATER;
}

function updateAnt(c: Creature, w: World): void {
  const g = w.grid;
  // Flee fire within 5 cells.
  const fxRange = 5;
  let fleeing = 0;
  for (let dx = -fxRange; dx <= fxRange; dx++) {
    const nx = (c.x | 0) + dx;
    const ny = c.y | 0;
    if (g.idAt(nx, ny) === ElementId.FIRE) {
      fleeing = dx > 0 ? -1 : 1;
      break;
    }
  }
  if (fleeing !== 0) c.vx = fleeing * 0.6;
  else if (c.vx === 0 || w.rng.chance(0.02)) c.vx = w.rng.sign() * 0.4;

  // Walk: need solid below, empty in front.
  const bx = c.x | 0;
  const by = (c.y | 0) + 1;
  if (!isSolid(g.idAt(bx, by))) {
    // Gravity.
    c.vy += 0.3;
  } else {
    c.vy = 0;
  }
  const nx = c.x + c.vx;
  const ny = c.y + c.vy;
  if (isAir(g.idAt(nx | 0, ny | 0))) {
    // Eat grass in the path.
    if (g.idAt(c.x | 0, c.y | 0) === ElementId.GRASS) {
      w.deferCreatureWrite(c.x | 0, c.y | 0, ElementId.EMPTY, 0, 20);
    }
    c.x = nx;
    c.y = ny;
  } else if (isSolid(g.idAt(nx | 0, ny | 0))) {
    // Try step up.
    if (isAir(g.idAt(nx | 0, (ny | 0) - 1))) {
      c.x = nx;
      c.y = ny - 1;
    } else {
      c.vx = -c.vx;
    }
  }
  clampToBounds(c, w);
}

function updateFish(c: Creature, w: World): void {
  const g = w.grid;
  // Must be in water.
  if (!isWater(g.idAt(c.x | 0, c.y | 0))) {
    c.hp--;
    if (c.hp <= 0) c.dead = true;
  }
  if (c.vx === 0 || w.rng.chance(0.03)) c.vx = (w.rng.next() - 0.5) * 1.2;
  if (w.rng.chance(0.05)) c.vy = (w.rng.next() - 0.5) * 0.8;
  const nx = c.x + c.vx;
  const ny = c.y + c.vy;
  if (isWater(g.idAt(nx | 0, ny | 0))) {
    c.x = nx;
    c.y = ny;
  } else {
    c.vx = -c.vx;
    c.vy = -c.vy;
  }
  clampToBounds(c, w);
}

function updateBird(c: Creature, w: World): void {
  const g = w.grid;
  // Sine flight.
  if (c.vx === 0) c.vx = w.rng.sign() * 0.8;
  c.vy = Math.sin(c.timer * 0.1) * 0.5;
  // Flee explosions: not directly measurable -> just flee fire.
  if (g.idAt((c.x + c.vx * 4) | 0, c.y | 0) === ElementId.FIRE) c.vx = -c.vx;
  const nx = c.x + c.vx;
  const ny = c.y + c.vy;
  if (isAir(g.idAt(nx | 0, ny | 0))) {
    c.x = nx;
    c.y = ny;
  } else {
    c.vx = -c.vx;
  }
  clampToBounds(c, w);
}

function updateWorm(c: Creature, w: World): void {
  const g = w.grid;
  if (c.vx === 0 || w.rng.chance(0.02)) {
    c.vx = (w.rng.next() - 0.5) * 0.8;
    c.vy = (w.rng.next() - 0.3) * 0.8;
  }
  const nx = (c.x + c.vx) | 0;
  const ny = (c.y + c.vy) | 0;
  const target = g.idAt(nx, ny);
  if (target === ElementId.DIRT || target === ElementId.SAND || target === ElementId.GRASS || isAir(target)) {
    if (target === ElementId.DIRT || target === ElementId.SAND || target === ElementId.GRASS) {
      w.deferCreatureWrite(nx, ny, ElementId.EMPTY, 0, 20);
    }
    c.x = nx;
    c.y = ny;
  } else {
    c.vx = -c.vx;
    c.vy = -c.vy;
  }
  clampToBounds(c, w);
}

function updateFrog(c: Creature, w: World): void {
  const g = w.grid;
  // Sit on solids, jump occasionally.
  const below = g.idAt(c.x | 0, (c.y | 0) + 1);
  if (isSolid(below)) {
    c.vy = 0;
    if (w.rng.chance(0.01)) {
      c.vy = -2.4;
      c.vx = w.rng.sign() * 1.2;
    } else {
      c.vx = 0;
    }
  } else {
    c.vy += 0.25;
  }
  const nx = c.x + c.vx;
  const ny = c.y + c.vy;
  if (isAir(g.idAt(nx | 0, ny | 0)) || isWater(g.idAt(nx | 0, ny | 0))) {
    c.x = nx;
    c.y = ny;
  } else {
    c.vx = 0;
    c.vy = 0;
  }
  clampToBounds(c, w);
}

function updateBeetle(c: Creature, w: World): void {
  const g = w.grid;
  // Walks on solids; also climbs walls (ignores gravity if adjacent to solid).
  if (c.vx === 0 || w.rng.chance(0.02)) c.vx = w.rng.sign() * 0.4;
  if (c.vy === 0 || w.rng.chance(0.02)) c.vy = w.rng.sign() * 0.3;
  // Eat wood slowly.
  if (g.idAt(c.x | 0, c.y | 0) === ElementId.WOOD && w.rng.chance(0.05)) {
    w.deferCreatureWrite(c.x | 0, c.y | 0, ElementId.EMPTY, 0, 20);
  }
  const nx = c.x + c.vx;
  const ny = c.y + c.vy;
  if (isAir(g.idAt(nx | 0, ny | 0))) {
    c.x = nx;
    c.y = ny;
  } else {
    c.vx = -c.vx;
    c.vy = -c.vy;
  }
  clampToBounds(c, w);
}

function clampToBounds(c: Creature, w: World): void {
  const g = w.grid;
  if (c.x < 1) {
    c.x = 1;
    c.vx = Math.abs(c.vx);
  }
  if (c.x > g.width - 2) {
    c.x = g.width - 2;
    c.vx = -Math.abs(c.vx);
  }
  if (c.y < 1) {
    c.y = 1;
    c.vy = Math.abs(c.vy);
  }
  if (c.y > g.height - 2) {
    c.y = g.height - 2;
    c.vy = -Math.abs(c.vy);
  }
}
