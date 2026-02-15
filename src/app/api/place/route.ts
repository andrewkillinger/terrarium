// ============================================================
// POST /api/place – Place a building on an empty plot
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { getDbOrError } from '@/lib/supabase/server';
import { BUILDING_DEFS, canAfford, GRID_SIZE } from '@/lib/buildings';
import { BuildingType } from '@/lib/types';

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { x, y, building_type } = body as { x: number; y: number; building_type: string };

  // Validate coords
  if (
    typeof x !== 'number' || typeof y !== 'number' ||
    x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE ||
    !Number.isInteger(x) || !Number.isInteger(y)
  ) {
    return NextResponse.json({ ok: false, error: 'Invalid coordinates' }, { status: 400 });
  }

  // Validate building type
  if (!building_type || !(building_type in BUILDING_DEFS)) {
    return NextResponse.json({ ok: false, error: 'Invalid building type' }, { status: 400 });
  }

  const def = BUILDING_DEFS[building_type as BuildingType];
  const buildCost = def.cost(1);

  const [db, err] = getDbOrError();
  if (!db) return err;

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

  if (plot.building_type !== null) {
    return NextResponse.json({ ok: false, error: 'Plot is not empty' }, { status: 400 });
  }

  if (plot.last_changed_at) {
    const elapsed = Date.now() - new Date(plot.last_changed_at).getTime();
    if (elapsed < 60_000) {
      const remaining = Math.ceil((60_000 - elapsed) / 1000);
      return NextResponse.json(
        { ok: false, error: `Plot on cooldown. ${remaining}s remaining.` },
        { status: 429 }
      );
    }
  }

  if (plot.protected) {
    return NextResponse.json({ ok: false, error: 'Plot is protected' }, { status: 403 });
  }

  const { data: state } = await db.from('city_state').select('*').eq('id', 1).single();
  if (!state) {
    return NextResponse.json({ ok: false, error: 'City state not found' }, { status: 500 });
  }

  if (!canAfford(state, buildCost)) {
    return NextResponse.json({ ok: false, error: 'Not enough resources' }, { status: 400 });
  }

  const { error: updateErr } = await db
    .from('city_state')
    .update({
      coins: state.coins - buildCost.coins,
      wood: state.wood - buildCost.wood,
      stone: state.stone - buildCost.stone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  if (updateErr) {
    return NextResponse.json({ ok: false, error: 'Failed to update resources' }, { status: 500 });
  }

  const now = new Date().toISOString();
  const { error: placeErr } = await db
    .from('plots')
    .update({
      building_type,
      level: 1,
      placed_by_user_id: userId,
      updated_at: now,
      last_changed_at: now,
    })
    .eq('x', x)
    .eq('y', y);

  if (placeErr) {
    return NextResponse.json({ ok: false, error: 'Failed to place building' }, { status: 500 });
  }

  await db.from('actions_log').insert({
    user_id: userId,
    action_type: 'place',
    payload: { x, y, building_type },
  });

  return NextResponse.json({ ok: true, data: { x, y, building_type, level: 1, cost: buildCost } });
}
