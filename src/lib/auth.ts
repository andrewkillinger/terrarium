// ============================================================
// Auth helpers for API routes
// ============================================================

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Extract the authenticated user_id from the request's Authorization header.
 * Uses Supabase anon key to verify the JWT.
 */
export async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

/**
 * Verify admin access via ADMIN_KEY header.
 */
export function isAdmin(req: NextRequest): boolean {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) return false;
  const provided = req.headers.get('x-admin-key');
  return provided === adminKey;
}

/**
 * Verify cron secret for protected tick endpoint.
 */
export function isCronAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const provided = req.headers.get('authorization');
  return provided === `Bearer ${cronSecret}`;
}
