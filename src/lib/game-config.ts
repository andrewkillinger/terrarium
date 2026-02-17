// ============================================================
// Game Configuration – Eras, Milestones, Events, Districts
// ============================================================

import {
  Era,
  EraConfig,
  EventType,
  EventEffect,
  Milestone,
  MilestoneCheckState,
  DistrictType,
} from './types';

// ---- Era Definitions ----

export const ERA_CONFIG: Record<Era, EraConfig> = {
  village: {
    name: 'village',
    label: 'Village',
    minPopulation: 0,
    icon: '🏕️',
    colorAccent: '#8B7355',
    bgGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  },
  town: {
    name: 'town',
    label: 'Town',
    minPopulation: 50,
    icon: '🏘️',
    colorAccent: '#D4A574',
    bgGradient: 'linear-gradient(135deg, #1a1a2e 0%, #1e3a5f 100%)',
  },
  city: {
    name: 'city',
    label: 'City',
    minPopulation: 200,
    icon: '🏙️',
    colorAccent: '#4FC3F7',
    bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  },
  metropolis: {
    name: 'metropolis',
    label: 'Metropolis',
    minPopulation: 1000,
    icon: '🌆',
    colorAccent: '#FFD700',
    bgGradient: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 100%)',
  },
};

export const ERA_ORDER: Era[] = ['village', 'town', 'city', 'metropolis'];

export function getCurrentEra(population: number): Era {
  for (let i = ERA_ORDER.length - 1; i >= 0; i--) {
    if (population >= ERA_CONFIG[ERA_ORDER[i]].minPopulation) {
      return ERA_ORDER[i];
    }
  }
  return 'village';
}

// ---- Event Definitions ----

interface EventTemplate {
  type: EventType;
  title: string;
  description: string;
  effect: EventEffect;
  duration: number;
  weight: number;
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    type: 'trade_caravan',
    title: 'Trade Caravan Arrives!',
    description: 'Merchants from afar boost market income.',
    effect: { coinMultiplier: 2.0 },
    duration: 1,
    weight: 20,
  },
  {
    type: 'forest_fire',
    title: 'Forest Fire!',
    description: 'Flames reduce lumber production.',
    effect: { woodMultiplier: 0.5 },
    duration: 2,
    weight: 15,
  },
  {
    type: 'gold_rush',
    title: 'Gold Rush!',
    description: 'A gold vein discovered! Coin production soars.',
    effect: { coinMultiplier: 1.5 },
    duration: 2,
    weight: 15,
  },
  {
    type: 'storm',
    title: 'Great Storm!',
    description: 'A fierce storm slows all production.',
    effect: { coinMultiplier: 0.7, woodMultiplier: 0.7, stoneMultiplier: 0.7 },
    duration: 1,
    weight: 12,
  },
  {
    type: 'festival',
    title: 'Grand Festival!',
    description: 'Citizens celebrate! Free resources granted.',
    effect: { grantCoins: 100, grantWood: 50, grantStone: 50 },
    duration: 1,
    weight: 18,
  },
  {
    type: 'discovery',
    title: 'Ancient Discovery!',
    description: 'Archaeologists uncover hidden resources.',
    effect: { grantCoins: 200, grantStone: 100 },
    duration: 1,
    weight: 10,
  },
];

export function rollForEvent(tickNumber: number): EventTemplate | null {
  const seed = Math.sin(tickNumber * 9301 + 49297) * 49297;
  const rand = seed - Math.floor(seed);
  if (rand > 0.30) return null;

  const totalWeight = EVENT_TEMPLATES.reduce((s, e) => s + e.weight, 0);
  let roll = (rand / 0.30) * totalWeight;
  for (const template of EVENT_TEMPLATES) {
    roll -= template.weight;
    if (roll <= 0) return template;
  }
  return EVENT_TEMPLATES[0];
}

// ---- Milestone Definitions ----

