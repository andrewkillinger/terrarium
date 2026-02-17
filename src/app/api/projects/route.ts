// ============================================================
// Projects API
// GET /api/projects – list projects
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDbOrError } from '@/lib/supabase/server';

// force-static for GitHub Pages static export compatibility.
// Change to 'force-dynamic' for Vercel/server deployments with Supabase.
export const dynamic = 'force-static';

export async function GET() {
  const [db, err] = getDbOrError();
  if (!db) return err;

  const { data, error } = await db
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest) {
  void req;
  return NextResponse.json({ ok: false, error: 'Use admin API to create projects' }, { status: 403 });
}
