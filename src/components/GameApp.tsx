'use client';

import { useState, useCallback } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { Plot } from '@/lib/types';
import CityHeader from './CityHeader';
import ResourceBar from './ResourceBar';
import CityGrid from './CityGrid';
import PlotSheet from './PlotSheet';
import ChatPanel from './ChatPanel';
import ProjectsPanel from './ProjectsPanel';
import ActivityPanel from './ActivityPanel';
import StatsPanel from './StatsPanel';
import TickNotification from './TickNotification';
import MilestoneToast from './MilestoneToast';

type Tab = 'city' | 'projects' | 'chat' | 'activity' | 'stats';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'city', label: 'City', icon: '🏙️' },
  { key: 'projects', label: 'Projects', icon: '📋' },
  { key: 'chat', label: 'Chat', icon: '💬' },
  { key: 'activity', label: 'Activity', icon: '📜' },
  { key: 'stats', label: 'Stats', icon: '📊' },
];

export default function GameApp() {
  const game = useGameState();
  const [activeTab, setActiveTab] = useState<Tab>('city');
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);

  const handlePlotTap = useCallback((plot: Plot) => {
    setSelectedPlot(plot);
  }, []);

  if (game.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a1a2e 100%)' }}>
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🏙️</div>
          <div className="text-gray-400 text-sm font-medium">Loading your city...</div>
          <div className="mt-3 w-32 h-1 bg-gray-800 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col text-white" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a1a2e 100%)' }}>
      {/* City Header with Era */}
      <CityHeader
        era={game.era}
        population={game.cityState?.population || 0}
        activeEvents={game.activeEvents}
        tickNumber={game.cityState?.tick_number || 0}
      />

      {/* Resource Bar */}
      <ResourceBar
        cityState={game.cityState}
        tickCountdown={game.tickCountdown}
        era={game.era}
        onToggleMiniMap={game.toggleMiniMap}
        showMiniMap={game.showMiniMap}
      />

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'city' && (
          <CityGrid
            plots={game.plots}
            onPlotTap={handlePlotTap}
            userId={game.userId}
            lastPlacedPlot={game.lastPlacedPlot}
            lastUpgradedPlot={game.lastUpgradedPlot}
            showMiniMap={game.showMiniMap}
          />
        )}
        {activeTab === 'projects' && (
          <ProjectsPanel
            projects={game.projects}
            cityState={game.cityState}
            onVote={game.voteProject}
            onContribute={game.contributeProject}
            onRefresh={game.refreshProjects}
          />
        )}
        {activeTab === 'chat' && (
          <ChatPanel
            messages={game.chatMessages}
            userId={game.userId}
            onSend={game.sendChat}
          />
        )}
        {activeTab === 'activity' && <ActivityPanel actions={game.recentActions} />}
        {activeTab === 'stats' && (
          <StatsPanel
            plots={game.plots}
            cityState={game.cityState}
            milestones={game.milestones}
            era={game.era}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex border-t border-gray-800/50 bg-gray-900/80 backdrop-blur-sm pb-safe">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex flex-col items-center py-2 transition-all ${
              activeTab === tab.key
                ? 'text-blue-400 scale-105'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Plot Sheet */}
      <PlotSheet
        plot={selectedPlot}
        cityState={game.cityState}
        onClose={() => setSelectedPlot(null)}
        onPlace={game.placeBuilding}
        onUpgrade={game.upgradeBuilding}
        onAction={game.refreshState}
        population={game.cityState?.population || 0}
        userId={game.userId}
        plots={game.plots}
      />

      {/* Tick Notification Overlay */}
      <TickNotification data={game.tickNotification} />

      {/* Milestone Toast Overlay */}
      <MilestoneToast milestone={game.latestMilestone} />
    </div>
  );
}
