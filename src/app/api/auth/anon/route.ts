// ============================================================
// POST /api/auth/anon – Anonymous sign-in
// Returns an anonymous session (durable per device via client storage)
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json(
      { ok: false, error: 'Supabase not configured' },
      { status: 503 }
    );
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    data: {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      user_id: data.user?.id,
    },
  });
}
