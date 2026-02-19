export type Location = 'ME' | 'ECKE' | 'GC'

export interface Camp {
  id: string
  name: string
  location: Location
  description: string
  image_url: string
  is_active: boolean
  created_at: string
}

export interface Child {
  id: string
  name: string
  created_at: string
}

export interface CampRating {
  id: string
  child_id: string | null  // null = overall
  camp_id: string
  elo: number
  games: number
  wins: number
  losses: number
  updated_at: string
}

export interface Vote {
  id: string
  session_id: string
  child_id: string
  left_camp_id: string
  right_camp_id: string
  winner_camp_id: string
  loser_camp_id: string
  created_at: string
}

/** In-memory enriched view of a rating for the leaderboard */
export interface RatedCamp {
  camp: Camp
  elo: number
  games: number
  wins: number
  losses: number
  rank: number
}

/** Offline vote queue item */
export interface PendingVote {
  id: string
  session_id: string
  child_id: string
  left_camp_id: string
  right_camp_id: string
  winner_camp_id: string
  loser_camp_id: string
  /** Ratings to upsert when vote syncs */
  ratings: RatingUpdate[]
  created_at: string
}

export interface RatingUpdate {
  child_id: string | null
  camp_id: string
  elo: number
  games: number
  wins: number
  losses: number
}
