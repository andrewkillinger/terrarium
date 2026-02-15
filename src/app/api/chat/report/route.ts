// ============================================================
// POST /api/chat/report – Report a chat message
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { getDbOrError } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { message_id, reason } = body as { message_id: string; reason?: string };

  if (!message_id) {
    return NextResponse.json({ ok: false, error: 'message_id required' }, { status: 400 });
  }

  const [db, err] = getDbOrError();
  if (!db) return err;

  const { error } = await db
    .from('chat_reports')
    .insert({
      message_id,
      reporter_user_id: userId,
      reason: reason || '',
    });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ ok: false, error: 'Already reported' }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
