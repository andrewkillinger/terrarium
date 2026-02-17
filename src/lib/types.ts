// ============================================================
// Shared City Builder – Core Types
// ============================================================

export type BuildingType =
  | 'House' | 'LumberMill' | 'Quarry' | 'Market' | 'TownHall' | 'Park'
  | 'Factory' | 'Cathedral' | 'Harbor' | 'Road';

export interface BuildingDef {
  type: BuildingType;
  label: string;
  emoji: string;
  maxLevel: number;
  cost: (level: number) => ResourceCost;
  production: (level: number) => ResourceDelta;
  populationDelta: (level: number) => number;
  description: string;
  unlockPopulation?: number;
}

export interface ResourceCost {
  coins: number;
  wood: number;
  stone: number;
}

export interface ResourceDelta {
  coins: number;
  wood: number;
  stone: number;
}

export interface Plot {
  id: string;
  x: number;
  y: number;
  building_type: BuildingType | null;
  level: number;
  placed_by_user_id: string | null;
  updated_at: string;
  last_changed_at: string;
  protected: boolean;
}

export interface CityState {
  id: number;
  coins: number;
  wood: number;
  stone: number;
  population: number;
  tick_number: number;
  updated_at: string;
}

export interface ActionLog {
  id: string;
  user_id: string | null;
  action_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  project_type: 'resource_goal' | 'vote';
  status: 'active' | 'completed' | 'failed';
  goal_coins: number;
  goal_wood: number;
  goal_stone: number;
  contributed_coins: number;
  contributed_wood: number;
  contributed_stone: number;
  vote_threshold: number;
  vote_count: number;
  reward_description: string;
  deadline: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface Vote {
  id: string;
  project_id: string;
  user_id: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  deleted: boolean;
  created_at: string;
}

export interface ChatReport {
  id: string;
  message_id: string;
  reporter_user_id: string;
  reason: string;
  created_at: string;
}

export interface ProjectContribution {
  id: string;
  project_id: string;
  user_id: string;
  coins: number;
  wood: number;
  stone: number;
  created_at: string;
}

export interface AppSetting {
  key: string;
  value: Record<string, unknown>;
}

// API response types
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ============================================================
// New Game Systems
// ============================================================

export type Era = 'village' | 'town' | 'city' | 'metropolis';

export interface EraConfig {
  name: string;
  label: string;
  minPopulation: number;
  icon: string;
  colorAccent: string;
  bgGradient: string;
}

export interface GameEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  effect: EventEffect;
  startTick: number;
  duration: number;
  active: boolean;
}

export type EventType =
  | 'trade_caravan'
  | 'forest_fire'
  | 'gold_rush'
  | 'storm'
  | 'festival'
  | 'discovery';

export interface EventEffect {
  coinMultiplier?: number;
  woodMultiplier?: number;
  stoneMultiplier?: number;
  grantCoins?: number;
  grantWood?: number;
  grantStone?: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  check: (state: MilestoneCheckState) => boolean;
  achieved: boolean;
  achievedAt?: string;
}

export interface MilestoneCheckState {
  population: number;
  totalBuildings: number;
  buildingCounts: Record<string, number>;
  maxLevel: number;
  tickNumber: number;
  projectsCompleted: number;
}

export type DistrictType = 'residential' | 'industrial' | 'commercial' | 'government';

export interface District {
  type: DistrictType;
  plots: [number, number][];
  bonusPercent: number;
}

export interface TickNotificationData {
  coins: number;
  wood: number;
  stone: number;
  population: number;
  event?: GameEvent;
}
