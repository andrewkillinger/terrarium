import { useNavigate, useLocation } from 'react-router-dom'
import type { Child } from '../types'
import ChildSelector from './ChildSelector'

interface Props {
  children: Child[]
  selectedChild: Child | null
  onSelectChild: (child: Child) => void
  pendingCount: number
}

export default function TopBar({ children, selectedChild, onSelectChild, pendingCount }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const isLeaderboard = location.pathname === '/leaderboard'

  return (
    <header className="top-bar">
      {isLeaderboard ? (
        <>
          <button
            className="icon-btn"
            onClick={() => navigate('/')}
            aria-label="Back to voting"
          >
            ←
          </button>
          <span className="top-bar__title">Leaderboard</span>
          <ChildSelector
            children={children}
            selected={selectedChild}
            onChange={onSelectChild}
          />
        </>
      ) : (
        <>
          <span className="top-bar__title">
            🏕️ Camp Picks
            {pendingCount > 0 && (
              <span className="sync-dot" title={`${pendingCount} votes pending sync`} />
            )}
          </span>
          <ChildSelector
            children={children}
            selected={selectedChild}
            onChange={onSelectChild}
          />
          <div className="top-bar__actions">
            <button
              className="icon-btn"
              onClick={() => navigate('/leaderboard')}
              aria-label="View leaderboard"
              title="Leaderboard"
            >
              🏆
            </button>
          </div>
        </>
      )}
    </header>
  )
}
