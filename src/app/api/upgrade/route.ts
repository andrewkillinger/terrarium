// ============================================================
// POST /api/upgrade – Upgrade an existing building
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { getServiceClient } from '@/lib/supabase/server';
import { BUILDING_DEFS, canAfford } from '@/lib/buildings';
import { BuildingType } from '@/lib/types';

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { x, y } = body as { x: number; y: number };

  const db = getServiceClient();

  // Fetch plot
  const { data: plot, error: plotErr } = await db
    .from('plots')
    .select('*')
    .eq('x', x)
    .eq('y', y)
    .single();

  if (plotErr || !plot) {
    return NextResponse.json({ ok: false, error: 'Plot not found' }, { status: 404 });
  }

  if (!plot.building_type) {
    return NextResponse.json({ ok: false, error: 'No building to upgrade' }, { status: 400 });
  }

  const def = BUILDING_DEFS[plot.building_type as BuildingType];
  if (!def) {
    return NextResponse.json({ ok: false, error: 'Unknown building type' }, { status: 400 });
  }

  const nextLevel = plot.level + 1;
  if (nextLevel > def.maxLevel) {
    return NextResponse.json({ ok: false, error: 'Already at max level' }, { status: 400 });
  }

  const upgradeCost = def.cost(nextLevel);

  // Fetch city state
  const { data: state } = await db.from('city_state').select('*').eq('id', 1).single();
  if (!state) {
    return NextResponse.json({ ok: false, error: 'City state not found' }, { status: 500 });
  }

  if (!canAfford(state, upgradeCost)) {
    return NextResponse.json({ ok: false, error: 'Not enough resources' }, { status: 400 });
  }

  // Deduct resources
  await db
    .from('city_state')
    .update({
      coins: state.coins - upgradeCost.coins,
      wood: state.wood - upgradeCost.wood,
      stone: state.stone - upgradeCost.stone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  // Upgrade
  const now = new Date().toISOString();
  await db
    .from('plots')
    .update({
      level: nextLevel,
      updated_at: now,
    })
    .eq('x', x)
    .eq('y', y);

  // Log
  await db.from('actions_log').insert({
    user_id: userId,
    action_type: 'upgrade',
    payload: { x, y, building_type: plot.building_type, from_level: plot.level, to_level: nextLevel },
  });

  return NextResponse.json({
    ok: true,
    data: { x, y, building_type: plot.building_type, level: nextLevel, cost: upgradeCost },
  });
}
