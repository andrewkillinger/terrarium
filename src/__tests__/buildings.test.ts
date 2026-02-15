import {
  BUILDING_DEFS,
  BUILDING_TYPES,
  canAfford,
  computeTickProduction,
  isCooldownElapsed,
  manhattanNeighbors,
  parkAdjacencyBonus,
  GRID_SIZE,
  PLOT_COOLDOWN_SECONDS,
  PlotLike,
} from '@/lib/buildings';

// ============================================================
// Building cost rules
// ============================================================

describe('Building cost rules', () => {
  it('all building types have increasing costs per level', () => {
    for (const type of BUILDING_TYPES) {
      const def = BUILDING_DEFS[type];
      for (let lvl = 1; lvl < def.maxLevel; lvl++) {
        const c1 = def.cost(lvl);
        const c2 = def.cost(lvl + 1);
        const total1 = c1.coins + c1.wood + c1.stone;
        const total2 = c2.coins + c2.wood + c2.stone;
        expect(total2).toBeGreaterThan(total1);
      }
    }
  });

  it('all building types have non-negative costs', () => {
    for (const type of BUILDING_TYPES) {
      const def = BUILDING_DEFS[type];
      for (let lvl = 1; lvl <= def.maxLevel; lvl++) {
        const c = def.cost(lvl);
        expect(c.coins).toBeGreaterThanOrEqual(0);
        expect(c.wood).toBeGreaterThanOrEqual(0);
        expect(c.stone).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('House level 1 costs are correct', () => {
    const c = BUILDING_DEFS.House.cost(1);
    expect(c).toEqual({ coins: 25, wood: 10, stone: 6 });
  });
});

// ============================================================
// Upgrade rules
// ============================================================

describe('Upgrade rules', () => {
  it('all buildings have maxLevel >= 1', () => {
    for (const type of BUILDING_TYPES) {
      expect(BUILDING_DEFS[type].maxLevel).toBeGreaterThanOrEqual(1);
    }
  });

  it('House maxLevel is 5', () => {
    expect(BUILDING_DEFS.House.maxLevel).toBe(5);
  });

  it('Market maxLevel is 3', () => {
    expect(BUILDING_DEFS.Market.maxLevel).toBe(3);
  });
});

// ============================================================
// canAfford
// ============================================================

describe('canAfford', () => {
  it('returns true when resources are sufficient', () => {
    expect(canAfford({ coins: 100, wood: 50, stone: 50 }, { coins: 25, wood: 10, stone: 6 })).toBe(true);
  });

  it('returns false when coins are insufficient', () => {
    expect(canAfford({ coins: 10, wood: 50, stone: 50 }, { coins: 25, wood: 10, stone: 6 })).toBe(false);
  });

  it('returns false when wood is insufficient', () => {
    expect(canAfford({ coins: 100, wood: 5, stone: 50 }, { coins: 25, wood: 10, stone: 6 })).toBe(false);
  });

  it('returns true when resources exactly match cost', () => {
    expect(canAfford({ coins: 25, wood: 10, stone: 6 }, { coins: 25, wood: 10, stone: 6 })).toBe(true);
  });
});

// ============================================================
// Tick production
// ============================================================

describe('computeTickProduction', () => {
  it('empty grid produces nothing', () => {
    const plots: PlotLike[] = [
      { x: 0, y: 0, building_type: null, level: 0 },
    ];
    const result = computeTickProduction(plots);
    expect(result.coins).toBe(0);
    expect(result.wood).toBe(0);
    expect(result.stone).toBe(0);
    expect(result.populationDelta).toBe(0);
  });

  it('single House level 1 produces coins', () => {
    const plots: PlotLike[] = [
      { x: 0, y: 0, building_type: 'House', level: 1 },
    ];
    const result = computeTickProduction(plots);
    expect(result.coins).toBe(2); // 2 * level = 2
    expect(result.populationDelta).toBe(3); // 2 + level = 3
  });

  it('single LumberMill level 2 produces wood', () => {
    const plots: PlotLike[] = [
      { x: 5, y: 5, building_type: 'LumberMill', level: 2 },
    ];
    const result = computeTickProduction(plots);
    expect(result.wood).toBe(7); // 3 + 2*2 = 7
    expect(result.coins).toBe(0);
    expect(result.stone).toBe(0);
  });

  it('single Quarry level 3 produces stone', () => {
    const plots: PlotLike[] = [
      { x: 5, y: 5, building_type: 'Quarry', level: 3 },
    ];
    const result = computeTickProduction(plots);
    expect(result.stone).toBe(9); // 3 + 2*3 = 9
  });

  it('multiple buildings sum their production', () => {
    const plots: PlotLike[] = [
      { x: 0, y: 0, building_type: 'House', level: 1 },
      { x: 1, y: 0, building_type: 'LumberMill', level: 1 },
      { x: 2, y: 0, building_type: 'Quarry', level: 1 },
    ];
    const result = computeTickProduction(plots);
    expect(result.coins).toBe(2); // House lvl1
    expect(result.wood).toBe(5); // LumberMill lvl1: 3 + 2*1 = 5
    expect(result.stone).toBe(5); // Quarry lvl1: 3 + 2*1 = 5
  });

  it('TownHall produces all resource types', () => {
    const plots: PlotLike[] = [
      { x: 0, y: 0, building_type: 'TownHall', level: 2 },
    ];
    const result = computeTickProduction(plots);
    expect(result.coins).toBe(6); // 3*2
    expect(result.wood).toBe(4); // 2*2
    expect(result.stone).toBe(4); // 2*2
    expect(result.populationDelta).toBe(9); // 5 + 2*2
  });
});

// ============================================================
// Park adjacency bonus
// ============================================================

describe('parkAdjacencyBonus', () => {
  it('no bonus when no parks adjacent', () => {
    const plots: PlotLike[] = [
      { x: 5, y: 5, building_type: 'House', level: 1 },
      { x: 5, y: 6, building_type: 'LumberMill', level: 1 },
    ];
    const plotMap = new Map(plots.map((p) => [`${p.x},${p.y}`, p]));
    const house = plots[0];
    expect(parkAdjacencyBonus(house, plotMap)).toBe(0);
  });

  it('House gets bonus from adjacent Park', () => {
    const plots: PlotLike[] = [
      { x: 5, y: 5, building_type: 'House', level: 1 },
      { x: 5, y: 6, building_type: 'Park', level: 1 },
    ];
    const plotMap = new Map(plots.map((p) => [`${p.x},${p.y}`, p]));
    const house = plots[0];
    // baseCoins = 2*1 = 2, parkLevels = 1, bonus = floor(2 * 0.5 * 1) = 1
    expect(parkAdjacencyBonus(house, plotMap)).toBe(1);
  });

  it('House gets bonus from multiple adjacent Parks', () => {
    const plots: PlotLike[] = [
      { x: 5, y: 5, building_type: 'House', level: 2 },
      { x: 5, y: 6, building_type: 'Park', level: 1 },
      { x: 4, y: 5, building_type: 'Park', level: 2 },
      { x: 6, y: 5, building_type: 'Park', level: 1 },
    ];
    const plotMap = new Map(plots.map((p) => [`${p.x},${p.y}`, p]));
    const house = plots[0];
    // baseCoins = 2*2 = 4, parkLevels = 1+2+1 = 4, bonus = floor(4 * 0.5 * 4) = 8
    expect(parkAdjacencyBonus(house, plotMap)).toBe(8);
  });

  it('non-House building gets no park bonus', () => {
    const plots: PlotLike[] = [
      { x: 5, y: 5, building_type: 'LumberMill', level: 1 },
      { x: 5, y: 6, building_type: 'Park', level: 1 },
    ];
    const plotMap = new Map(plots.map((p) => [`${p.x},${p.y}`, p]));
    expect(parkAdjacencyBonus(plots[0], plotMap)).toBe(0);
  });

  it('park bonus is included in tick production', () => {
    const plots: PlotLike[] = [
      { x: 5, y: 5, building_type: 'House', level: 1 },
      { x: 5, y: 6, building_type: 'Park', level: 1 },
    ];
    const result = computeTickProduction(plots);
    // House base coins: 2, park bonus: 1, total: 3
    expect(result.coins).toBe(3);
  });

  it('diagonal parks do NOT give bonus (Manhattan distance > 1)', () => {
    const plots: PlotLike[] = [
      { x: 5, y: 5, building_type: 'House', level: 1 },
      { x: 6, y: 6, building_type: 'Park', level: 3 },
    ];
    const plotMap = new Map(plots.map((p) => [`${p.x},${p.y}`, p]));
    expect(parkAdjacencyBonus(plots[0], plotMap)).toBe(0);
  });
});

// ============================================================
// Plot cooldown
// ============================================================

describe('isCooldownElapsed', () => {
  it('returns true for timestamps older than cooldown period', () => {
    const old = new Date(Date.now() - (PLOT_COOLDOWN_SECONDS + 10) * 1000).toISOString();
    expect(isCooldownElapsed(old)).toBe(true);
  });

  it('returns false for recent timestamps', () => {
    const recent = new Date(Date.now() - 10 * 1000).toISOString();
    expect(isCooldownElapsed(recent)).toBe(false);
  });

  it('returns true for exactly the cooldown period', () => {
    const exact = new Date(Date.now() - PLOT_COOLDOWN_SECONDS * 1000).toISOString();
    expect(isCooldownElapsed(exact)).toBe(true);
  });
});

// ============================================================
// Manhattan neighbors
// ============================================================

describe('manhattanNeighbors', () => {
  it('interior cell has 4 neighbors', () => {
    expect(manhattanNeighbors(15, 15).length).toBe(4);
  });

  it('corner (0,0) has 2 neighbors', () => {
    expect(manhattanNeighbors(0, 0).length).toBe(2);
  });

  it('edge cell has 3 neighbors', () => {
    expect(manhattanNeighbors(0, 15).length).toBe(3);
  });

  it('corner (max,max) has 2 neighbors', () => {
    expect(manhattanNeighbors(GRID_SIZE - 1, GRID_SIZE - 1).length).toBe(2);
  });
});

// ============================================================
// Rate limiting logic (unit test of timing check)
// ============================================================

describe('Rate limiting logic', () => {
  const CHAT_RATE_LIMIT_MS = 3000;

  function isRateLimited(lastMessageTime: number, now: number): boolean {
    return now - lastMessageTime < CHAT_RATE_LIMIT_MS;
  }

  it('blocks messages sent too quickly', () => {
    const now = Date.now();
    const lastMsg = now - 1000; // 1 second ago
    expect(isRateLimited(lastMsg, now)).toBe(true);
  });

  it('allows messages after rate limit period', () => {
    const now = Date.now();
    const lastMsg = now - 4000; // 4 seconds ago
    expect(isRateLimited(lastMsg, now)).toBe(false);
  });

  it('blocks at exactly 3 seconds', () => {
    const now = Date.now();
    const lastMsg = now - 2999;
    expect(isRateLimited(lastMsg, now)).toBe(true);
  });

  it('allows at exactly 3 seconds elapsed', () => {
    const now = Date.now();
    const lastMsg = now - 3000;
    expect(isRateLimited(lastMsg, now)).toBe(false);
  });
});
