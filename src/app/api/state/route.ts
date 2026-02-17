// ============================================================
// GET /api/state – Get full game state (plots + city_state)
// ============================================================

import { NextResponse } from 'next/server';
import { getDbOrError } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [db, err] = getDbOrError();
  if (!db) return err;

  const [plotsRes, stateRes, projectsRes, settingsRes] = await Promise.all([
    db.from('plots').select('*').order('y').order('x'),
    db.from('city_state').select('*').eq('id', 1).single(),
    db.from('projects').select('*').eq('status', 'active').order('created_at', { ascending: false }),
    db.from('app_settings').select('*'),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      plots: plotsRes.data || [],
      city_state: stateRes.data,
      projects: projectsRes.data || [],
      settings: settingsRes.data || [],
    },
  });
}
