// ============================================================
// POST /api/tick – Economy tick (called by Vercel Cron)
// Idempotent + concurrency-safe via DB transaction + row locking.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isCronAuthorized, isAdmin } from '@/lib/auth';
import { getDbOrError } from '@/lib/supabase/server';
import { computeTickProduction } from '@/lib/buildings';
import { SupabaseClient } from '@supabase/supabase-js';

// force-static for GitHub Pages static export compatibility.
// Change to 'force-dynamic' for Vercel/server deployments with Supabase.
export const dynamic = 'force-static';

export async function POST(req: NextRequest) {
  if (!isCronAuthorized(req) && !isAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const [db, err] = getDbOrError();
  if (!db) return err;

  const { data: result, error } = await db.rpc('process_tick');

  if (error) {
    return await fallbackTick(db);
  }

  return NextResponse.json({ ok: true, data: result });
}

export async function GET(req: NextRequest) {
  return POST(req);
}

async function fallbackTick(db: SupabaseClient) {
  const { data: plots } = await db
    .from('plots')
    .select('x, y, building_type, level')
    .not('building_type', 'is', null);

  if (!plots) {
    return NextResponse.json({ ok: false, error: 'Failed to fetch plots' }, { status: 500 });
  }

  const production = computeTickProduction(plots);

  const { data: state } = await db
    .from('city_state')
    .select('*')
    .eq('id', 1)
    .single();

  if (!state) {
    return NextResponse.json({ ok: false, error: 'City state not found' }, { status: 500 });
  }

  const newTickNumber = state.tick_number + 1;

  const { error: updateErr } = await db
    .from('city_state')
    .update({
      coins: state.coins + production.coins,
      wood: state.wood + production.wood,
      stone: state.stone + production.stone,
      population: production.populationDelta,
      tick_number: newTickNumber,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
    .eq('tick_number', state.tick_number);

  if (updateErr) {
    return NextResponse.json({ ok: false, error: 'Tick conflict' }, { status: 409 });
  }

  await db.from('actions_log').insert({
    user_id: null,
    action_type: 'tick',
    payload: { tick_number: newTickNumber, production },
  });

  await checkProjects(db);

  return NextResponse.json({
    ok: true,
    data: {
      tick_number: newTickNumber,
      production,
      new_coins: state.coins + production.coins,
      new_wood: state.wood + production.wood,
      new_stone: state.stone + production.stone,
      population: production.populationDelta,
    },
  });
}

async function checkProjects(db: SupabaseClient) {
  const { data: active } = await db
    .from('projects')
    .select('*')
    .eq('status', 'active');

  if (!active) return;

  const now = new Date();

  for (const project of active) {
    let completed = false;

    if (project.project_type === 'resource_goal') {
      completed =
        project.contributed_coins >= project.goal_coins &&
        project.contributed_wood >= project.goal_wood &&
        project.contributed_stone >= project.goal_stone;
    } else if (project.project_type === 'vote') {
      completed = project.vote_count >= project.vote_threshold;
    }

    const expired = project.deadline && new Date(project.deadline) < now;

    if (completed) {
      await db
        .from('projects')
        .update({ status: 'completed', completed_at: now.toISOString() })
        .eq('id', project.id);
    } else if (expired) {
      await db
        .from('projects')
        .update({ status: 'failed' })
        .eq('id', project.id);
    }
  }
}
