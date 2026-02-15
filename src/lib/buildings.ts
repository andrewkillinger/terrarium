// ============================================================
// Building Definitions – costs, production, adjacency
// ============================================================

import { BuildingDef, BuildingType, ResourceCost, ResourceDelta } from './types';

export const GRID_SIZE = 30;
export const PLOT_COOLDOWN_SECONDS = 60;
export const CHAT_RATE_LIMIT_SECONDS = 3;
export const CHAT_MAX_LENGTH = 240;
export const TICK_INTERVAL_MINUTES = 5;

// ---- Building definitions ----

function cost(coins: number, wood: number, stone: number): ResourceCost {
  return { coins, wood, stone };
}

function delta(coins: number, wood: number, stone: number): ResourceDelta {
  return { coins, wood, stone };
}

export const BUILDING_DEFS: Record<BuildingType, BuildingDef> = {
  House: {
    type: 'House',
    label: 'House',
    emoji: '🏠',
    maxLevel: 5,
    cost: (level) => cost(10 + level * 15, 5 + level * 5, 3 + level * 3),
    production: (level) => delta(2 * level, 0, 0),
    populationDelta: (level) => 2 + level,
    description: 'Provides population and coin income. Benefits from adjacent Parks.',
  },
  LumberMill: {
    type: 'LumberMill',
    label: 'Lumber Mill',
    emoji: '🪵',
    maxLevel: 5,
    cost: (level) => cost(15 + level * 10, 0, 5 + level * 5),
    production: (level) => delta(0, 3 + level * 2, 0),
    populationDelta: () => 0,
    description: 'Produces wood each tick.',
  },
  Quarry: {
    type: 'Quarry',
    label: 'Quarry',
    emoji: '⛏️',
    maxLevel: 5,
    cost: (level) => cost(15 + level * 10, 5 + level * 5, 0),
    production: (level) => delta(0, 0, 3 + level * 2),
    populationDelta: () => 0,
    description: 'Produces stone each tick.',
  },
  Market: {
    type: 'Market',
    label: 'Market',
    emoji: '🏪',
    maxLevel: 3,
    cost: (level) => cost(30 + level * 25, 10 + level * 10, 10 + level * 10),
    production: (level) => delta(5 + level * 5, 0, 0),
    populationDelta: () => 0,
    description: 'Generates coins each tick.',
  },
  TownHall: {
    type: 'TownHall',
    label: 'Town Hall',
    emoji: '🏛️',
    maxLevel: 3,
    cost: (level) => cost(50 + level * 40, 20 + level * 15, 20 + level * 15),
    production: (level) => delta(3 * level, 2 * level, 2 * level),
    populationDelta: (level) => 5 + level * 2,
    description: 'Produces all resources and population.',
  },
  Park: {
    type: 'Park',
    label: 'Park',
    emoji: '🌳',
    maxLevel: 3,
    cost: (level) => cost(20 + level * 15, 10 + level * 5, 5 + level * 3),
    production: () => delta(0, 0, 0),
    populationDelta: (level) => 1 + level,
    description: 'Adds population and boosts adjacent Houses (Manhattan distance 1).',
  },
};

export const BUILDING_TYPES = Object.keys(BUILDING_DEFS) as BuildingType[];

// ---- Adjacency helpers ----

export function manhattanNeighbors(x: number, y: number): [number, number][] {
  const result: [number, number][] = [];
  const offsets: [number, number][] = [
    [0, 1], [0, -1], [1, 0], [-1, 0],
  ];
  for (const [dx, dy] of offsets) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
      result.push([nx, ny]);
    }
  }
  return result;
}

export interface PlotLike {
  x: number;
  y: number;
  building_type: BuildingType | null;
  level: number;
}

/**
 * Park adjacency bonus: each House adjacent to a Park gets +50% coin production per adjacent park level.
 * Returns the bonus coin delta for the given plot.
 */
export function parkAdjacencyBonus(plot: PlotLike, allPlots: Map<string, PlotLike>): number {
  if (plot.building_type !== 'House' || plot.level === 0) return 0;

  const baseCoins = BUILDING_DEFS.House.production(plot.level).coins;
  const neighbors = manhattanNeighbors(plot.x, plot.y);
  let parkLevelSum = 0;

  for (const [nx, ny] of neighbors) {
    const neighbor = allPlots.get(`${nx},${ny}`);
    if (neighbor && neighbor.building_type === 'Park' && neighbor.level > 0) {
      parkLevelSum += neighbor.level;
    }
  }

  // +50% per adjacent park level (of the base coins)
  return Math.floor(baseCoins * 0.5 * parkLevelSum);
}

/**
 * Compute full tick production for the entire grid.
 */
export function computeTickProduction(plots: PlotLike[]): ResourceDelta & { populationDelta: number } {
  const plotMap = new Map<string, PlotLike>();
  for (const p of plots) {
    plotMap.set(`${p.x},${p.y}`, p);
  }

  let totalCoins = 0;
  let totalWood = 0;
  let totalStone = 0;
  let totalPop = 0;

  for (const plot of plots) {
    if (!plot.building_type || plot.level === 0) continue;
    const def = BUILDING_DEFS[plot.building_type];
    if (!def) continue;

    const prod = def.production(plot.level);
    totalCoins += prod.coins;
    totalWood += prod.wood;
    totalStone += prod.stone;
    totalPop += def.populationDelta(plot.level);

    // Park adjacency bonus for Houses
    totalCoins += parkAdjacencyBonus(plot, plotMap);
  }

  return { coins: totalCoins, wood: totalWood, stone: totalStone, populationDelta: totalPop };
}

/**
 * Validate that the city can afford a cost.
 */
export function canAfford(
  resources: { coins: number; wood: number; stone: number },
  c: ResourceCost
): boolean {
  return resources.coins >= c.coins && resources.wood >= c.wood && resources.stone >= c.stone;
}

/**
 * Check if the cooldown has elapsed since last_changed_at.
 */
export function isCooldownElapsed(lastChangedAt: string | Date): boolean {
  const changed = new Date(lastChangedAt).getTime();
  const now = Date.now();
  return now - changed >= PLOT_COOLDOWN_SECONDS * 1000;
}
