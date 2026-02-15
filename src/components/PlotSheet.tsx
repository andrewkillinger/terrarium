'use client';

import { useState } from 'react';
import { Plot, BuildingType, CityState } from '@/lib/types';
import { BUILDING_DEFS, BUILDING_TYPES, canAfford } from '@/lib/buildings';
import { api } from '@/lib/api';

interface PlotSheetProps {
  plot: Plot | null;
  cityState: CityState | null;
  onClose: () => void;
  onAction: () => void;
}

export default function PlotSheet({ plot, cityState, onClose, onAction }: PlotSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!plot) return null;

  const building = plot.building_type as BuildingType | null;
  const def = building ? BUILDING_DEFS[building] : null;

  const handlePlace = async (type: BuildingType) => {
    setLoading(true);
    setError(null);
    const res = await api.placeBuilding(plot.x, plot.y, type);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'Failed');
    } else {
      onAction();
      onClose();
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    const res = await api.upgradeBuilding(plot.x, plot.y);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'Failed');
    } else {
      onAction();
      onClose();
    }
  };

  const isMaxLevel = def ? plot.level >= def.maxLevel : false;

  // Check cooldown
  const cooldownRemaining = plot.last_changed_at
    ? Math.max(0, 60 - (Date.now() - new Date(plot.last_changed_at).getTime()) / 1000)
    : 0;
  const onCooldown = cooldownRemaining > 0 && !building;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-gray-900 text-white rounded-t-2xl max-h-[70vh] overflow-y-auto pb-safe">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        <div className="px-4 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">
              Plot ({plot.x}, {plot.y})
              {building && (
                <span className="ml-2">
                  {def?.emoji} {def?.label} Lv.{plot.level}
                </span>
              )}
            </h2>
            <button onClick={onClose} className="text-gray-400 text-2xl leading-none">
              &times;
            </button>
          </div>

          {plot.protected && (
            <div className="text-yellow-400 text-sm mb-2">🔒 This plot is protected</div>
          )}

          {error && <div className="text-red-400 text-sm mb-2">{error}</div>}

          {/* Empty plot: show build options */}
          {!building && (
            <div>
              <h3 className="text-sm text-gray-400 mb-2">Build:</h3>
              {onCooldown && (
                <div className="text-yellow-400 text-sm mb-2">
                  Cooldown: {Math.ceil(cooldownRemaining)}s remaining
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {BUILDING_TYPES.map((type) => {
                  const d = BUILDING_DEFS[type];
                  const c = d.cost(1);
                  const affordable = cityState ? canAfford(cityState, c) : false;

                  return (
                    <button
                      key={type}
                      disabled={loading || onCooldown || plot.protected || !affordable}
                      onClick={() => handlePlace(type)}
                      className="bg-gray-800 rounded-lg p-3 text-left hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <div className="text-lg mb-1">
                        {d.emoji} {d.label}
                      </div>
                      <div className="text-xs text-gray-400">{d.description}</div>
                      <div className="text-xs mt-1 flex gap-2">
                        {c.coins > 0 && <span>🪙{c.coins}</span>}
                        {c.wood > 0 && <span>🪵{c.wood}</span>}
                        {c.stone > 0 && <span>🪨{c.stone}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Occupied plot: show info + upgrade */}
          {building && def && (
            <div>
              <div className="text-sm text-gray-400 mb-3">{def.description}</div>

              {/* Production info */}
              <div className="bg-gray-800 rounded-lg p-3 mb-3">
                <h3 className="text-sm font-medium mb-1">Per Tick Production</h3>
                <div className="flex gap-3 text-sm">
                  {def.production(plot.level).coins > 0 && (
                    <span>🪙 +{def.production(plot.level).coins}</span>
                  )}
                  {def.production(plot.level).wood > 0 && (
                    <span>🪵 +{def.production(plot.level).wood}</span>
                  )}
                  {def.production(plot.level).stone > 0 && (
                    <span>🪨 +{def.production(plot.level).stone}</span>
                  )}
                  {def.populationDelta(plot.level) > 0 && (
                    <span>👥 +{def.populationDelta(plot.level)}</span>
                  )}
                </div>
              </div>

              {/* Upgrade button */}
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
                        disabled={loading || plot.protected || !affordable}
                        onClick={handleUpgrade}
                        className="w-full bg-blue-600 rounded-lg p-3 text-center hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <div className="font-medium">Upgrade</div>
                        <div className="text-xs mt-1 flex justify-center gap-2">
                          {c.coins > 0 && <span>🪙{c.coins}</span>}
                          {c.wood > 0 && <span>🪵{c.wood}</span>}
                          {c.stone > 0 && <span>🪨{c.stone}</span>}
                        </div>
                      </button>
                    );
                  })()}
                </div>
              )}

              {isMaxLevel && (
                <div className="text-green-400 text-sm text-center">Max level reached!</div>
              )}

              {/* Plot metadata */}
              <div className="mt-3 text-xs text-gray-500">
                <div>Placed by: {plot.placed_by_user_id?.slice(0, 8) || 'Unknown'}...</div>
                <div>Last updated: {new Date(plot.updated_at).toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
