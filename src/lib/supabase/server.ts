// ============================================================
// Supabase server client (service role – bypasses RLS)
// Only used in API route handlers / server actions.
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

let _admin: SupabaseClient | null = null;

/**
 * Returns the Supabase service client, or null if env vars are missing
 * (e.g. during static export build for GitHub Pages).
 */
export function getServiceClient(): SupabaseClient | null {
  if (_admin) return _admin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  _admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}

/**
 * Get the service client or return a 503 response.
 * Use in API routes: const [db, errorRes] = getDbOrError();
 */
export function getDbOrError(): [SupabaseClient, null] | [null, NextResponse] {
  const db = getServiceClient();
  if (!db) {
    return [null, NextResponse.json(
      { ok: false, error: 'Database not configured' },
      { status: 503 }
    )];
  }
  return [db, null];
}
