// ============================================================
// Chat API routes
// GET /api/chat – fetch messages (paginated)
// POST /api/chat – send a message
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { getServiceClient } from '@/lib/supabase/server';
import { CHAT_MAX_LENGTH, CHAT_RATE_LIMIT_SECONDS } from '@/lib/buildings';

export async function GET(req: NextRequest) {
  const db = getServiceClient();
  const url = new URL(req.url);
  const before = url.searchParams.get('before'); // cursor for pagination
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 100);

  let query = db
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: data?.reverse() || [] });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const content = (body.content || '').trim();

  if (!content || content.length === 0) {
    return NextResponse.json({ ok: false, error: 'Message cannot be empty' }, { status: 400 });
  }

  if (content.length > CHAT_MAX_LENGTH) {
    return NextResponse.json(
      { ok: false, error: `Message too long (max ${CHAT_MAX_LENGTH} chars)` },
      { status: 400 }
    );
  }

  const db = getServiceClient();

  // Check slow mode setting
  const { data: slowMode } = await db
    .from('app_settings')
    .select('value')
    .eq('key', 'chat_slow_mode')
    .single();

  const interval = slowMode?.value?.interval_seconds ?? CHAT_RATE_LIMIT_SECONDS;
  const slowModeEnabled = slowMode?.value?.enabled ?? false;
  const rateLimit = slowModeEnabled ? Number(interval) : CHAT_RATE_LIMIT_SECONDS;

  // Rate limit: check last message by this user
  const { data: lastMsg } = await db
    .from('chat_messages')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (lastMsg) {
    const elapsed = Date.now() - new Date(lastMsg.created_at).getTime();
    if (elapsed < rateLimit * 1000) {
      const remaining = Math.ceil((rateLimit * 1000 - elapsed) / 1000);
      return NextResponse.json(
        { ok: false, error: `Rate limited. Wait ${remaining}s.` },
        { status: 429 }
      );
    }
  }

  // Insert message
  const { data: msg, error } = await db
    .from('chat_messages')
    .insert({ user_id: userId, content })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: msg });
}
