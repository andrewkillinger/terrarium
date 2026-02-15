'use client';

import { CityState } from '@/lib/types';

interface ResourceBarProps {
  cityState: CityState | null;
  tickCountdown: number;
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

export default function ResourceBar({ cityState, tickCountdown }: ResourceBarProps) {
  if (!cityState) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white text-xs overflow-x-auto whitespace-nowrap">
      <div className="flex items-center gap-1" title="Coins">
        <span>🪙</span>
        <span className="font-mono">{formatNumber(cityState.coins)}</span>
      </div>
      <div className="w-px h-4 bg-gray-700" />
      <div className="flex items-center gap-1" title="Wood">
        <span>🪵</span>
        <span className="font-mono">{formatNumber(cityState.wood)}</span>
      </div>
      <div className="w-px h-4 bg-gray-700" />
      <div className="flex items-center gap-1" title="Stone">
        <span>🪨</span>
        <span className="font-mono">{formatNumber(cityState.stone)}</span>
      </div>
      <div className="w-px h-4 bg-gray-700" />
      <div className="flex items-center gap-1" title="Population">
        <span>👥</span>
        <span className="font-mono">{formatNumber(cityState.population)}</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1 text-yellow-400" title="Next tick">
        <span>⏱</span>
        <span className="font-mono">{formatTime(tickCountdown)}</span>
      </div>
      <div className="flex items-center gap-1 text-gray-400" title="Tick number">
        <span>#</span>
        <span className="font-mono">{cityState.tick_number}</span>
      </div>
    </div>
  );
}
