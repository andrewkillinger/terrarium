import { Routes, Route } from 'react-router-dom'
import { AppProvider } from './hooks/useAppContext'
import VotePage from './pages/VotePage'
import LeaderboardPage from './pages/LeaderboardPage'

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<VotePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Routes>
    </AppProvider>
  )
}
