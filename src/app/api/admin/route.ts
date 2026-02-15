// ============================================================
// POST /api/admin – Admin actions (gated by ADMIN_KEY)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { getServiceClient } from '@/lib/supabase/server';

type AdminAction =
  | 'revert_actions'
  | 'protect_plot'
  | 'unprotect_plot'
  | 'delete_chat_message'
  | 'toggle_slow_mode'
  | 'force_complete_project'
  | 'create_project';

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const action = body.action as AdminAction;
  const db = getServiceClient();

  switch (action) {
    case 'revert_actions': {
      const count = Math.min(body.count || 1, 50);
      const { data: actions } = await db
        .from('actions_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(count);

      if (actions) {
        const ids = actions.map((a: { id: string }) => a.id);
        await db.from('actions_log').delete().in('id', ids);
      }

      return NextResponse.json({ ok: true, data: { reverted: actions?.length || 0 } });
    }

    case 'protect_plot': {
      const { x, y } = body;
      await db.from('plots').update({ protected: true }).eq('x', x).eq('y', y);
      return NextResponse.json({ ok: true });
    }

    case 'unprotect_plot': {
      const { x, y } = body;
      await db.from('plots').update({ protected: false }).eq('x', x).eq('y', y);
      return NextResponse.json({ ok: true });
    }

    case 'delete_chat_message': {
      const { message_id } = body;
      await db.from('chat_messages').update({ deleted: true }).eq('id', message_id);
      return NextResponse.json({ ok: true });
    }

    case 'toggle_slow_mode': {
      const { enabled, interval_seconds } = body;
      await db
        .from('app_settings')
        .update({ value: { enabled: !!enabled, interval_seconds: interval_seconds || 10 } })
        .eq('key', 'chat_slow_mode');
      return NextResponse.json({ ok: true });
    }

    case 'force_complete_project': {
      const { project_id } = body;
      await db
        .from('projects')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', project_id);
      return NextResponse.json({ ok: true });
    }

    case 'create_project': {
      const { title, description, project_type, goal_coins, goal_wood, goal_stone, vote_threshold, reward_description, deadline } = body;
      const { data, error } = await db
        .from('projects')
        .insert({
          title: title || 'New Project',
          description: description || '',
          project_type: project_type || 'resource_goal',
          goal_coins: goal_coins || 0,
          goal_wood: goal_wood || 0,
          goal_stone: goal_stone || 0,
          vote_threshold: vote_threshold || 0,
          reward_description: reward_description || '',
          deadline: deadline || null,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, data });
    }

    default:
      return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  }
}
