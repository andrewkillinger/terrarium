'use client';

import { useEffect, useState } from 'react';
import { TickNotificationData, GameEvent } from '@/lib/types';
import { EVENT_VISUALS } from '@/lib/game-config';

interface TickNotificationProps {
  data: TickNotificationData | null;
}

export default function TickNotification({ data }: TickNotificationProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setVisible(true);
    setLeaving(false);

    const hideTimer = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => setVisible(false), 300);
    }, 3000);

    return () => clearTimeout(hideTimer);
  }, [data]);

  if (!visible || !data) return null;

  const event = data.event;

  return (
    <div className="fixed top-14 right-3 z-50 flex flex-col gap-2">
      {/* Resource notification */}
      <div className={`bg-gray-900/95 backdrop-blur-sm border border-green-500/30 rounded-xl px-4 py-3 shadow-xl ${leaving ? 'animate-toast-out' : 'animate-toast-in'}`}>
        <div className="text-xs text-green-400 font-bold mb-1.5 uppercase tracking-wider">Tick Production</div>
        <div className="flex gap-3 text-sm">
          {data.coins > 0 && (
            <span className="text-yellow-300 font-mono font-bold">+{data.coins} 🪙</span>
          )}
          {data.wood > 0 && (
            <span className="text-green-300 font-mono font-bold">+{data.wood} 🪵</span>
          )}
          {data.stone > 0 && (
            <span className="text-gray-300 font-mono font-bold">+{data.stone} 🪨</span>
          )}
        </div>
        {data.population > 0 && (
          <div className="text-xs text-blue-300 mt-1">👥 {data.population} citizens</div>
        )}
      </div>

      {/* Event notification */}
      {event && <EventBanner event={event} leaving={leaving} />}
    </div>
  );
}

function EventBanner({ event, leaving }: { event: GameEvent; leaving: boolean }) {
  const visual = EVENT_VISUALS[event.type];

  return (
    <div
      className={`bg-gray-900/95 backdrop-blur-sm border rounded-xl px-4 py-3 shadow-xl animate-event-banner ${leaving ? 'animate-toast-out' : 'animate-toast-in'}`}
      style={{ borderColor: visual?.color || '#666' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{visual?.icon}</span>
        <div>
          <div className="text-sm font-bold" style={{ color: visual?.color }}>{event.title}</div>
          <div className="text-xs text-gray-400">{event.description}</div>
        </div>
      </div>
    </div>
  );
}
