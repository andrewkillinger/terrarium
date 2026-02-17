'use client';

import { CityState, Era } from '@/lib/types';
import { ERA_CONFIG } from '@/lib/game-config';

interface ResourceBarProps {
  cityState: CityState | null;
  tickCountdown: number;
  era: Era;
  onToggleMiniMap: () => void;
  showMiniMap: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function ResourceBar({ cityState, tickCountdown, era, onToggleMiniMap, showMiniMap }: ResourceBarProps) {
  if (!cityState) return null;

  const eraConfig = ERA_CONFIG[era];
  const isTickSoon = tickCountdown <= 30;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs overflow-x-auto whitespace-nowrap border-b border-gray-800/50"
      style={{ background: 'rgba(15, 23, 42, 0.9)' }}
    >
      <div className="flex items-center gap-1" title="Coins">
        <span>🪙</span>
        <span className="font-mono font-bold text-yellow-300">{formatNumber(cityState.coins)}</span>
      </div>
      <div className="w-px h-4 bg-gray-700/50" />
      <div className="flex items-center gap-1" title="Wood">
        <span>🪵</span>
        <span className="font-mono font-bold text-green-300">{formatNumber(cityState.wood)}</span>
      </div>
      <div className="w-px h-4 bg-gray-700/50" />
      <div className="flex items-center gap-1" title="Stone">
        <span>🪨</span>
        <span className="font-mono font-bold text-gray-300">{formatNumber(cityState.stone)}</span>
      </div>
      <div className="w-px h-4 bg-gray-700/50" />
      <div className="flex items-center gap-1" title="Population">
        <span>👥</span>
        <span className="font-mono font-bold" style={{ color: eraConfig.colorAccent }}>{formatNumber(cityState.population)}</span>
      </div>
      <div className="flex-1" />

      {/* Mini-map toggle */}
      <button
        onClick={onToggleMiniMap}
        className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
          showMiniMap ? 'bg-blue-600/30 text-blue-300' : 'bg-gray-800 text-gray-500'
        }`}
        title="Toggle mini-map"
      >
        🗺️
      </button>

      <div className="w-px h-4 bg-gray-700/50" />

      <div className={`flex items-center gap-1 ${isTickSoon ? 'text-green-400' : 'text-yellow-400'}`} title="Next tick">
        <span>⏱</span>
        <span className={`font-mono font-bold ${isTickSoon ? 'animate-pulse' : ''}`}>{formatTime(tickCountdown)}</span>
      </div>
      <div className="flex items-center gap-1 text-gray-500" title="Tick number">
        <span className="font-mono">#{cityState.tick_number}</span>
      </div>
    </div>
  );
}
