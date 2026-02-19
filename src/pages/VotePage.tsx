import { useAppContext } from '../hooks/useAppContext'
import TopBar from '../components/TopBar'
import CampCard from '../components/CampCard'

export default function VotePage() {
  const {
    camps,
    children,
    selectedChild,
    currentPair,
    loading,
    error,
    isOnline,
    pendingCount,
    selectedCampId,
    setSelectedChild,
    vote,
    retry,
  } = useAppContext()

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
          You&apos;re offline — votes will sync when you reconnect.
        </div>
      )}

      {loading && (
        <div className="state-screen">
          <div className="spinner" aria-label="Loading camps" />
          <p className="state-screen__sub">Loading camps…</p>
        </div>
      )}

      {!loading && error && (
        <div className="state-screen">
          <div className="state-screen__icon">😕</div>
          <p className="state-screen__title">Something went wrong</p>
          <p className="state-screen__sub">{error}</p>
          <button className="btn-primary" onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && camps.length === 0 && (
        <div className="state-screen">
          <div className="state-screen__icon">🏕️</div>
          <p className="state-screen__title">No camps yet</p>
          <p className="state-screen__sub">
            Add active camps in Supabase to get started.
          </p>
        </div>
      )}

      {!loading && !error && camps.length > 0 && (
        <main className="vote-screen">
          <p className="vote-prompt">
            Which camp does <strong>{selectedChild?.name ?? '…'}</strong> prefer?
          </p>

          {currentPair ? (
            <div className="vote-cards">
              <CampCard
                camp={currentPair[0]}
                selected={selectedCampId === currentPair[0].id}
                onClick={() => vote(currentPair[0].id)}
              />

              <div className="vs-divider" aria-hidden="true">VS</div>

              <CampCard
                camp={currentPair[1]}
                selected={selectedCampId === currentPair[1].id}
                onClick={() => vote(currentPair[1].id)}
              />
            </div>
          ) : (
            <div className="state-screen">
              <div className="state-screen__icon">🎉</div>
              <p className="state-screen__title">All done!</p>
              <p className="state-screen__sub">
                You&apos;ve seen every pairing. Results are on the leaderboard.
              </p>
            </div>
          )}
        </main>
      )}
    </div>
  )
}
