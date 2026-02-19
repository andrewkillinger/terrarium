import { supabase } from './supabase'
import { computeEloUpdate, ELO_DEFAULT } from './elo'
import { enqueueVote, getPendingVotes, removeVote } from './offlineQueue'
import type { Camp, Child, CampRating, RatingUpdate, PendingVote } from '../types'

// ─── Camps ───────────────────────────────────────────────────────────────────

export async function fetchActiveCamps(): Promise<Camp[]> {
  const { data, error } = await supabase
    .from('camps')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data as Camp[]
}

// ─── Children ─────────────────────────────────────────────────────────────────

export async function fetchChildren(): Promise<Child[]> {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .order('name')

  if (error) throw error
  return data as Child[]
}

// ─── Ratings ──────────────────────────────────────────────────────────────────

/**
 * Fetch all ratings for a given child (null = overall).
 * Returns a map keyed by camp_id.
 */
export async function fetchRatings(
  childId: string | null,
): Promise<Map<string, CampRating>> {
  const query = supabase.from('camp_ratings').select('*')

  if (childId === null) {
    query.is('child_id', null)
  } else {
    query.eq('child_id', childId)
  }

  const { data, error } = await query
  if (error) throw error

  const map = new Map<string, CampRating>()
  for (const row of data as CampRating[]) {
    map.set(row.camp_id, row)
  }
  return map
}

/**
 * Ensure a rating row exists for every (child, camp) combo.
 * Uses upsert with ignoreDuplicates so it's idempotent.
 */
export async function ensureRatingRows(
  camps: Camp[],
  children: Child[],
): Promise<void> {
  // Build rows: one per (child, camp) + one overall (child_id = null) per camp
  const rows: Omit<CampRating, 'id' | 'updated_at'>[] = []

  for (const camp of camps) {
    // Per-child
    for (const child of children) {
      rows.push({
        child_id: child.id,
        camp_id: camp.id,
        elo: ELO_DEFAULT,
        games: 0,
        wins: 0,
        losses: 0,
      })
    }
    // Overall (child_id = null)
    rows.push({
      child_id: null,
      camp_id: camp.id,
      elo: ELO_DEFAULT,
      games: 0,
      wins: 0,
      losses: 0,
    })
  }

  const { error } = await supabase
    .from('camp_ratings')
    .upsert(rows as never[], {
      onConflict: 'child_id,camp_id',
      ignoreDuplicates: true,
    })

  if (error) {
    // Non-fatal: rows may already exist; log but continue
    console.warn('ensureRatingRows warning:', error.message)
  }
}

// ─── Voting ───────────────────────────────────────────────────────────────────

export interface RecordVoteParams {
  sessionId: string
  childId: string
  leftCampId: string
  rightCampId: string
  winnerCampId: string
  childRatings: Map<string, CampRating>
  overallRatings: Map<string, CampRating>
}

export interface RecordVoteResult {
  updatedChildRatings: Map<string, CampRating>
  updatedOverallRatings: Map<string, CampRating>
}

/**
 * Record a vote and update Elo ratings.
 * - Computes new Elo in the frontend.
 * - Writes vote row + upserts two rating rows (winner, loser) for each context
 *   (child + overall).
 * - If offline, queues the vote locally and syncs on reconnect.
 */
export async function recordVote(
  params: RecordVoteParams,
): Promise<RecordVoteResult> {
  const {
    sessionId,
    childId,
    leftCampId,
    rightCampId,
    winnerCampId,
    childRatings,
    overallRatings,
  } = params

  const loserCampId =
    winnerCampId === leftCampId ? rightCampId : leftCampId

  // Compute updated ratings
  const childWinner = childRatings.get(winnerCampId) ?? makeDefaultRating(childId, winnerCampId)
  const childLoser = childRatings.get(loserCampId) ?? makeDefaultRating(childId, loserCampId)
  const overallWinner = overallRatings.get(winnerCampId) ?? makeDefaultRating(null, winnerCampId)
  const overallLoser = overallRatings.get(loserCampId) ?? makeDefaultRating(null, loserCampId)

  const childElo = computeEloUpdate(childWinner.elo, childLoser.elo)
  const overallElo = computeEloUpdate(overallWinner.elo, overallLoser.elo)

  const ratingUpdates: RatingUpdate[] = [
    {
      child_id: childId,
      camp_id: winnerCampId,
      elo: childElo.newWinnerElo,
      games: childWinner.games + 1,
      wins: childWinner.wins + 1,
      losses: childWinner.losses,
    },
    {
      child_id: childId,
      camp_id: loserCampId,
      elo: childElo.newLoserElo,
      games: childLoser.games + 1,
      wins: childLoser.wins,
      losses: childLoser.losses + 1,
    },
    {
      child_id: null,
      camp_id: winnerCampId,
      elo: overallElo.newWinnerElo,
      games: overallWinner.games + 1,
      wins: overallWinner.wins + 1,
      losses: overallWinner.losses,
    },
    {
      child_id: null,
      camp_id: loserCampId,
      elo: overallElo.newLoserElo,
      games: overallLoser.games + 1,
      wins: overallLoser.wins,
      losses: overallLoser.losses + 1,
    },
  ]

  // Build optimistic in-memory updated maps
  const updatedChildRatings = new Map(childRatings)
  const updatedOverallRatings = new Map(overallRatings)

  updatedChildRatings.set(winnerCampId, {
    ...childWinner,
    ...ratingUpdates[0],
    updated_at: new Date().toISOString(),
  })
  updatedChildRatings.set(loserCampId, {
    ...childLoser,
    ...ratingUpdates[1],
    updated_at: new Date().toISOString(),
  })
  updatedOverallRatings.set(winnerCampId, {
    ...overallWinner,
    ...ratingUpdates[2],
    updated_at: new Date().toISOString(),
  })
  updatedOverallRatings.set(loserCampId, {
    ...overallLoser,
    ...ratingUpdates[3],
    updated_at: new Date().toISOString(),
  })

  const pendingVote: PendingVote = {
    id: crypto.randomUUID(),
    session_id: sessionId,
    child_id: childId,
    left_camp_id: leftCampId,
    right_camp_id: rightCampId,
    winner_camp_id: winnerCampId,
    loser_camp_id: loserCampId,
    ratings: ratingUpdates,
    created_at: new Date().toISOString(),
  }

  if (!navigator.onLine) {
    enqueueVote(pendingVote)
  } else {
    await persistVote(pendingVote)
  }

  return { updatedChildRatings, updatedOverallRatings }
}

