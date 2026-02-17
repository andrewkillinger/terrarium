'use client';

import { Plot, CityState, BuildingType, Milestone, Era } from '@/lib/types';
import { BUILDING_DEFS, BUILDING_TYPES, computeTickProduction, detectDistricts } from '@/lib/buildings';
import { ERA_CONFIG, DISTRICT_RULES } from '@/lib/game-config';

interface StatsPanelProps {
  plots: Plot[];
  cityState: CityState | null;
  milestones: Milestone[];
  era: Era;
}

export default function StatsPanel({ plots, cityState, milestones, era }: StatsPanelProps) {
  if (!cityState) return null;

  const eraConfig = ERA_CONFIG[era];

  // Count buildings
  const buildingCounts = new Map<string, number>();
  let totalBuildings = 0;
  for (const p of plots) {
    if (p.building_type) {
      buildingCounts.set(p.building_type, (buildingCounts.get(p.building_type) || 0) + 1);
      totalBuildings++;
    }
  }

  // Compute per-tick production
  const production = computeTickProduction(plots);

  // Detect districts
  const districts = detectDistricts(plots);

  // Milestone stats
  const achieved = milestones.filter(m => m.achieved);
  const remaining = milestones.filter(m => !m.achieved);

  return (
    <div className="h-full overflow-y-auto p-3 space-y-3">
      {/* Era Banner */}
      <div
        className="rounded-xl p-4 text-center"
        style={{ background: eraConfig.bgGradient, border: `1px solid ${eraConfig.colorAccent}33` }}
      >
        <span className="text-3xl">{eraConfig.icon}</span>
        <div className="text-lg font-bold mt-1" style={{ color: eraConfig.colorAccent }}>
          {eraConfig.label} Era
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          Population: {cityState.population.toLocaleString()}
        </div>
      </div>

      {/* Resources */}
      <div className="bg-gray-800/80 rounded-xl p-4">
        <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Treasury</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">🪙 Coins</span>
            <span className="text-yellow-300 font-mono font-bold">{cityState.coins.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">🪵 Wood</span>
            <span className="text-green-300 font-mono font-bold">{cityState.wood.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">🪨 Stone</span>
            <span className="text-gray-300 font-mono font-bold">{cityState.stone.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">👥 Citizens</span>
            <span className="font-mono font-bold" style={{ color: eraConfig.colorAccent }}>
              {cityState.population.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Per-tick production */}
      <div className="bg-gray-800/80 rounded-xl p-4">
        <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Per Tick Production</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">🪙 Coins</span>
            <span className="text-green-400 font-mono font-bold">+{production.coins}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">🪵 Wood</span>
            <span className="text-green-400 font-mono font-bold">+{production.wood}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">🪨 Stone</span>
            <span className="text-green-400 font-mono font-bold">+{production.stone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">👥 Pop</span>
            <span className="text-green-400 font-mono font-bold">+{production.populationDelta}</span>
          </div>
        </div>
      </div>

      {/* Building counts - only show non-zero */}
      <div className="bg-gray-800/80 rounded-xl p-4">
        <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
          Buildings ({totalBuildings}/{plots.length} plots)
        </h3>
        <div className="space-y-1 text-sm">
          {BUILDING_TYPES.filter(type => (buildingCounts.get(type) || 0) > 0).map((type) => {
            const count = buildingCounts.get(type) || 0;
            const def = BUILDING_DEFS[type as BuildingType];
            return (
              <div key={type} className="flex justify-between">
                <span className="text-gray-400">
                  {def.emoji} {def.label}
                </span>
                <span className="text-white font-mono">{count}</span>
              </div>
            );
          })}
          {totalBuildings === 0 && (
            <div className="text-gray-500 text-xs">No buildings placed yet.</div>
          )}
        </div>
      </div>

      {/* Active Districts */}
      {districts.length > 0 && (
        <div className="bg-gray-800/80 rounded-xl p-4">
          <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
            Active Districts ({districts.length})
          </h3>
          <div className="space-y-2">
            {districts.map((district, i) => {
              const rule = DISTRICT_RULES.find(r => r.type === district.type);
              return (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span>{rule?.icon}</span>
                  <div className="flex-1">
                    <div className="text-white font-medium">{rule?.label}</div>
                    <div className="text-gray-500 text-xs">{district.plots.length} plots &middot; +{district.bonusPercent}% bonus</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Milestones */}
      <div className="bg-gray-800/80 rounded-xl p-4">
        <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
          Milestones ({achieved.length}/{milestones.length})
        </h3>
        <div className="space-y-1.5">
          {achieved.map(m => (
            <div key={m.id} className="flex items-center gap-2 text-sm">
              <span>{m.icon}</span>
              <span className="text-yellow-300 font-medium">{m.title}</span>
              <span className="text-green-400 ml-auto text-xs">&#10003;</span>
            </div>
          ))}
          {remaining.map(m => (
            <div key={m.id} className="flex items-center gap-2 text-sm opacity-40">
              <span className="grayscale">{m.icon}</span>
              <div>
                <span className="text-gray-400">{m.title}</span>
                <div className="text-gray-600 text-xs">{m.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* General info */}
      <div className="bg-gray-800/80 rounded-xl p-4">
        <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Info</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Tick #</span>
            <span className="text-white font-mono">{cityState.tick_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Last tick</span>
            <span className="text-white text-xs">
              {new Date(cityState.updated_at).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Grid size</span>
            <span className="text-white font-mono">30 x 30</span>
          </div>
        </div>
      </div>
    </div>
  );
}
