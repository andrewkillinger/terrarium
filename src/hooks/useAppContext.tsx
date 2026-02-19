import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react'
import type { Camp, Child, CampRating } from '../types'
import {
  fetchActiveCamps,
  fetchChildren,
  fetchRatings,
  ensureRatingRows,
  recordVote,
  syncOfflineQueue,
  fetchRecentMatchups,
  archiveAndResetRatings,
} from '../lib/api'
import { pickPair } from '../lib/pairing'
import { getSessionId } from '../lib/session'
import { supabase } from '../lib/supabase'

interface AppState {
  camps: Camp[]
  children: Child[]
  selectedChild: Child | null
  childRatings: Map<string, CampRating>
  overallRatings: Map<string, CampRating>
  currentPair: [Camp, Camp] | null
  loading: boolean
  error: string | null
  isOnline: boolean
  pendingCount: number
  selectedCampId: string | null // for animation
  setSelectedChild: (child: Child) => void
  vote: (winnerCampId: string) => Promise<void>
  retry: () => void
  refreshRatings: () => Promise<void>
  archiveAndReset: (label: string) => Promise<void>
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children: reactChildren }: { children: React.ReactNode }) {
  const [camps, setCamps] = useState<Camp[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChildState] = useState<Child | null>(null)
  const [childRatings, setChildRatings] = useState<Map<string, CampRating>>(new Map())
  const [overallRatings, setOverallRatings] = useState<Map<string, CampRating>>(new Map())
  const [currentPair, setCurrentPair] = useState<[Camp, Camp] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [selectedCampId, setSelectedCampId] = useState<string | null>(null)

  const recentMatchupsRef = useRef<Array<[string, string]>>([])
  // Ref so the realtime subscription callback always sees the current child
  // without needing to re-subscribe when the selected child changes.
  const selectedChildRef = useRef<Child | null>(null)
  const sessionId = getSessionId()

  // Online/offline tracking
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineQueue().then(() => {
        setPendingCount(0)
      })
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Supabase Realtime: listen for camp_ratings UPDATE events and push them
  // directly into state so the leaderboard updates without a page refresh.
  useEffect(() => {
    const channel = supabase
      .channel('camp_ratings_live')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'camp_ratings' },
        (payload) => {
          const updated = payload.new as CampRating
          if (updated.child_id === null) {
            // Overall rating changed — always update
            setOverallRatings((prev) => {
              const next = new Map(prev)
              next.set(updated.camp_id, updated)
              return next
            })
          } else if (updated.child_id === selectedChildRef.current?.id) {
            // Child-specific rating changed for the currently viewed child
            setChildRatings((prev) => {
              const next = new Map(prev)
              next.set(updated.camp_id, updated)
              return next
            })
          }
        },
      )
      .subscribe((status) => {
        console.log('[realtime] camp_ratings channel status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, []) // subscribe once on mount; selectedChildRef keeps the callback current

  // Initial data load
  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [campsData, childrenData] = await Promise.all([
        fetchActiveCamps(),
        fetchChildren(),
      ])

      if (campsData.length === 0) {
        setError('No camps found. Please check your Supabase data.')
        setLoading(false)
        return
      }

      setCamps(campsData)
      setChildren(childrenData)

      const firstChild = childrenData[0] ?? null
      setSelectedChildState(firstChild)
      selectedChildRef.current = firstChild

      // Ensure rating rows exist (idempotent)
      await ensureRatingRows(campsData, childrenData)

      if (firstChild) {
        const [childR, overallR, recent] = await Promise.all([
          fetchRatings(firstChild.id),
          fetchRatings(null),
          fetchRecentMatchups(firstChild.id),
        ])
        setChildRatings(childR)
        setOverallRatings(overallR)
        recentMatchupsRef.current = recent

        const pair = pickPair(campsData, childR, recent)
        setCurrentPair(pair)
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load data. Check your internet connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const setSelectedChild = useCallback(
    async (child: Child) => {
      setSelectedChildState(child)
      selectedChildRef.current = child
      setCurrentPair(null)
      try {
        const [childR, recent] = await Promise.all([
          fetchRatings(child.id),
          fetchRecentMatchups(child.id),
        ])
        setChildRatings(childR)
        recentMatchupsRef.current = recent
        const pair = pickPair(camps, childR, recent)
        setCurrentPair(pair)
      } catch (err) {
        console.error(err)
      }
    },
    [camps],
  )

  const refreshRatings = useCallback(async () => {
    if (!selectedChild) return
    const [childR, overallR] = await Promise.all([
      fetchRatings(selectedChild.id),
      fetchRatings(null),
    ])
    setChildRatings(childR)
    setOverallRatings(overallR)
  }, [selectedChild])

  const vote = useCallback(
    async (winnerCampId: string) => {
      if (!currentPair || !selectedChild || selectedCampId) return

      const [leftCamp, rightCamp] = currentPair
      setSelectedCampId(winnerCampId)

      // Track matchup in recent history
      recentMatchupsRef.current = [
        ...recentMatchupsRef.current,
        [leftCamp.id, rightCamp.id] as [string, string],
      ].slice(-10)

      // Keep a local reference so pickPair uses fresh ratings even before
      // React flushes the setChildRatings state update.
      let latestChildRatings = childRatings
      try {
        const result = await recordVote({
          sessionId,
          childId: selectedChild.id,
          leftCampId: leftCamp.id,
          rightCampId: rightCamp.id,
          winnerCampId,
          childRatings,
          overallRatings,
        })

        latestChildRatings = result.updatedChildRatings
        setChildRatings(result.updatedChildRatings)
        setOverallRatings(result.updatedOverallRatings)
      } catch (err) {
        console.error('Vote failed:', err)
      }

      // Short delay for animation, then advance
      await new Promise((r) => setTimeout(r, 500))
      setSelectedCampId(null)

      const nextPair = pickPair(camps, latestChildRatings, recentMatchupsRef.current)
      setCurrentPair(nextPair)
    },
    [
      currentPair,
      selectedChild,
      selectedCampId,
      sessionId,
      childRatings,
      overallRatings,
      camps,
    ],
  )

  const retry = useCallback(() => {
    loadAll()
  }, [loadAll])

  const archiveAndReset = useCallback(
    async (label: string) => {
      await archiveAndResetRatings(label)
      // Reload everything fresh — ratings back to 1000, votes cleared
      await loadAll()
    },
    [loadAll],
  )

  const value: AppState = {
    camps,
    children,
    selectedChild,
    childRatings,
    overallRatings,
    currentPair,
    loading,
    error,
    isOnline,
    pendingCount,
    selectedCampId,
    setSelectedChild,
    vote,
    retry,
    refreshRatings,
    archiveAndReset,
  }

  return <AppContext.Provider value={value}>{reactChildren}</AppContext.Provider>
}

export function useAppContext(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
