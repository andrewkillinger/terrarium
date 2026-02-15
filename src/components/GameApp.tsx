'use client';

import { useState, useCallback } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { Plot } from '@/lib/types';
import ResourceBar from './ResourceBar';
import CityGrid from './CityGrid';
import PlotSheet from './PlotSheet';
import ChatPanel from './ChatPanel';
import ProjectsPanel from './ProjectsPanel';
import ActivityPanel from './ActivityPanel';
import StatsPanel from './StatsPanel';

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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🏙️</div>
          <div className="text-gray-400 text-sm">Loading city...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white">
      <ResourceBar cityState={game.cityState} tickCountdown={game.tickCountdown} />

      <div className="flex-1 min-h-0">
        {activeTab === 'city' && (
          <CityGrid plots={game.plots} onPlotTap={handlePlotTap} />
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
          <StatsPanel plots={game.plots} cityState={game.cityState} />
        )}
      </div>

      <div className="flex border-t border-gray-800 bg-gray-900 pb-safe">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex flex-col items-center py-2 transition-colors ${
              activeTab === tab.key
                ? 'text-blue-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[10px] mt-0.5">{tab.label}</span>
          </button>
        ))}
      </div>

      <PlotSheet
        plot={selectedPlot}
        cityState={game.cityState}
        onClose={() => setSelectedPlot(null)}
        onPlace={game.placeBuilding}
        onUpgrade={game.upgradeBuilding}
        onAction={game.refreshState}
      />
    </div>
  );
}
