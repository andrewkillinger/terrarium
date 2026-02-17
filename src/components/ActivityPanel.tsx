'use client';

import { ActionLog } from '@/lib/types';
import { BUILDING_DEFS } from '@/lib/buildings';
import { BuildingType } from '@/lib/types';

interface ActivityPanelProps {
  actions: ActionLog[];
}

function formatAction(action: ActionLog): { text: string; icon: string; color: string } {
  const uid = action.user_id?.slice(0, 8) || 'System';
  const p = action.payload as Record<string, unknown>;

  switch (action.action_type) {
    case 'place': {
      const def = BUILDING_DEFS[p.building_type as BuildingType];
      return {
        text: `${uid} built ${def?.label || p.building_type} at (${p.x}, ${p.y})`,
        icon: def?.emoji || '🏗️',
        color: 'text-blue-300',
      };
    }
    case 'upgrade':
      return {
        text: `${uid} upgraded ${p.building_type} at (${p.x}, ${p.y}) to Lv.${p.to_level}`,
        icon: '⬆️',
        color: 'text-purple-300',
      };
    case 'tick': {
      const prod = p.production as { coins?: number; wood?: number; stone?: number } | undefined;
      const eventInfo = p.event as { type?: string; title?: string } | undefined;
      let text = `Tick #${p.tick_number}`;
      if (prod) {
        const parts: string[] = [];
        if (prod.coins) parts.push(`+${prod.coins}🪙`);
        if (prod.wood) parts.push(`+${prod.wood}🪵`);
        if (prod.stone) parts.push(`+${prod.stone}🪨`);
        if (parts.length) text += ` — ${parts.join(' ')}`;
      }
      if (eventInfo?.title) text += ` — ${eventInfo.title}`;
      return {
        text,
        icon: '⏰',
        color: 'text-green-300',
      };
    }
    case 'vote':
      return {
        text: `${uid} voted on a project`,
        icon: '🗳️',
        color: 'text-cyan-300',
      };
    case 'contribute':
      return {
        text: `${uid} contributed resources to a project`,
        icon: '📦',
        color: 'text-amber-300',
      };
    default:
      return {
        text: `${uid} performed ${action.action_type}`,
        icon: '📝',
        color: 'text-gray-300',
      };
  }
}

export default function ActivityPanel({ actions }: ActivityPanelProps) {
  return (
    <div className="h-full overflow-y-auto p-3">
      <h2 className="text-lg font-bold text-white mb-3">Recent Activity</h2>

      {actions.length === 0 && (
        <div className="text-gray-500 text-sm text-center py-8">
          No recent activity yet. Start building!
        </div>
      )}

      <div className="space-y-1.5">
        {actions.map((action) => {
          const { text, icon, color } = formatAction(action);
          return (
            <div key={action.id} className="bg-gray-800/60 rounded-lg px-3 py-2 flex items-start gap-2">
              <span className="text-base mt-0.5">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${color}`}>{text}</div>
                <div className="text-[10px] text-gray-500">
                  {new Date(action.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
