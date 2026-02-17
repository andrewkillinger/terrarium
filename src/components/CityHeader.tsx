'use client';

import { Era, GameEvent } from '@/lib/types';
import { ERA_CONFIG, EVENT_VISUALS } from '@/lib/game-config';

interface CityHeaderProps {
  era: Era;
  population: number;
  activeEvents: GameEvent[];
  tickNumber: number;
}

export default function CityHeader({ era, population, activeEvents, tickNumber }: CityHeaderProps) {
  const eraConfig = ERA_CONFIG[era];
  const nextEra = getNextEra(era);
  const progress = nextEra ? Math.min(100, (population / ERA_CONFIG[nextEra].minPopulation) * 100) : 100;

  return (
    <div
      className="px-3 py-1.5 flex items-center gap-2 text-xs border-b"
      style={{
        background: eraConfig.bgGradient,
        borderColor: `${eraConfig.colorAccent}33`,
      }}
    >
      {/* Era badge */}
      <div className="flex items-center gap-1.5">
        <span className="text-base">{eraConfig.icon}</span>
        <div>
          <span className="font-bold" style={{ color: eraConfig.colorAccent }}>
            {eraConfig.label}
          </span>
          {nextEra && (
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: eraConfig.colorAccent,
                  }}
                />
              </div>
              <span className="text-[9px] text-gray-500">
                {ERA_CONFIG[nextEra].minPopulation - population} to {ERA_CONFIG[nextEra].label}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1" />

      {/* Active events */}
      {activeEvents.filter(e => e.active && (tickNumber - e.startTick) < e.duration).map(event => {
        const visual = EVENT_VISUALS[event.type];
        return (
          <div
            key={event.id}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full animate-event-banner"
            style={{
              background: `${visual?.color}22`,
              border: `1px solid ${visual?.color}44`,
            }}
          >
            <span className="text-xs">{visual?.icon}</span>
            <span className="text-[10px] font-medium" style={{ color: visual?.color }}>
              {event.title.replace('!', '')}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function getNextEra(current: Era): Era | null {
  const order: Era[] = ['village', 'town', 'city', 'metropolis'];
  const idx = order.indexOf(current);
  return idx < order.length - 1 ? order[idx + 1] : null;
}
