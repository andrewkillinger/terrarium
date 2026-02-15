'use client';

import { useState } from 'react';
import { Project, CityState } from '@/lib/types';
import { ActionResult } from '@/lib/local-engine';

interface ProjectsPanelProps {
  projects: Project[];
  cityState: CityState | null;
  onVote: (projectId: string) => ActionResult;
  onContribute: (projectId: string, coins: number, wood: number, stone: number) => ActionResult;
  onRefresh: () => void;
}

export default function ProjectsPanel({ projects, cityState, onVote, onContribute, onRefresh }: ProjectsPanelProps) {
  const [contributing, setContributing] = useState<string | null>(null);
  const [amounts, setAmounts] = useState({ coins: 0, wood: 0, stone: 0 });
  const [error, setError] = useState<string | null>(null);

  const active = projects.filter((p) => p.status === 'active');
  const past = projects.filter((p) => p.status !== 'active');

  const handleVote = (projectId: string) => {
    const res = onVote(projectId);
    if (!res.ok) {
      setError(res.error || 'Failed');
    }
    onRefresh();
  };

  const handleContribute = (projectId: string) => {
    setError(null);
    const res = onContribute(projectId, amounts.coins, amounts.wood, amounts.stone);
    if (!res.ok) {
      setError(res.error || 'Failed');
    } else {
      setContributing(null);
      setAmounts({ coins: 0, wood: 0, stone: 0 });
    }
    onRefresh();
  };

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      <h2 className="text-lg font-bold text-white">Community Projects</h2>

      {error && <div className="text-red-400 text-sm">{error}</div>}

      {active.length === 0 && (
        <div className="text-gray-500 text-sm">No active projects right now.</div>
      )}

      {active.map((project) => (
        <div key={project.id} className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-bold text-white">{project.title}</h3>
          <p className="text-sm text-gray-400 mt-1">{project.description}</p>

          {project.project_type === 'resource_goal' && (
            <div className="mt-2 space-y-1">
              {project.goal_coins > 0 && (
                <ProgressBar
                  label="Coins"
                  current={project.contributed_coins}
                  goal={project.goal_coins}
                />
              )}
              {project.goal_wood > 0 && (
                <ProgressBar
                  label="Wood"
                  current={project.contributed_wood}
                  goal={project.goal_wood}
                />
              )}
              {project.goal_stone > 0 && (
                <ProgressBar
                  label="Stone"
                  current={project.contributed_stone}
                  goal={project.goal_stone}
                />
              )}
            </div>
          )}

          {project.project_type === 'vote' && (
            <div className="mt-2">
              <ProgressBar
                label="Votes"
                current={project.vote_count}
                goal={project.vote_threshold}
              />
            </div>
          )}

          {project.reward_description && (
            <div className="mt-2 text-xs text-green-400">Reward: {project.reward_description}</div>
          )}

          <div className="flex gap-2 mt-3">
            {project.project_type === 'vote' && (
              <button
                onClick={() => handleVote(project.id)}
                className="bg-green-600 rounded px-3 py-1.5 text-sm text-white hover:bg-green-500 transition-colors"
              >
                Vote Yes
              </button>
            )}

            {project.project_type === 'resource_goal' && (
              <>
                {contributing === project.id ? (
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-3 gap-1">
                      <div>
                        <label className="text-[10px] text-gray-500">Coins</label>
                        <input
                          type="number"
                          min={0}
                          max={cityState?.coins || 0}
                          value={amounts.coins}
                          onChange={(e) =>
                            setAmounts((a) => ({ ...a, coins: parseInt(e.target.value) || 0 }))
                          }
                          className="w-full bg-gray-700 rounded px-2 py-1 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500">Wood</label>
                        <input
                          type="number"
                          min={0}
                          max={cityState?.wood || 0}
                          value={amounts.wood}
                          onChange={(e) =>
                            setAmounts((a) => ({ ...a, wood: parseInt(e.target.value) || 0 }))
                          }
                          className="w-full bg-gray-700 rounded px-2 py-1 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500">Stone</label>
                        <input
                          type="number"
                          min={0}
                          max={cityState?.stone || 0}
                          value={amounts.stone}
                          onChange={(e) =>
                            setAmounts((a) => ({ ...a, stone: parseInt(e.target.value) || 0 }))
                          }
                          className="w-full bg-gray-700 rounded px-2 py-1 text-sm text-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleContribute(project.id)}
                        className="bg-blue-600 rounded px-3 py-1 text-sm text-white hover:bg-blue-500"
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => setContributing(null)}
                        className="bg-gray-700 rounded px-3 py-1 text-sm text-gray-300 hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setContributing(project.id)}
                    className="bg-blue-600 rounded px-3 py-1.5 text-sm text-white hover:bg-blue-500 transition-colors"
                  >
                    Contribute
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ))}

      {past.length > 0 && (
        <>
          <h3 className="text-sm font-bold text-gray-400 mt-4">Past Projects</h3>
          {past.map((p) => (
            <div key={p.id} className="bg-gray-800/50 rounded-lg p-3 opacity-70">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    p.status === 'completed'
                      ? 'bg-green-800 text-green-300'
                      : 'bg-red-800 text-red-300'
                  }`}
                >
                  {p.status}
                </span>
                <span className="text-sm text-white">{p.title}</span>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function ProgressBar({
  label,
  current,
  goal,
}: {
  label: string;
  current: number;
  goal: number;
}) {
  const pct = Math.min(100, (current / goal) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-0.5">
        <span>{label}</span>
        <span>
          {current}/{goal}
        </span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
