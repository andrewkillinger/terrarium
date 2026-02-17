// ============================================================
// Building Definitions – costs, production, adjacency, districts
// ============================================================

import { BuildingDef, BuildingType, ResourceCost, ResourceDelta, District, Plot } from './types';
import { DISTRICT_RULES } from './game-config';

export const GRID_SIZE = 30;
export const PLOT_COOLDOWN_SECONDS = 60;
export const CHAT_RATE_LIMIT_SECONDS = 3;
export const CHAT_MAX_LENGTH = 240;
export const TICK_INTERVAL_MINUTES = 5;

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
    description: 'Adds population and boosts adjacent Houses.',
  },
  Factory: {
    type: 'Factory',
    label: 'Factory',
    emoji: '🏭',
    maxLevel: 3,
    cost: (level) => cost(80 + level * 50, 30 + level * 20, 30 + level * 20),
    production: (level) => delta(4 * level, 3 * level, 3 * level),
    populationDelta: () => 0,
    description: 'Mass-produces all resources.',
    unlockPopulation: 100,
  },
  Cathedral: {
    type: 'Cathedral',
    label: 'Cathedral',
    emoji: '⛪',
    maxLevel: 3,
    cost: (level) => cost(120 + level * 80, 50 + level * 30, 60 + level * 40),
    production: (level) => delta(2 * level, 0, 0),
    populationDelta: (level) => 10 + level * 5,
    description: 'Massive population boost. Spiritual center.',
    unlockPopulation: 200,
  },
  Harbor: {
    type: 'Harbor',
    label: 'Harbor',
    emoji: '⚓',
    maxLevel: 3,
    cost: (level) => cost(100 + level * 60, 40 + level * 25, 20 + level * 15),
    production: (level) => delta(8 * level, 4 * level, 0),
    populationDelta: (level) => 3 + level * 2,
    description: 'Trade port. High coin and wood production.',
    unlockPopulation: 150,
  },
  Road: {
    type: 'Road',
    label: 'Road',
    emoji: '🛤️',
    maxLevel: 1,
    cost: () => cost(5, 2, 2),
    production: () => delta(0, 0, 0),
    populationDelta: () => 0,
    description: 'Connects buildings. Adjacent buildings get +10% production.',
  },
};

export const BASIC_BUILDING_TYPES: BuildingType[] = [
  'House', 'LumberMill', 'Quarry', 'Market', 'TownHall', 'Park', 'Road',
];

export const BUILDING_TYPES = Object.keys(BUILDING_DEFS) as BuildingType[];

export function getAvailableBuildings(population: number): BuildingType[] {
  return BUILDING_TYPES.filter(type => {
    const def = BUILDING_DEFS[type];
    return !def.unlockPopulation || population >= def.unlockPopulation;
  });
}

// ---- Adjacency helpers ----

export function manhattanNeighbors(x: number, y: number): [number, number][] {
  const result: [number, number][] = [];
  const offsets: [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];
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
  return Math.floor(baseCoins * 0.5 * parkLevelSum);
}

export function roadAdjacencyBonus(plot: PlotLike, allPlots: Map<string, PlotLike>): number {
  if (!plot.building_type || plot.building_type === 'Road' || plot.level === 0) return 0;
  const neighbors = manhattanNeighbors(plot.x, plot.y);
  let roadCount = 0;
  for (const [nx, ny] of neighbors) {
    const neighbor = allPlots.get(`${nx},${ny}`);
    if (neighbor && neighbor.building_type === 'Road') roadCount++;
  }
  return roadCount;
}

export function detectDistricts(plots: PlotLike[]): District[] {
  const plotMap = new Map<string, PlotLike>();
  for (const p of plots) {
    if (p.building_type && p.level > 0) plotMap.set(`${p.x},${p.y}`, p);
  }

  const districts: District[] = [];

  for (const rule of DISTRICT_RULES) {
    const globalVisited = new Set<string>();

    for (const plot of plots) {
      if (!plot.building_type || plot.level === 0) continue;
      if (!rule.requiredTypes.includes(plot.building_type)) continue;
      const key = `${plot.x},${plot.y}`;
      if (globalVisited.has(key)) continue;

      const cluster: [number, number][] = [];
      const queue: [number, number][] = [[plot.x, plot.y]];
      const clusterVisited = new Set<string>();
      clusterVisited.add(key);

      while (queue.length > 0) {
        const [cx, cy] = queue.shift()!;
        cluster.push([cx, cy]);
        for (const [nx, ny] of manhattanNeighbors(cx, cy)) {
          const nkey = `${nx},${ny}`;
          if (clusterVisited.has(nkey)) continue;
          const neighbor = plotMap.get(nkey);
          if (neighbor && rule.requiredTypes.includes(neighbor.building_type!)) {
            clusterVisited.add(nkey);
            queue.push([nx, ny]);
          }
        }
      }

      if (cluster.length >= rule.minCluster) {
        districts.push({ type: rule.type, plots: cluster, bonusPercent: rule.bonusPercent });
        for (const [cx, cy] of cluster) globalVisited.add(`${cx},${cy}`);
      }
    }
  }

  return districts;
}

export function computeTickProduction(plots: PlotLike[]): ResourceDelta & { populationDelta: number } {
  const plotMap = new Map<string, PlotLike>();
  for (const p of plots) plotMap.set(`${p.x},${p.y}`, p);

  const districts = detectDistricts(plots);
  const districtBonusMap = new Map<string, number>();
  for (const district of districts) {
    for (const [dx, dy] of district.plots) {
      const key = `${dx},${dy}`;
      districtBonusMap.set(key, (districtBonusMap.get(key) || 0) + district.bonusPercent);
    }
  }

  let totalCoins = 0, totalWood = 0, totalStone = 0, totalPop = 0;

  for (const plot of plots) {
    if (!plot.building_type || plot.level === 0) continue;
    const def = BUILDING_DEFS[plot.building_type];
    if (!def) continue;

    const prod = def.production(plot.level);
    let coins = prod.coins;
    let wood = prod.wood;
    let stone = prod.stone;

    coins += parkAdjacencyBonus(plot, plotMap);

    const roadBonus = roadAdjacencyBonus(plot, plotMap);
    if (roadBonus > 0) {
      const m = 1 + roadBonus * 0.1;
      coins = Math.floor(coins * m);
      wood = Math.floor(wood * m);
      stone = Math.floor(stone * m);
    }

    const districtBonus = districtBonusMap.get(`${plot.x},${plot.y}`) || 0;
    if (districtBonus > 0) {
      const m = 1 + districtBonus / 100;
      coins = Math.floor(coins * m);
      wood = Math.floor(wood * m);
      stone = Math.floor(stone * m);
    }

    totalCoins += coins;
    totalWood += wood;
    totalStone += stone;
    totalPop += def.populationDelta(plot.level);
  }

  return { coins: totalCoins, wood: totalWood, stone: totalStone, populationDelta: totalPop };
}

export function canAfford(
  resources: { coins: number; wood: number; stone: number },
  c: ResourceCost
): boolean {
  return resources.coins >= c.coins && resources.wood >= c.wood && resources.stone >= c.stone;
}

export function isCooldownElapsed(lastChangedAt: string | Date): boolean {
  const changed = new Date(lastChangedAt).getTime();
  return Date.now() - changed >= PLOT_COOLDOWN_SECONDS * 1000;
}

export function getPlotDistrict(x: number, y: number, plots: Plot[]): District | null {
  const districts = detectDistricts(plots);
  for (const d of districts) {
    if (d.plots.some(([px, py]) => px === x && py === y)) return d;
  }
  return null;
}
