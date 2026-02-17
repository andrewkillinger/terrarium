'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plot, CityState, Project, ChatMessage, ActionLog, BuildingType, GameEvent, Milestone, Era, TickNotificationData } from '@/lib/types';
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
  checkMilestones,
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
  // New game systems
  era: Era;
  milestones: Milestone[];
  activeEvents: GameEvent[];
  tickNotification: TickNotificationData | null;
  latestMilestone: Milestone | null;
  lastPlacedPlot?: { x: number; y: number; tick: number };
  lastUpgradedPlot?: { x: number; y: number; tick: number };
  showMiniMap: boolean;
}

export interface GameActions {
  placeBuilding: (x: number, y: number, type: BuildingType) => ActionResult;
  upgradeBuilding: (x: number, y: number) => ActionResult;
  sendChat: (content: string) => ActionResult;
  voteProject: (projectId: string) => ActionResult;
  contributeProject: (projectId: string, coins: number, wood: number, stone: number) => ActionResult;
  refreshState: () => void;
  refreshProjects: () => void;
  toggleMiniMap: () => void;
}

export function useGameState(): GameState & GameActions {
  const gameDataRef = useRef<LocalGameData | null>(null);
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tickCountdown, setTickCountdown] = useState(TICK_INTERVAL_MINUTES * 60);
  const [tickNotification, setTickNotification] = useState<TickNotificationData | null>(null);
  const [latestMilestone, setLatestMilestone] = useState<Milestone | null>(null);
  const [showMiniMap, setShowMiniMap] = useState(true);

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  // Check for new milestones and show toast
  const checkAndShowMilestones = useCallback((data: LocalGameData) => {
    const newMilestones = checkMilestones(data);
    if (newMilestones.length > 0) {
      // Show the first new milestone (queue if multiple)
      setLatestMilestone(newMilestones[0]);
    }
  }, []);

  useEffect(() => {
    const data = loadGame();
    gameDataRef.current = data;

    while (shouldTick(data)) {
      processTick(data);
    }

    setLoading(false);
    bump();
  }, [bump]);

  // Tick timer
  useEffect(() => {
    if (!gameDataRef.current) return;

    const interval = setInterval(() => {
      const data = gameDataRef.current!;

      if (shouldTick(data)) {
        const result = processTick(data);

        // Show tick notification
        setTickNotification({
          coins: result.production.coins,
          wood: result.production.wood,
          stone: result.production.stone,
          population: result.production.populationDelta,
          event: result.event,
        });

        checkAndShowMilestones(data);
        bump();
      }

      setTickCountdown(getTickCountdown(data));
    }, 1000);

    return () => clearInterval(interval);
  }, [bump, checkAndShowMilestones]);

  const data = gameDataRef.current;

  const doPlace = useCallback(
    (x: number, y: number, type: BuildingType): ActionResult => {
      if (!gameDataRef.current) return { ok: false, error: 'Not loaded' };
      const result = placeBuilding(gameDataRef.current, x, y, type);
      if (result.ok) {
        checkAndShowMilestones(gameDataRef.current);
        bump();
      }
      return result;
    },
    [bump, checkAndShowMilestones]
  );

  const doUpgrade = useCallback(
    (x: number, y: number): ActionResult => {
      if (!gameDataRef.current) return { ok: false, error: 'Not loaded' };
      const result = upgradeBuilding(gameDataRef.current, x, y);
      if (result.ok) {
        checkAndShowMilestones(gameDataRef.current);
        bump();
      }
      return result;
    },
    [bump, checkAndShowMilestones]
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
  const toggleMiniMap = useCallback(() => setShowMiniMap(v => !v), []);

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
    era: data?.era ?? 'village',
    milestones: data?.milestones ?? [],
    activeEvents: data?.activeEvents ?? [],
    tickNotification,
    latestMilestone,
    lastPlacedPlot: data?.lastPlacedPlot,
    lastUpgradedPlot: data?.lastUpgradedPlot,
    showMiniMap,
    placeBuilding: doPlace,
    upgradeBuilding: doUpgrade,
    sendChat: doSendChat,
    voteProject: doVoteProject,
    contributeProject: doContributeProject,
    refreshState,
    refreshProjects,
    toggleMiniMap,
  };
}
