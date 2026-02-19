import type { Camp, CampRating } from '../types'

const REPEAT_WINDOW = 10

/**
 * Pick a random pair of camps to compare.
 *
 * Strategy:
 *  1. Filter out pairs seen in the last REPEAT_WINDOW votes for this child.
 *  2. Among remaining pairs, prefer those where the total games is lowest
 *     (to ensure balanced sampling).
 *  3. Fall back to fully random if not enough camps.
 */
export function pickPair(
  camps: Camp[],
  ratings: Map<string, CampRating>,
  recentMatchups: Array<[string, string]>,
): [Camp, Camp] | null {
  if (camps.length < 2) return null

  // Build set of recently seen matchup keys
  const recentSet = new Set<string>(
    recentMatchups.slice(-REPEAT_WINDOW).map(([a, b]) => matchupKey(a, b)),
  )

  // Enumerate all valid pairs
  const pairs: Array<[Camp, Camp]> = []
  for (let i = 0; i < camps.length; i++) {
    for (let j = i + 1; j < camps.length; j++) {
      const key = matchupKey(camps[i].id, camps[j].id)
      if (!recentSet.has(key)) {
        pairs.push([camps[i], camps[j]])
      }
    }
  }

  const pool = pairs.length > 0 ? pairs : buildAllPairs(camps)

  // Score each pair: prefer fewer combined games
  const scored = pool.map((pair) => {
    const gA = ratings.get(pair[0].id)?.games ?? 0
    const gB = ratings.get(pair[1].id)?.games ?? 0
    return { pair, score: gA + gB }
  })

  // Sort ascending, pick randomly from the bottom quartile (less-seen camps)
  scored.sort((a, b) => a.score - b.score)
  const cutoff = Math.max(1, Math.ceil(scored.length * 0.25))
  const candidates = scored.slice(0, cutoff)

  const chosen = candidates[Math.floor(Math.random() * candidates.length)]

  // Randomly swap left/right so it isn't always alphabetical
  if (Math.random() < 0.5) {
    return [chosen.pair[1], chosen.pair[0]]
  }
  return chosen.pair
}

function matchupKey(a: string, b: string): string {
  return [a, b].sort().join('|')
}

function buildAllPairs(camps: Camp[]): Array<[Camp, Camp]> {
  const pairs: Array<[Camp, Camp]> = []
  for (let i = 0; i < camps.length; i++) {
    for (let j = i + 1; j < camps.length; j++) {
      pairs.push([camps[i], camps[j]])
    }
  }
  return pairs
}
