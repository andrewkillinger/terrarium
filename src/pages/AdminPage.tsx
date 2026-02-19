import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../hooks/useAppContext'
import { fetchArchives } from '../lib/api'
import type { RatingArchive, ArchivedRating } from '../types'

export default function AdminPage() {
  const navigate = useNavigate()
  const { archiveAndReset } = useAppContext()

  const [label, setLabel] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  const [archives, setArchives] = useState<RatingArchive[]>([])
  const [archivesLoading, setArchivesLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchArchives()
      .then(setArchives)
      .catch(() => {/* non-fatal */})
      .finally(() => setArchivesLoading(false))
  }, [])

  async function handleReset() {
    setResetting(true)
    setResetError(null)
    try {
      await archiveAndReset(label.trim() || 'Unlabeled session')
      navigate('/')
    } catch (err) {
      console.error('[admin] reset failed:', err)
      setResetError('Reset failed. Check the console for details.')
      setResetting(false)
      setConfirming(false)
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function totalVotes(ratings: ArchivedRating[]) {
    // Overall ratings (child_id null) have games = winner games + loser games.
    // Each comparison is counted once per participant, so total comparisons = max games / 2.
    const overallGames = ratings
      .filter((r) => r.child_id === null)
      .reduce((sum, r) => sum + r.games, 0)
    return Math.round(overallGames / 2)
  }

  function topCamps(ratings: ArchivedRating[], n = 10) {
    return ratings
      .filter((r) => r.child_id === null && r.games > 0)
      .sort((a, b) => b.elo - a.elo)
      .slice(0, n)
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <button
          className="icon-btn"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ←
        </button>
        <span className="top-bar__title">Admin</span>
        <span style={{ width: 40 }} />
      </header>

      <div style={{ padding: '1rem', maxWidth: 480, margin: '0 auto' }}>

        {/* ── Reset section ─────────────────────────────────────────── */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Archive &amp; Reset
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-sub, #888)', marginBottom: '0.75rem' }}>
            Saves a snapshot of all current ratings, then wipes votes and resets
            every camp back to 1000 Elo for a clean test.
          </p>

          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder='Session name, e.g. "Week 1"'
            style={{
              display: 'block',
              width: '100%',
              padding: '0.6rem 0.75rem',
              borderRadius: 8,
              border: '1px solid var(--color-border, #ddd)',
              fontSize: '0.95rem',
              marginBottom: '0.75rem',
              boxSizing: 'border-box',
            }}
          />

          {resetError && (
            <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              {resetError}
            </p>
          )}

          {!confirming ? (
            <button
              className="btn-primary"
              onClick={() => setConfirming(true)}
              style={{ width: '100%' }}
            >
              Archive &amp; Reset All Data
            </button>
          ) : (
            <div
              style={{
                background: 'var(--color-surface, #f5f5f5)',
                borderRadius: 8,
                padding: '0.75rem',
              }}
            >
              <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 500 }}>
                ⚠️ This will permanently wipe all votes and reset all Elo ratings.
                Are you sure?
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-primary"
                  onClick={handleReset}
                  disabled={resetting}
                  style={{ flex: 1 }}
                >
                  {resetting ? 'Resetting…' : 'Yes, reset everything'}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={resetting}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    borderRadius: 8,
                    border: '1px solid var(--color-border, #ddd)',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── Archives section ──────────────────────────────────────── */}
        <section>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Past Sessions
          </h2>

          {archivesLoading && (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-sub, #888)' }}>
              Loading archives…
            </p>
          )}

          {!archivesLoading && archives.length === 0 && (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-sub, #888)' }}>
              No archives yet. Run a reset to create your first snapshot.
            </p>
          )}

          {archives.map((archive) => {
            const isOpen = expandedId === archive.id
            const top = topCamps(archive.ratings)
            const votes = totalVotes(archive.ratings)

            return (
              <div
                key={archive.id}
                style={{
                  border: '1px solid var(--color-border, #ddd)',
                  borderRadius: 10,
                  marginBottom: '0.75rem',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setExpandedId(isOpen ? null : archive.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {archive.label}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-sub, #888)' }}>
                      {formatDate(archive.archived_at)} · {votes} comparisons
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-sub, #888)' }}>
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>

                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--color-border, #ddd)', padding: '0.75rem 1rem' }}>
                    {top.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-sub, #888)' }}>
                        No comparisons were made in this session.
                      </p>
                    ) : (
                      <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
                        {top.map((r, i) => (
                          <li
                            key={r.camp_id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '0.3rem 0',
                              fontSize: '0.875rem',
                              borderBottom: i < top.length - 1 ? '1px solid var(--color-border, #eee)' : 'none',
                            }}
                          >
                            <span>{r.camp_name}</span>
                            <span style={{ color: 'var(--color-sub, #888)', fontVariantNumeric: 'tabular-nums' }}>
                              {r.elo} · {r.games}g
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </section>
      </div>
    </div>
  )
}
