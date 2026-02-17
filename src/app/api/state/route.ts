// ============================================================
// GET /api/state – Get full game state (plots + city_state)
// ============================================================

import { NextResponse } from 'next/server';
import { getDbOrError } from '@/lib/supabase/server';

// force-static for GitHub Pages static export compatibility.
// Change to 'force-dynamic' for Vercel/server deployments with Supabase.
export const dynamic = 'force-static';

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
