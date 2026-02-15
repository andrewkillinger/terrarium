// ============================================================
// POST /api/projects/vote – Vote on a community project
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
  const { project_id } = body as { project_id: string };

  if (!project_id) {
    return NextResponse.json({ ok: false, error: 'project_id required' }, { status: 400 });
  }

  const db = getServiceClient();

  // Check project exists and is active
  const { data: project } = await db
    .from('projects')
    .select('*')
    .eq('id', project_id)
    .single();

  if (!project) {
    return NextResponse.json({ ok: false, error: 'Project not found' }, { status: 404 });
  }

  if (project.status !== 'active') {
    return NextResponse.json({ ok: false, error: 'Project is not active' }, { status: 400 });
  }

  // Insert vote (unique constraint will prevent duplicates)
  const { error } = await db
    .from('votes')
    .insert({ project_id, user_id: userId });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ ok: false, error: 'Already voted' }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Increment vote count
  await db
    .from('projects')
    .update({ vote_count: project.vote_count + 1 })
    .eq('id', project_id);

  // Log
  await db.from('actions_log').insert({
    user_id: userId,
    action_type: 'vote',
    payload: { project_id },
  });

  return NextResponse.json({ ok: true });
}
