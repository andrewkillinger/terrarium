// ============================================================
// Projects API
// GET /api/projects – list projects
// POST /api/projects/vote – vote on a project
// POST /api/projects/contribute – contribute resources
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const db = getServiceClient();

  const { data, error } = await db
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}

// POST: create a project (admin only, handled in admin route)
export async function POST(req: NextRequest) {
  // This is a stub – project creation is admin-only
  void req;
  return NextResponse.json({ ok: false, error: 'Use admin API to create projects' }, { status: 403 });
}
