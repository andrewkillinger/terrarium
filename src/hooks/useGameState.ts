'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plot, CityState, Project, ChatMessage, ActionLog, BuildingType } from '@/lib/types';
import { TICK_INTERVAL_MINUTES } from '@/lib/buildings';
import {
  loadGame,
  placeBuilding,
  upgradeBuilding,
  processTick,
  sendChatMessage,
  voteProject,
  contributeToProject,
  shouldTick,
  getTickCountdown,
  LocalGameData,
  ActionResult,
} from '@/lib/local-engine';

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

export interface GameActions {
  placeBuilding: (x: number, y: number, type: BuildingType) => ActionResult;
  upgradeBuilding: (x: number, y: number) => ActionResult;
  sendChat: (content: string) => ActionResult;
  voteProject: (projectId: string) => ActionResult;
  contributeProject: (projectId: string, coins: number, wood: number, stone: number) => ActionResult;
  refreshState: () => void;
  refreshProjects: () => void;
}

export function useGameState(): GameState & GameActions {
  const gameDataRef = useRef<LocalGameData | null>(null);
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tickCountdown, setTickCountdown] = useState(TICK_INTERVAL_MINUTES * 60);

  // Force re-render after mutations
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  // Initialize game on mount
  useEffect(() => {
    const data = loadGame();
    gameDataRef.current = data;

    // Process any missed ticks (e.g. user was away)
    while (shouldTick(data)) {
      processTick(data);
    }

    setLoading(false);
    bump();
  }, [bump]);

  // Tick timer: countdown + auto-process
  useEffect(() => {
    if (!gameDataRef.current) return;

    const interval = setInterval(() => {
      const data = gameDataRef.current!;

      if (shouldTick(data)) {
        processTick(data);
        bump();
      }

      setTickCountdown(getTickCountdown(data));
    }, 1000);

    return () => clearInterval(interval);
  }, [bump]);

  const data = gameDataRef.current;

  const doPlace = useCallback(
    (x: number, y: number, type: BuildingType): ActionResult => {
      if (!gameDataRef.current) return { ok: false, error: 'Not loaded' };
      const result = placeBuilding(gameDataRef.current, x, y, type);
      if (result.ok) bump();
      return result;
    },
    [bump]
  );

  const doUpgrade = useCallback(
    (x: number, y: number): ActionResult => {
      if (!gameDataRef.current) return { ok: false, error: 'Not loaded' };
      const result = upgradeBuilding(gameDataRef.current, x, y);
      if (result.ok) bump();
      return result;
    },
    [bump]
  );

  const doSendChat = useCallback(
    (content: string): ActionResult => {
      if (!gameDataRef.current) return { ok: false, error: 'Not loaded' };
      const result = sendChatMessage(gameDataRef.current, content);
      if (result.ok) bump();
      return result;
    },
    [bump]
  );

  const doVoteProject = useCallback(
    (projectId: string): ActionResult => {
      if (!gameDataRef.current) return { ok: false, error: 'Not loaded' };
      const result = voteProject(gameDataRef.current, projectId);
      if (result.ok) bump();
      return result;
    },
    [bump]
  );

  const doContributeProject = useCallback(
    (projectId: string, coins: number, wood: number, stone: number): ActionResult => {
      if (!gameDataRef.current) return { ok: false, error: 'Not loaded' };
      const result = contributeToProject(gameDataRef.current, projectId, coins, wood, stone);
      if (result.ok) bump();
      return result;
    },
    [bump]
  );

  const refreshState = useCallback(() => bump(), [bump]);
  const refreshProjects = useCallback(() => bump(), [bump]);

  // version drives re-renders via state
  void version;

  return {
    plots: data?.plots ?? [],
    cityState: data?.cityState ?? null,
    projects: data?.projects ?? [],
    chatMessages: data?.chatMessages ?? [],
    recentActions: data?.actionsLog ?? [],
    userId: data?.userId ?? null,
    loading,
    error: null,
    tickCountdown,
    placeBuilding: doPlace,
    upgradeBuilding: doUpgrade,
    sendChat: doSendChat,
    voteProject: doVoteProject,
    contributeProject: doContributeProject,
    refreshState,
    refreshProjects,
  };
}
