// ============================================================
// Local Game Engine – runs entirely in the browser with localStorage
// ============================================================

import { Plot, CityState, Project, ChatMessage, ActionLog, BuildingType, GameEvent, Milestone, MilestoneCheckState, Era } from './types';
import {
  BUILDING_DEFS,
  GRID_SIZE,
  computeTickProduction,
  canAfford,
  PLOT_COOLDOWN_SECONDS,
  TICK_INTERVAL_MINUTES,
  CHAT_MAX_LENGTH,
} from './buildings';
import { rollForEvent, createMilestones, getCurrentEra } from './game-config';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'city_builder_state';

export interface LocalGameData {
  plots: Plot[];
  cityState: CityState;
  projects: Project[];
  chatMessages: ChatMessage[];
  actionsLog: ActionLog[];
  userId: string;
  lastTickTime: number;
  // New game systems
  milestones: Milestone[];
  activeEvents: GameEvent[];
  era: Era;
  lastPlacedPlot?: { x: number; y: number; tick: number };
  lastUpgradedPlot?: { x: number; y: number; tick: number };
}

function generateUserId(): string {
  if (typeof window === 'undefined') return uuidv4();
  const stored = localStorage.getItem('city_builder_user_id');
  if (stored) return stored;
  const id = uuidv4();
  localStorage.setItem('city_builder_user_id', id);
  return id;
}

function createEmptyGrid(): Plot[] {
  const plots: Plot[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      plots.push({
        id: `${x}-${y}`,
        x,
        y,
        building_type: null,
        level: 0,
        placed_by_user_id: null,
        updated_at: new Date().toISOString(),
        last_changed_at: new Date(0).toISOString(),
        protected: false,
      });
    }
  }
  return plots;
}

function createInitialCityState(): CityState {
  return {
    id: 1,
    coins: 500,
    wood: 300,
    stone: 200,
    population: 0,
    tick_number: 0,
    updated_at: new Date().toISOString(),
  };
}

function createSeedProjects(): Project[] {
  return [
    {
      id: uuidv4(),
      title: 'Build the Town Square',
      description: 'Contribute resources to establish a central gathering place for the city.',
      project_type: 'resource_goal',
      status: 'active',
      goal_coins: 200,
      goal_wood: 100,
      goal_stone: 100,
      contributed_coins: 0,
      contributed_wood: 0,
      contributed_stone: 0,
      vote_threshold: 0,
      vote_count: 0,
      reward_description: 'Unlocks the town square landmark!',
      deadline: null,
      created_at: new Date().toISOString(),
      completed_at: null,
    },
    {
      id: uuidv4(),
      title: 'Expand the City Walls',
      description: 'Vote to approve expanding the city defensive walls.',
      project_type: 'vote',
      status: 'active',
      goal_coins: 0,
      goal_wood: 0,
      goal_stone: 0,
      contributed_coins: 0,
      contributed_wood: 0,
      contributed_stone: 0,
      vote_threshold: 3,
      vote_count: 0,
      reward_description: 'City walls will be expanded!',
      deadline: null,
      created_at: new Date().toISOString(),
      completed_at: null,
    },
  ];
}

export function loadGame(): LocalGameData {
  if (typeof window === 'undefined') return createFreshGame();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as LocalGameData;
      if (data.plots && data.cityState && data.userId) {
        // Migrate: add new fields if missing
        if (!data.milestones) data.milestones = createMilestones();
        if (!data.activeEvents) data.activeEvents = [];
        if (!data.era) data.era = getCurrentEra(data.cityState.population);
        return data;
      }
    }
  } catch {
    // Corrupted data, start fresh
  }

  return createFreshGame();
}

function createFreshGame(): LocalGameData {
  const data: LocalGameData = {
    plots: createEmptyGrid(),
    cityState: createInitialCityState(),
    projects: createSeedProjects(),
    chatMessages: [],
    actionsLog: [],
    userId: generateUserId(),
    lastTickTime: Date.now(),
    milestones: createMilestones(),
    activeEvents: [],
    era: 'village',
  };
  saveGame(data);
  return data;
}

