'use client';

import { ActionLog } from '@/lib/types';
import { BUILDING_DEFS } from '@/lib/buildings';
import { BuildingType } from '@/lib/types';

interface ActivityPanelProps {
  actions: ActionLog[];
}

function formatAction(action: ActionLog): string {
  const uid = action.user_id?.slice(0, 8) || 'System';
  const p = action.payload as Record<string, unknown>;

  switch (action.action_type) {
    case 'place': {
      const def = BUILDING_DEFS[p.building_type as BuildingType];
      return `${uid} built ${def?.emoji || ''} ${p.building_type} at (${p.x}, ${p.y})`;
    }
    case 'upgrade':
      return `${uid} upgraded ${p.building_type} at (${p.x}, ${p.y}) to Lv.${p.to_level}`;
    case 'tick':
      return `Tick #${p.tick_number} processed`;
    case 'vote':
      return `${uid} voted on a project`;
    case 'contribute':
      return `${uid} contributed resources to a project`;
    default:
      return `${uid} performed ${action.action_type}`;
  }
}

export default function ActivityPanel({ actions }: ActivityPanelProps) {
  return (
    <div className="h-full overflow-y-auto p-3">
      <h2 className="text-lg font-bold text-white mb-3">Recent Activity</h2>

      {actions.length === 0 && (
        <div className="text-gray-500 text-sm">No recent activity.</div>
      )}

      <div className="space-y-2">
        {actions.map((action) => (
          <div key={action.id} className="bg-gray-800 rounded-lg px-3 py-2">
            <div className="text-sm text-gray-200">{formatAction(action)}</div>
            <div className="text-[10px] text-gray-500">
              {new Date(action.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