export function createMilestones(): Milestone[] {
  return [
    {
      id: 'first_building',
      title: 'Foundation Stone',
      description: 'Place your first building',
      icon: '🧱',
      check: (s: MilestoneCheckState) => s.totalBuildings >= 1,
      achieved: false,
    },
    {
      id: 'pop_10',
      title: 'Small Gathering',
      description: 'Reach 10 population',
      icon: '👨‍👩‍👧',
      check: (s: MilestoneCheckState) => s.population >= 10,
      achieved: false,
    },
    {
      id: 'pop_50',
      title: 'Growing Community',
      description: 'Reach 50 population',
      icon: '👥',
      check: (s: MilestoneCheckState) => s.population >= 50,
      achieved: false,
    },
    {
      id: 'pop_100',
      title: 'Centurion Settlement',
      description: 'Reach 100 population',
      icon: '🏘️',
      check: (s: MilestoneCheckState) => s.population >= 100,
      achieved: false,
    },
    {
      id: 'pop_500',
      title: 'Thriving Town',
      description: 'Reach 500 population',
      icon: '🌇',
      check: (s: MilestoneCheckState) => s.population >= 500,
      achieved: false,
    },
    {
      id: 'pop_1000',
      title: 'Metropolis Rising',
      description: 'Reach 1000 population',
      icon: '🌆',
      check: (s: MilestoneCheckState) => s.population >= 1000,
      achieved: false,
    },
    {
      id: 'buildings_10',
      title: 'Builder',
      description: 'Place 10 buildings',
      icon: '🔨',
      check: (s: MilestoneCheckState) => s.totalBuildings >= 10,
      achieved: false,
    },
    {
      id: 'buildings_50',
      title: 'Master Builder',
      description: 'Place 50 buildings',
      icon: '🏗️',
      check: (s: MilestoneCheckState) => s.totalBuildings >= 50,
      achieved: false,
    },
    {
      id: 'buildings_100',
      title: 'Architect',
      description: 'Place 100 buildings',
      icon: '📐',
      check: (s: MilestoneCheckState) => s.totalBuildings >= 100,
      achieved: false,
    },
    {
      id: 'max_level',
      title: 'Perfection',
      description: 'Upgrade a building to max level',
      icon: '⭐',
      check: (s: MilestoneCheckState) => s.maxLevel >= 5,
      achieved: false,
    },
    {
      id: 'all_types',
      title: 'Diversified',
      description: 'Build every basic building type',
      icon: '🎨',
      check: (s: MilestoneCheckState) => {
        const basics = ['House', 'LumberMill', 'Quarry', 'Market', 'TownHall', 'Park'];
        return basics.every(t => (s.buildingCounts[t] || 0) > 0);
      },
      achieved: false,
    },
    {
      id: 'project_done',
      title: 'Community Spirit',
      description: 'Complete a community project',
      icon: '🤝',
      check: (s: MilestoneCheckState) => s.projectsCompleted >= 1,
      achieved: false,
    },
    {
      id: 'tick_100',
      title: 'Enduring City',
      description: 'Survive 100 ticks',
      icon: '⏳',
      check: (s: MilestoneCheckState) => s.tickNumber >= 100,
      achieved: false,
    },
  ];
}

// ---- District Detection ----

export interface DistrictRule {
  type: DistrictType;
  label: string;
  icon: string;
  requiredTypes: string[];
  minCluster: number;
  bonusPercent: number;
  description: string;
}

export const DISTRICT_RULES: DistrictRule[] = [
  {
    type: 'residential',
    label: 'Residential District',
    icon: '🏘️',
    requiredTypes: ['House'],
    minCluster: 3,
    bonusPercent: 20,
    description: '+20% coin production for Houses in district',
  },
  {
    type: 'industrial',
    label: 'Industrial Zone',
    icon: '🏭',
    requiredTypes: ['LumberMill', 'Quarry', 'Factory'],
    minCluster: 3,
    bonusPercent: 20,
    description: '+20% resource production in district',
  },
  {
    type: 'commercial',
    label: 'Market Square',
    icon: '🏪',
    requiredTypes: ['Market'],
    minCluster: 2,
    bonusPercent: 30,
    description: '+30% coin production for Markets in district',
  },
  {
    type: 'government',
    label: 'Government Quarter',
    icon: '🏛️',
    requiredTypes: ['TownHall', 'Cathedral'],
    minCluster: 2,
    bonusPercent: 15,
    description: '+15% all production in district',
  },
];

export const EVENT_VISUALS: Record<EventType, { icon: string; color: string }> = {
  trade_caravan: { icon: '🐪', color: '#D4A574' },
  forest_fire: { icon: '🔥', color: '#FF4444' },
  gold_rush: { icon: '💰', color: '#FFD700' },
  storm: { icon: '⛈️', color: '#6B7B8D' },
  festival: { icon: '🎉', color: '#FF69B4' },
  discovery: { icon: '🏺', color: '#9B59B6' },
};