export function saveGame(data: LocalGameData): void {
  if (typeof window === 'undefined') return;
  try {
    // Strip non-serializable milestone check functions before saving
    const toSave = {
      ...data,
      milestones: data.milestones.map(m => ({
        id: m.id,
        title: m.title,
        description: m.description,
        icon: m.icon,
        achieved: m.achieved,
        achievedAt: m.achievedAt,
      })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Storage full
  }
}

// Restore milestone check functions from config
function hydrateMilestones(saved: Partial<Milestone>[]): Milestone[] {
  const templates = createMilestones();
  return templates.map(template => {
    const existing = saved.find(m => m.id === template.id);
    if (existing) {
      return { ...template, achieved: existing.achieved || false, achievedAt: existing.achievedAt };
    }
    return template;
  });
}

// ---- Milestone checking ----

function getMilestoneCheckState(data: LocalGameData): MilestoneCheckState {
  const buildingCounts: Record<string, number> = {};
  let totalBuildings = 0;
  let maxLevel = 0;

  for (const p of data.plots) {
    if (p.building_type && p.level > 0) {
      buildingCounts[p.building_type] = (buildingCounts[p.building_type] || 0) + 1;
      totalBuildings++;
      if (p.level > maxLevel) maxLevel = p.level;
    }
  }

  const projectsCompleted = data.projects.filter(p => p.status === 'completed').length;

  return {
    population: data.cityState.population,
    totalBuildings,
    buildingCounts,
    maxLevel,
    tickNumber: data.cityState.tick_number,
    projectsCompleted,
  };
}

export function checkMilestones(data: LocalGameData): Milestone[] {
  // Ensure milestones have check functions
  if (!data.milestones[0]?.check) {
    data.milestones = hydrateMilestones(data.milestones);
  }

  const state = getMilestoneCheckState(data);
  const newlyAchieved: Milestone[] = [];

  for (const milestone of data.milestones) {
    if (milestone.achieved) continue;
    if (milestone.check && milestone.check(state)) {
      milestone.achieved = true;
      milestone.achievedAt = new Date().toISOString();
      newlyAchieved.push(milestone);
    }
  }

  return newlyAchieved;
}

// ---- Game Actions ----

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export function placeBuilding(
  data: LocalGameData,
  x: number,
  y: number,
  buildingType: BuildingType
): ActionResult {
  const plot = data.plots.find((p) => p.x === x && p.y === y);
  if (!plot) return { ok: false, error: 'Plot not found' };
  if (plot.building_type !== null) return { ok: false, error: 'Plot is not empty' };
  if (plot.protected) return { ok: false, error: 'Plot is protected' };

  const elapsed = Date.now() - new Date(plot.last_changed_at).getTime();
  if (elapsed < PLOT_COOLDOWN_SECONDS * 1000) {
    const remaining = Math.ceil((PLOT_COOLDOWN_SECONDS * 1000 - elapsed) / 1000);
    return { ok: false, error: `Cooldown: ${remaining}s remaining` };
  }

  // Check unlock requirement
  const def = BUILDING_DEFS[buildingType];
  if (def.unlockPopulation && data.cityState.population < def.unlockPopulation) {
    return { ok: false, error: `Requires ${def.unlockPopulation} population to unlock` };
  }

  const buildCost = def.cost(1);
  if (!canAfford(data.cityState, buildCost)) {
    return { ok: false, error: 'Not enough resources' };
  }

  data.cityState.coins -= buildCost.coins;
  data.cityState.wood -= buildCost.wood;
  data.cityState.stone -= buildCost.stone;
  data.cityState.updated_at = new Date().toISOString();

  const now = new Date().toISOString();
  plot.building_type = buildingType;
  plot.level = 1;
  plot.placed_by_user_id = data.userId;
  plot.updated_at = now;
  plot.last_changed_at = now;

  data.lastPlacedPlot = { x, y, tick: data.cityState.tick_number };

  data.actionsLog.unshift({
    id: uuidv4(),
    user_id: data.userId,
    action_type: 'place',
    payload: { x, y, building_type: buildingType },
    created_at: now,
  });
  data.actionsLog = data.actionsLog.slice(0, 50);

  // Check milestones after placement
  checkMilestones(data);

  // Update era
  const production = computeTickProduction(data.plots);
  data.cityState.population = production.populationDelta;
  data.era = getCurrentEra(data.cityState.population);

  saveGame(data);
  return { ok: true };
}

export function upgradeBuilding(
  data: LocalGameData,
  x: number,
  y: number
): ActionResult {
  const plot = data.plots.find((p) => p.x === x && p.y === y);
  if (!plot) return { ok: false, error: 'Plot not found' };
  if (!plot.building_type) return { ok: false, error: 'No building to upgrade' };
  if (plot.protected) return { ok: false, error: 'Plot is protected' };

  const def = BUILDING_DEFS[plot.building_type];
  const nextLevel = plot.level + 1;
  if (nextLevel > def.maxLevel) return { ok: false, error: 'Already at max level' };

  const upgradeCost = def.cost(nextLevel);
  if (!canAfford(data.cityState, upgradeCost)) {
    return { ok: false, error: 'Not enough resources' };
  }

  data.cityState.coins -= upgradeCost.coins;
  data.cityState.wood -= upgradeCost.wood;
  data.cityState.stone -= upgradeCost.stone;
  data.cityState.updated_at = new Date().toISOString();

  const now = new Date().toISOString();
  plot.level = nextLevel;
  plot.updated_at = now;

  data.lastUpgradedPlot = { x, y, tick: data.cityState.tick_number };

  data.actionsLog.unshift({
    id: uuidv4(),
    user_id: data.userId,
    action_type: 'upgrade',
    payload: { x, y, building_type: plot.building_type, from_level: plot.level - 1, to_level: nextLevel },
    created_at: now,
  });
  data.actionsLog = data.actionsLog.slice(0, 50);

  checkMilestones(data);

  const production = computeTickProduction(data.plots);
  data.cityState.population = production.populationDelta;
  data.era = getCurrentEra(data.cityState.population);

  saveGame(data);
  return { ok: true };
}

export function processTick(data: LocalGameData): { production: { coins: number; wood: number; stone: number; populationDelta: number }; event?: GameEvent } {
  const production = computeTickProduction(data.plots);

  let coins = production.coins;
  let wood = production.wood;
  let stone = production.stone;

  // Roll for event
  const eventTemplate = rollForEvent(data.cityState.tick_number + 1);
  let event: GameEvent | undefined;

  if (eventTemplate) {
    event = {
      id: uuidv4(),
      type: eventTemplate.type,
      title: eventTemplate.title,
      description: eventTemplate.description,
      effect: eventTemplate.effect,
      startTick: data.cityState.tick_number + 1,
      duration: eventTemplate.duration,
      active: true,
    };
    data.activeEvents.push(event);

    // Apply event effects
    if (eventTemplate.effect.coinMultiplier) coins = Math.floor(coins * eventTemplate.effect.coinMultiplier);
    if (eventTemplate.effect.woodMultiplier) wood = Math.floor(wood * eventTemplate.effect.woodMultiplier);
    if (eventTemplate.effect.stoneMultiplier) stone = Math.floor(stone * eventTemplate.effect.stoneMultiplier);
    if (eventTemplate.effect.grantCoins) coins += eventTemplate.effect.grantCoins;
    if (eventTemplate.effect.grantWood) wood += eventTemplate.effect.grantWood;
    if (eventTemplate.effect.grantStone) stone += eventTemplate.effect.grantStone;
  }

  // Apply ongoing events
  data.activeEvents = data.activeEvents.filter(e => {
    if (e === event) return true; // Already applied above
    const ticksSinceStart = (data.cityState.tick_number + 1) - e.startTick;
    return ticksSinceStart < e.duration;
  });

  data.cityState.coins += coins;
  data.cityState.wood += wood;
  data.cityState.stone += stone;
  data.cityState.population = production.populationDelta;
  data.cityState.tick_number += 1;
  data.cityState.updated_at = new Date().toISOString();
  data.lastTickTime = Date.now();

  // Update era
  data.era = getCurrentEra(data.cityState.population);

  data.actionsLog.unshift({
    id: uuidv4(),
    user_id: null,
    action_type: 'tick',
    payload: {
      tick_number: data.cityState.tick_number,
      production: { coins, wood, stone },
      event: event ? { type: event.type, title: event.title } : undefined,
    },
    created_at: new Date().toISOString(),
  });
  data.actionsLog = data.actionsLog.slice(0, 50);

  checkProjects(data);
  checkMilestones(data);

  saveGame(data);

  return { production: { coins, wood, stone, populationDelta: production.populationDelta }, event };
}

function checkProjects(data: LocalGameData): void {
  for (const project of data.projects) {
    if (project.status !== 'active') continue;

    let completed = false;
    if (project.project_type === 'resource_goal') {
      completed =
        project.contributed_coins >= project.goal_coins &&
        project.contributed_wood >= project.goal_wood &&
        project.contributed_stone >= project.goal_stone;
    } else if (project.project_type === 'vote') {
      completed = project.vote_count >= project.vote_threshold;
    }

    if (completed) {
      project.status = 'completed';
      project.completed_at = new Date().toISOString();
    }
  }
}

export function sendChatMessage(data: LocalGameData, content: string): ActionResult {
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: 'Message cannot be empty' };
  if (trimmed.length > CHAT_MAX_LENGTH) return { ok: false, error: `Max ${CHAT_MAX_LENGTH} chars` };

  const lastMsg = data.chatMessages[data.chatMessages.length - 1];
  if (lastMsg && lastMsg.user_id === data.userId) {
    const elapsed = Date.now() - new Date(lastMsg.created_at).getTime();
    if (elapsed < 3000) {
      const remaining = Math.ceil((3000 - elapsed) / 1000);
      return { ok: false, error: `Wait ${remaining}s` };
    }
  }

  data.chatMessages.push({
    id: uuidv4(),
    user_id: data.userId,
    content: trimmed,
    deleted: false,
    created_at: new Date().toISOString(),
  });
  if (data.chatMessages.length > 200) {
    data.chatMessages = data.chatMessages.slice(-200);
  }

  saveGame(data);
  return { ok: true };
}

export function voteProject(data: LocalGameData, projectId: string): ActionResult {
  const project = data.projects.find((p) => p.id === projectId);
  if (!project) return { ok: false, error: 'Project not found' };
  if (project.status !== 'active') return { ok: false, error: 'Project is not active' };

  project.vote_count += 1;

  data.actionsLog.unshift({
    id: uuidv4(),
    user_id: data.userId,
    action_type: 'vote',
    payload: { project_id: projectId },
    created_at: new Date().toISOString(),
  });
  data.actionsLog = data.actionsLog.slice(0, 50);

  checkProjects(data);
  saveGame(data);
  return { ok: true };
}

export function contributeToProject(
  data: LocalGameData,
  projectId: string,
  coins: number,
  wood: number,
  stone: number
): ActionResult {
  const project = data.projects.find((p) => p.id === projectId);
  if (!project || project.status !== 'active') {
    return { ok: false, error: 'Project not found or not active' };
  }

  const c = Math.max(0, Math.floor(coins));
  const w = Math.max(0, Math.floor(wood));
  const s = Math.max(0, Math.floor(stone));

  if (c + w + s === 0) return { ok: false, error: 'Must contribute something' };

  if (data.cityState.coins < c || data.cityState.wood < w || data.cityState.stone < s) {
    return { ok: false, error: 'Not enough resources' };
  }

  data.cityState.coins -= c;
  data.cityState.wood -= w;
  data.cityState.stone -= s;
  data.cityState.updated_at = new Date().toISOString();

  project.contributed_coins += c;
  project.contributed_wood += w;
  project.contributed_stone += s;

  data.actionsLog.unshift({
    id: uuidv4(),
    user_id: data.userId,
    action_type: 'contribute',
    payload: { project_id: projectId, coins: c, wood: w, stone: s },
    created_at: new Date().toISOString(),
  });
  data.actionsLog = data.actionsLog.slice(0, 50);

  checkProjects(data);
  saveGame(data);
  return { ok: true };
}

export function getTickCountdown(data: LocalGameData): number {
  const tickMs = TICK_INTERVAL_MINUTES * 60 * 1000;
  const elapsed = Date.now() - data.lastTickTime;
  return Math.max(0, Math.ceil((tickMs - elapsed) / 1000));
}

export function shouldTick(data: LocalGameData): boolean {
  const tickMs = TICK_INTERVAL_MINUTES * 60 * 1000;
  return Date.now() - data.lastTickTime >= tickMs;
}
