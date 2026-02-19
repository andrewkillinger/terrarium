import { useState, useMemo, useEffect } from 'react'
import { useAppContext } from '../hooks/useAppContext'
import TopBar from '../components/TopBar'
import LocationBadge from '../components/LocationBadge'
import type { RatedCamp } from '../types'

type Tab = 'child' | 'overall'

export default function LeaderboardPage() {
  const {
    camps,
    children,
    selectedChild,
    childRatings,
    overallRatings,
    loading,
    error,
    pendingCount,
    isOnline,
    setSelectedChild,
    refreshRatings,
  } = useAppContext()

  const [tab, setTab] = useState<Tab>('child')

  // Refresh ratings when we land on leaderboard
  useEffect(() => {
    refreshRatings()
  }, [refreshRatings])

  const rankedCamps = useMemo<RatedCamp[]>(() => {
    const ratingsMap = tab === 'child' ? childRatings : overallRatings

    const list = camps.map((camp) => {
      const r = ratingsMap.get(camp.id)
      return {
        camp,
        elo: r?.elo ?? 1000,
        games: r?.games ?? 0,
        wins: r?.wins ?? 0,
        losses: r?.losses ?? 0,
        rank: 0,
      }
    })

    list.sort((a, b) => b.elo - a.elo)
    list.forEach((item, i) => {
      item.rank = i + 1
    })

    return list
  }, [camps, childRatings, overallRatings, tab])

  return (
    <div className="app-shell">
      <TopBar
        children={children}
        selectedChild={selectedChild}
        onSelectChild={setSelectedChild}
        pendingCount={pendingCount}
      />

      {!isOnline && (
        <div className="offline-banner" role="alert">
          You&apos;re offline — ratings shown may not reflect latest votes.
        </div>
      )}

      <div className="leaderboard-screen">
        <div className="leaderboard-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'child'}
            className={`leaderboard-tabs__btn${tab === 'child' ? ' leaderboard-tabs__btn--active' : ''}`}
            onClick={() => setTab('child')}
          >
            {selectedChild?.name ?? 'This child'}
          </button>
          <button
            role="tab"
            aria-selected={tab === 'overall'}
            className={`leaderboard-tabs__btn${tab === 'overall' ? ' leaderboard-tabs__btn--active' : ''}`}
            onClick={() => setTab('overall')}
          >
            Overall
          </button>
        </div>

        {loading && (
          <div className="state-screen">
            <div className="spinner" />
          </div>
        )}

        {!loading && error && (
          <div className="state-screen">
            <p className="state-screen__title">Could not load ratings.</p>
          </div>
        )}

        {!loading && !error && (
          <ol className="leaderboard-list" aria-label="Camp rankings">
            {rankedCamps.length === 0 && (
              <li className="state-screen">
                <p className="state-screen__sub">No camps yet.</p>
              </li>
            )}
            {rankedCamps.map((item) => {
              const winRate =
                item.games > 0
                  ? Math.round((item.wins / item.games) * 100)
                  : null

              return (
                <li key={item.camp.id} className="leaderboard-row">
                  <div
                    className={`leaderboard-rank${item.rank <= 3 ? ' leaderboard-rank--top' : ''}`}
                    aria-label={`Rank ${item.rank}`}
                  >
                    {item.rank <= 3
                      ? ['🥇', '🥈', '🥉'][item.rank - 1]
                      : item.rank}
                  </div>

                  <div className="leaderboard-info">
                    <div className="leaderboard-name">{item.camp.name}</div>
                    <div className="leaderboard-sub">
                      <LocationBadge location={item.camp.location} />
                      &nbsp;
                      {item.games > 0
                        ? `${item.games} comparisons · ${winRate}% wins`
                        : 'Not compared yet'}
                    </div>
                  </div>

                  <div className="leaderboard-elo" aria-label={`Elo rating ${item.elo}`}>
                    {item.elo}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}
