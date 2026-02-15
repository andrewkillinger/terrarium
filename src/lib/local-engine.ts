// ============================================================
// Local Game Engine – runs entirely in the browser with localStorage
// ============================================================

import { Plot, CityState, Project, ChatMessage, ActionLog, BuildingType } from './types';
import {
  BUILDING_DEFS,
  GRID_SIZE,
  computeTickProduction,
  canAfford,
  PLOT_COOLDOWN_SECONDS,
  TICK_INTERVAL_MINUTES,
  CHAT_MAX_LENGTH,
} from './buildings';
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
  if (typeof window === 'undefined') {
    return createFreshGame();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as LocalGameData;
      // Validate basic structure
      if (data.plots && data.cityState && data.userId) {
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
  };
  saveGame(data);
  return data;
}

export function saveGame(data: LocalGameData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full — silently fail
  }
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

  // Check cooldown
  const elapsed = Date.now() - new Date(plot.last_changed_at).getTime();
  if (elapsed < PLOT_COOLDOWN_SECONDS * 1000) {
    const remaining = Math.ceil((PLOT_COOLDOWN_SECONDS * 1000 - elapsed) / 1000);
    return { ok: false, error: `Cooldown: ${remaining}s remaining` };
  }

  const def = BUILDING_DEFS[buildingType];
  const cost = def.cost(1);

  if (!canAfford(data.cityState, cost)) {
    return { ok: false, error: 'Not enough resources' };
  }

  // Deduct resources
  data.cityState.coins -= cost.coins;
  data.cityState.wood -= cost.wood;
  data.cityState.stone -= cost.stone;
  data.cityState.updated_at = new Date().toISOString();

  // Place building
  const now = new Date().toISOString();
  plot.building_type = buildingType;
  plot.level = 1;
  plot.placed_by_user_id = data.userId;
  plot.updated_at = now;
  plot.last_changed_at = now;

  // Log action
  data.actionsLog.unshift({
    id: uuidv4(),
    user_id: data.userId,
    action_type: 'place',
    payload: { x, y, building_type: buildingType },
    created_at: now,
  });
  data.actionsLog = data.actionsLog.slice(0, 50);

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

  const cost = def.cost(nextLevel);
  if (!canAfford(data.cityState, cost)) {
    return { ok: false, error: 'Not enough resources' };
  }

  data.cityState.coins -= cost.coins;
  data.cityState.wood -= cost.wood;
  data.cityState.stone -= cost.stone;
  data.cityState.updated_at = new Date().toISOString();

  const now = new Date().toISOString();
  plot.level = nextLevel;
  plot.updated_at = now;

  data.actionsLog.unshift({
    id: uuidv4(),
    user_id: data.userId,
    action_type: 'upgrade',
    payload: { x, y, building_type: plot.building_type, from_level: plot.level - 1, to_level: nextLevel },
    created_at: now,
  });
  data.actionsLog = data.actionsLog.slice(0, 50);

  saveGame(data);
  return { ok: true };
}

export function processTick(data: LocalGameData): void {
  const production = computeTickProduction(data.plots);

  data.cityState.coins += production.coins;
  data.cityState.wood += production.wood;
  data.cityState.stone += production.stone;
  data.cityState.population = production.populationDelta;
  data.cityState.tick_number += 1;
  data.cityState.updated_at = new Date().toISOString();
  data.lastTickTime = Date.now();

  data.actionsLog.unshift({
    id: uuidv4(),
    user_id: null,
    action_type: 'tick',
    payload: { tick_number: data.cityState.tick_number, production },
    created_at: new Date().toISOString(),
  });
  data.actionsLog = data.actionsLog.slice(0, 50);

  // Check project completion
  checkProjects(data);

  saveGame(data);
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

  // Rate limit
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
  // Keep last 200
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
