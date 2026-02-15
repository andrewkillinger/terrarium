'use client';

import { Plot, CityState, BuildingType } from '@/lib/types';
import { BUILDING_DEFS, BUILDING_TYPES, computeTickProduction } from '@/lib/buildings';

interface StatsPanelProps {
  plots: Plot[];
  cityState: CityState | null;
}

export default function StatsPanel({ plots, cityState }: StatsPanelProps) {
  if (!cityState) return null;

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

  return (
    <div className="h-full overflow-y-auto p-3">
      <h2 className="text-lg font-bold text-white mb-3">City Stats</h2>

      {/* Resources */}
      <div className="bg-gray-800 rounded-lg p-4 mb-3">
        <h3 className="text-sm font-bold text-gray-400 mb-2">Resources</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">🪙 Coins</span>
            <span className="text-white font-mono">{cityState.coins.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">🪵 Wood</span>
            <span className="text-white font-mono">{cityState.wood.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">🪨 Stone</span>
            <span className="text-white font-mono">{cityState.stone.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">👥 Population</span>
            <span className="text-white font-mono">{cityState.population.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Per-tick production */}
      <div className="bg-gray-800 rounded-lg p-4 mb-3">
        <h3 className="text-sm font-bold text-gray-400 mb-2">Per Tick Production</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">🪙 Coins</span>
            <span className="text-green-400 font-mono">+{production.coins}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">🪵 Wood</span>
            <span className="text-green-400 font-mono">+{production.wood}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">🪨 Stone</span>
            <span className="text-green-400 font-mono">+{production.stone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">👥 Pop</span>
            <span className="text-green-400 font-mono">+{production.populationDelta}</span>
          </div>
        </div>
      </div>

      {/* Building counts */}
      <div className="bg-gray-800 rounded-lg p-4 mb-3">
        <h3 className="text-sm font-bold text-gray-400 mb-2">
          Buildings ({totalBuildings}/{plots.length} plots)
        </h3>
        <div className="space-y-1 text-sm">
          {BUILDING_TYPES.map((type) => {
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
        </div>
      </div>

      {/* General info */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-bold text-gray-400 mb-2">Info</h3>
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
