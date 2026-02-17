'use client';

import { useState } from 'react';
import { Plot, BuildingType, CityState } from '@/lib/types';
import { BUILDING_DEFS, canAfford, getAvailableBuildings, getPlotDistrict } from '@/lib/buildings';
import { DISTRICT_RULES } from '@/lib/game-config';
import { ActionResult } from '@/lib/local-engine';

interface PlotSheetProps {
  plot: Plot | null;
  cityState: CityState | null;
  onClose: () => void;
  onPlace: (x: number, y: number, type: BuildingType) => ActionResult;
  onUpgrade: (x: number, y: number) => ActionResult;
  onAction: () => void;
  population: number;
  userId: string | null;
  plots: Plot[];
}

export default function PlotSheet({ plot, cityState, onClose, onPlace, onUpgrade, onAction, population, userId, plots }: PlotSheetProps) {
  const [error, setError] = useState<string | null>(null);

  if (!plot) return null;

  const building = plot.building_type as BuildingType | null;
  const def = building ? BUILDING_DEFS[building] : null;
  const availableBuildings = getAvailableBuildings(population);
  const isOwned = plot.placed_by_user_id === userId;

  // Check if plot is in a district
  const district = building ? getPlotDistrict(plot.x, plot.y, plots) : null;
  const districtRule = district ? DISTRICT_RULES.find(r => r.type === district.type) : null;

  const handlePlace = (type: BuildingType) => {
    setError(null);
    const res = onPlace(plot.x, plot.y, type);
    if (!res.ok) {
      setError(res.error || 'Failed');
    } else {
      onAction();
      onClose();
    }
  };

  const handleUpgrade = () => {
    setError(null);
    const res = onUpgrade(plot.x, plot.y);
    if (!res.ok) {
      setError(res.error || 'Failed');
    } else {
      onAction();
      onClose();
    }
  };

  const isMaxLevel = def ? plot.level >= def.maxLevel : false;

  const cooldownRemaining = plot.last_changed_at
    ? Math.max(0, 60 - (Date.now() - new Date(plot.last_changed_at).getTime()) / 1000)
    : 0;
  const onCooldown = cooldownRemaining > 0 && !building;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gradient-to-b from-gray-900 to-gray-950 text-white rounded-t-2xl max-h-[70vh] overflow-y-auto pb-safe border-t border-gray-700/50">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        <div className="px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">
              Plot ({plot.x}, {plot.y})
              {building && (
                <span className="ml-2">
                  {def?.emoji} {def?.label} <span className={`level-${Math.min(plot.level, 5)}`} style={{ fontSize: '0.9em' }}>Lv.{plot.level}</span>
                </span>
              )}
            </h2>
            <button onClick={onClose} className="text-gray-400 text-2xl leading-none hover:text-white transition-colors">
              &times;
            </button>
          </div>

          {plot.protected && (
            <div className="text-yellow-400 text-sm mb-2 flex items-center gap-1">
              <span>🔒</span> This plot is protected
            </div>
          )}

          {district && districtRule && (
            <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg px-3 py-2 mb-3 text-sm">
              <span className="font-medium text-blue-300">{districtRule.icon} {districtRule.label}</span>
              <span className="text-blue-400/70 ml-2">{districtRule.description}</span>
            </div>
          )}

          {error && <div className="text-red-400 text-sm mb-2 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>}

          {!building && (
            <div>
              <h3 className="text-sm text-gray-400 mb-2 font-medium">Build:</h3>
              {onCooldown && (
                <div className="text-yellow-400 text-sm mb-2 flex items-center gap-1">
                  <span>⏳</span> Cooldown: {Math.ceil(cooldownRemaining)}s remaining
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {availableBuildings.map((type) => {
                  const d = BUILDING_DEFS[type];
                  const c = d.cost(1);
                  const affordable = cityState ? canAfford(cityState, c) : false;

                  return (
                    <button
                      key={type}
                      disabled={onCooldown || plot.protected || !affordable}
                      onClick={() => handlePlace(type)}
                      className="bg-gray-800/80 rounded-xl p-3 text-left hover:bg-gray-700/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] border border-gray-700/50"
                    >
                      <div className="text-lg mb-1">
                        {d.emoji} <span className="text-sm font-medium">{d.label}</span>
                      </div>
                      <div className="text-xs text-gray-400 leading-tight">{d.description}</div>
                      <div className="text-xs mt-1.5 flex gap-2">
                        {c.coins > 0 && <span className="text-yellow-400 font-mono">{c.coins}c</span>}
                        {c.wood > 0 && <span className="text-green-400 font-mono">{c.wood}w</span>}
                        {c.stone > 0 && <span className="text-gray-300 font-mono">{c.stone}s</span>}
                      </div>
                      {d.unlockPopulation && (
                        <div className="text-[10px] text-purple-400 mt-1">Unlocked at {d.unlockPopulation} pop</div>
                      )}
                    </button>
                  );
                })}

                {/* Show locked buildings */}
                {Object.values(BUILDING_DEFS).filter(d => d.unlockPopulation && population < d.unlockPopulation).map(d => (
                  <div
                    key={d.type}
                    className="bg-gray-800/30 rounded-xl p-3 text-left opacity-40 border border-gray-700/30"
                  >
                    <div className="text-lg mb-1">
                      🔒 <span className="text-sm font-medium">{d.label}</span>
                    </div>
                    <div className="text-xs text-gray-500">Requires {d.unlockPopulation} population</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {building && def && (
            <div>
              <div className="text-sm text-gray-400 mb-3">{def.description}</div>

              <div className="bg-gray-800/60 rounded-xl p-3 mb-3 border border-gray-700/30">
                <h3 className="text-sm font-medium mb-1.5 text-gray-300">Per Tick Production</h3>
                <div className="flex gap-3 text-sm">
                  {def.production(plot.level).coins > 0 && (
                    <span className="text-yellow-300 font-mono">+{def.production(plot.level).coins} 🪙</span>
                  )}
                  {def.production(plot.level).wood > 0 && (
                    <span className="text-green-300 font-mono">+{def.production(plot.level).wood} 🪵</span>
                  )}
                  {def.production(plot.level).stone > 0 && (
                    <span className="text-gray-300 font-mono">+{def.production(plot.level).stone} 🪨</span>
                  )}
                  {def.populationDelta(plot.level) > 0 && (
                    <span className="text-blue-300 font-mono">+{def.populationDelta(plot.level)} 👥</span>
                  )}
                </div>
              </div>

              {!isMaxLevel && (
                <div>
                  <h3 className="text-sm text-gray-400 mb-2">
                    Upgrade to Level {plot.level + 1}
                  </h3>
                  {(() => {
                    const c = def.cost(plot.level + 1);
                    const affordable = cityState ? canAfford(cityState, c) : false;
                    return (
                      <button
                        disabled={plot.protected || !affordable}
                        onClick={handleUpgrade}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-3 text-center hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-blue-500/20"
                      >
                        <div className="font-bold">Upgrade</div>
                        <div className="text-xs mt-1 flex justify-center gap-2">
                          {c.coins > 0 && <span className="text-yellow-300 font-mono">{c.coins}c</span>}
                          {c.wood > 0 && <span className="text-green-300 font-mono">{c.wood}w</span>}
                          {c.stone > 0 && <span className="text-gray-200 font-mono">{c.stone}s</span>}
                        </div>
                      </button>
                    );
                  })()}
                </div>
              )}

              {isMaxLevel && (
                <div className="text-center py-2">
                  <span className="text-yellow-400 font-bold text-shadow-glow">⭐ Max Level!</span>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-500 space-y-0.5">
                <div>Placed by: {isOwned ? 'You' : `${plot.placed_by_user_id?.slice(0, 8) || 'Unknown'}...`}</div>
                <div>Last updated: {new Date(plot.updated_at).toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
