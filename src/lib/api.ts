// ============================================================
// Client-side API helpers
// ============================================================

import { ApiResponse } from './types';

let accessToken: string | null = null;
let userId: string | null = null;

export function setAuth(token: string, uid: string) {
  accessToken = token;
  userId = uid;
}

export function getUserIdLocal(): string | null {
  return userId;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// API base URL: when deployed on GitHub Pages (static export),
// API calls go to the Vercel-hosted backend.
// Set NEXT_PUBLIC_API_URL to point to the Vercel deployment.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { ...options, headers });
  return res.json();
}

export async function initAnonymousAuth(): Promise<{ userId: string; token: string } | null> {
  // Check localStorage for existing session
  const stored = typeof window !== 'undefined' ? localStorage.getItem('city_auth') : null;
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.access_token && parsed.user_id) {
        setAuth(parsed.access_token, parsed.user_id);
        // Try to verify the session is still valid
        const res = await apiFetch<{ plots: unknown[] }>('/api/state');
        if (res.ok) {
          return { userId: parsed.user_id, token: parsed.access_token };
        }
        // Session expired, clear and re-auth
        localStorage.removeItem('city_auth');
      }
    } catch {
      localStorage.removeItem('city_auth');
    }
  }

  const res = await apiFetch<{ access_token: string; refresh_token: string; user_id: string }>(
    '/api/auth/anon',
    { method: 'POST' }
  );

  if (res.ok && res.data) {
    setAuth(res.data.access_token, res.data.user_id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('city_auth', JSON.stringify(res.data));
    }
    return { userId: res.data.user_id, token: res.data.access_token };
  }

  return null;
}

export const api = {
  getState: () => apiFetch('/api/state'),

  placeBuilding: (x: number, y: number, building_type: string) =>
    apiFetch('/api/place', { method: 'POST', body: JSON.stringify({ x, y, building_type }) }),

  upgradeBuilding: (x: number, y: number) =>
    apiFetch('/api/upgrade', { method: 'POST', body: JSON.stringify({ x, y }) }),

  sendChat: (content: string) =>
    apiFetch('/api/chat', { method: 'POST', body: JSON.stringify({ content }) }),

  getChat: (before?: string) =>
    apiFetch(`/api/chat${before ? `?before=${before}` : ''}`),

  reportMessage: (message_id: string, reason?: string) =>
    apiFetch('/api/chat/report', { method: 'POST', body: JSON.stringify({ message_id, reason }) }),

  getProjects: () => apiFetch('/api/projects'),

  voteProject: (project_id: string) =>
    apiFetch('/api/projects/vote', { method: 'POST', body: JSON.stringify({ project_id }) }),

  contributeProject: (project_id: string, coins: number, wood: number, stone: number) =>
    apiFetch('/api/projects/contribute', {
      method: 'POST',
      body: JSON.stringify({ project_id, coins, wood, stone }),
    }),
};
