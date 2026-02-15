// ============================================================
// POST /api/projects/contribute – Contribute resources to a project
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { getServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { project_id, coins = 0, wood = 0, stone = 0 } = body as {
    project_id: string;
    coins?: number;
    wood?: number;
    stone?: number;
  };

  if (!project_id) {
    return NextResponse.json({ ok: false, error: 'project_id required' }, { status: 400 });
  }

  const c = Math.max(0, Math.floor(coins));
  const w = Math.max(0, Math.floor(wood));
  const s = Math.max(0, Math.floor(stone));

  if (c + w + s === 0) {
    return NextResponse.json({ ok: false, error: 'Must contribute at least something' }, { status: 400 });
  }

  const db = getServiceClient();

  // Check project
  const { data: project } = await db
    .from('projects')
    .select('*')
    .eq('id', project_id)
    .single();

  if (!project || project.status !== 'active') {
    return NextResponse.json({ ok: false, error: 'Project not found or not active' }, { status: 404 });
  }

  // Check city can afford
  const { data: state } = await db.from('city_state').select('*').eq('id', 1).single();
  if (!state) {
    return NextResponse.json({ ok: false, error: 'City state not found' }, { status: 500 });
  }

  if (state.coins < c || state.wood < w || state.stone < s) {
    return NextResponse.json({ ok: false, error: 'Not enough resources' }, { status: 400 });
  }

  // Deduct from city
  await db
    .from('city_state')
    .update({
      coins: state.coins - c,
      wood: state.wood - w,
      stone: state.stone - s,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  // Add to project contributions
  await db.from('project_contributions').insert({
    project_id,
    user_id: userId,
    coins: c,
    wood: w,
    stone: s,
  });

  // Update project totals
  await db
    .from('projects')
    .update({
      contributed_coins: project.contributed_coins + c,
      contributed_wood: project.contributed_wood + w,
      contributed_stone: project.contributed_stone + s,
    })
    .eq('id', project_id);

  // Log
  await db.from('actions_log').insert({
    user_id: userId,
    action_type: 'contribute',
    payload: { project_id, coins: c, wood: w, stone: s },
  });

  return NextResponse.json({ ok: true, data: { coins: c, wood: w, stone: s } });
}
