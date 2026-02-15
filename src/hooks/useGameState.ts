'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plot, CityState, Project, ChatMessage, ActionLog } from '@/lib/types';
import { api, initAnonymousAuth, getAccessToken, getUserIdLocal } from '@/lib/api';
import { getSupabaseClient } from '@/lib/supabase/client';
import { TICK_INTERVAL_MINUTES } from '@/lib/buildings';

export interface GameState {
  plots: Plot[];
  cityState: CityState | null;
  projects: Project[];
  chatMessages: ChatMessage[];
  recentActions: ActionLog[];
  userId: string | null;
  loading: boolean;
  error: string | null;
  tickCountdown: number;
}

export function useGameState() {
  const [state, setState] = useState<GameState>({
    plots: [],
    cityState: null,
    projects: [],
    chatMessages: [],
    recentActions: [],
    userId: null,
    loading: true,
    error: null,
    tickCountdown: TICK_INTERVAL_MINUTES * 60,
  });

  const subscriptionsRef = useRef<(() => void)[]>([]);

  // Initialize auth and load state
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const auth = await initAnonymousAuth();
        if (cancelled) return;

        if (!auth) {
          setState((s) => ({ ...s, loading: false, error: 'Failed to authenticate' }));
          return;
        }

        // Load initial state
        const res = await api.getState();
        if (cancelled) return;

        if (res.ok && res.data) {
          const data = res.data as {
            plots: Plot[];
            city_state: CityState;
            projects: Project[];
          };

          // Load chat
          const chatRes = await api.getChat();
          const chatMessages = chatRes.ok && chatRes.data ? (chatRes.data as ChatMessage[]) : [];

          setState((s) => ({
            ...s,
            plots: data.plots,
            cityState: data.city_state,
            projects: data.projects,
            chatMessages,
            userId: auth.userId,
            loading: false,
          }));

          // Set up realtime subscriptions
          setupRealtime(auth.userId);
        }
      } catch (err) {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load',
          }));
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      subscriptionsRef.current.forEach((unsub) => unsub());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tick countdown timer
  useEffect(() => {
    if (!state.cityState) return;

    const lastTick = new Date(state.cityState.updated_at).getTime();
    const tickMs = TICK_INTERVAL_MINUTES * 60 * 1000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastTick;
      const remaining = Math.max(0, Math.ceil((tickMs - elapsed) / 1000));
      setState((s) => ({ ...s, tickCountdown: remaining }));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.cityState?.updated_at, state.cityState]);

  function setupRealtime(_userId: string) {
    const supabase = getSupabaseClient();
    const token = getAccessToken();
    if (token) {
      supabase.realtime.setAuth(token);
    }

    // Subscribe to plots changes
    const plotsSub = supabase
      .channel('plots-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plots' },
        (payload) => {
          const updated = payload.new as Plot;
          setState((s) => ({
            ...s,
            plots: s.plots.map((p) =>
              p.x === updated.x && p.y === updated.y ? { ...p, ...updated } : p
            ),
          }));
        }
      )
      .subscribe();

    // Subscribe to city_state changes
    const stateSub = supabase
      .channel('city-state-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'city_state' },
        (payload) => {
          setState((s) => ({ ...s, cityState: payload.new as CityState }));
        }
      )
      .subscribe();

    // Subscribe to chat messages
    const chatSub = supabase
      .channel('chat-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          setState((s) => ({
            ...s,
            chatMessages: [...s.chatMessages, payload.new as ChatMessage].slice(-200),
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const updated = payload.new as ChatMessage;
          setState((s) => ({
            ...s,
            chatMessages: s.chatMessages.map((m) => (m.id === updated.id ? updated : m)),
          }));
        }
      )
      .subscribe();

    // Subscribe to actions log
    const actionsSub = supabase
      .channel('actions-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'actions_log' },
        (payload) => {
          setState((s) => ({
            ...s,
            recentActions: [payload.new as ActionLog, ...s.recentActions].slice(0, 50),
          }));
        }
      )
      .subscribe();

    subscriptionsRef.current = [
      () => supabase.removeChannel(plotsSub),
      () => supabase.removeChannel(stateSub),
      () => supabase.removeChannel(chatSub),
      () => supabase.removeChannel(actionsSub),
    ];
  }

  const refreshState = useCallback(async () => {
    const res = await api.getState();
    if (res.ok && res.data) {
      const data = res.data as {
        plots: Plot[];
        city_state: CityState;
        projects: Project[];
      };
      setState((s) => ({
        ...s,
        plots: data.plots,
        cityState: data.city_state,
        projects: data.projects,
      }));
    }
  }, []);

  const refreshProjects = useCallback(async () => {
    const res = await api.getProjects();
    if (res.ok && res.data) {
      setState((s) => ({ ...s, projects: res.data as Project[] }));
    }
  }, []);

  return {
    ...state,
    refreshState,
    refreshProjects,
    getUserId: getUserIdLocal,
  };
}