async function persistVote(vote: PendingVote): Promise<void> {
  // Insert the vote record
  const { error: voteError } = await supabase.from('votes').insert({
    id: vote.id,
    session_id: vote.session_id,
    child_id: vote.child_id,
    left_camp_id: vote.left_camp_id,
    right_camp_id: vote.right_camp_id,
    winner_camp_id: vote.winner_camp_id,
    loser_camp_id: vote.loser_camp_id,
    created_at: vote.created_at,
  })

  if (voteError) {
    // Queue for later if network error
    enqueueVote(vote)
    console.warn('Vote insert failed, queued offline:', voteError.message)
    return
  }

  // Upsert child-specific ratings (child_id IS NOT NULL)
  // These work with the partial index camp_ratings_child_camp_uq on (child_id, camp_id)
  const childRatingUpdates = vote.ratings.filter((r) => r.child_id !== null)
  if (childRatingUpdates.length > 0) {
    const { error } = await supabase.from('camp_ratings').upsert(
      childRatingUpdates.map((r) => ({
        child_id: r.child_id,
        camp_id: r.camp_id,
        elo: r.elo,
        games: r.games,
        wins: r.wins,
        losses: r.losses,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'child_id,camp_id' },
    )
    if (error) {
      console.warn('Child rating upsert warning:', error.message)
    }
  }

  // Update overall ratings (child_id IS NULL) using UPDATE+filter instead of upsert.
  // The partial index camp_ratings_overall_camp_uq is on (camp_id) only, so
  // ON CONFLICT (child_id, camp_id) cannot resolve NULL child_id rows.
  const overallRatingUpdates = vote.ratings.filter((r) => r.child_id === null)
  for (const r of overallRatingUpdates) {
    const { error } = await supabase
      .from('camp_ratings')
      .update({
        elo: r.elo,
        games: r.games,
        wins: r.wins,
        losses: r.losses,
        updated_at: new Date().toISOString(),
      })
      .eq('camp_id', r.camp_id)
      .is('child_id', null)
    if (error) {
      console.warn('Overall rating update warning:', error.message)
    }
  }
}

/**
 * Sync any offline-queued votes once the device comes back online.
 */
export async function syncOfflineQueue(): Promise<void> {
  const queue = getPendingVotes()
  if (queue.length === 0) return

  for (const vote of queue) {
    try {
      await persistVote(vote)
      removeVote(vote.id)
    } catch (err) {
      console.warn('Sync failed for vote', vote.id, err)
      break // stop on first failure; retry next time
    }
  }
}

/**
 * Recent matchups for this child, fetched from DB.
 * Returns pairs as [left_camp_id, right_camp_id].
 */
export async function fetchRecentMatchups(
  childId: string,
  limit = 10,
): Promise<Array<[string, string]>> {
  const { data, error } = await supabase
    .from('votes')
    .select('left_camp_id, right_camp_id')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return (data as { left_camp_id: string; right_camp_id: string }[]).map(
    (r) => [r.left_camp_id, r.right_camp_id],
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDefaultRating(
  childId: string | null,
  campId: string,
): CampRating {
  return {
    id: '',
    child_id: childId,
    camp_id: campId,
    elo: ELO_DEFAULT,
    games: 0,
    wins: 0,
    losses: 0,
    updated_at: new Date().toISOString(),
  }
}
