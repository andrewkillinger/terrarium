import { describe, it, expect } from 'vitest'
import { pickPair } from '../lib/pairing'
import type { Camp, CampRating } from '../types'

function makeCamp(id: string, name = id): Camp {
  return {
    id,
    name,
    location: 'ME',
    description: 'test',
    image_url: '',
    is_active: true,
    created_at: new Date().toISOString(),
  }
}

function makeRatingsMap(entries: { camp_id: string; games: number }[]): Map<string, CampRating> {
  const m = new Map<string, CampRating>()
  for (const e of entries) {
    m.set(e.camp_id, {
      id: '',
      child_id: null,
      camp_id: e.camp_id,
      elo: 1000,
      games: e.games,
      wins: 0,
      losses: 0,
      updated_at: '',
    })
  }
  return m
}

describe('pickPair', () => {
  it('returns null when fewer than 2 camps', () => {
    expect(pickPair([], new Map(), [])).toBeNull()
    expect(pickPair([makeCamp('a')], new Map(), [])).toBeNull()
  })

  it('returns a pair of two different camps', () => {
    const camps = [makeCamp('a'), makeCamp('b'), makeCamp('c')]
    const result = pickPair(camps, new Map(), [])
    expect(result).not.toBeNull()
    expect(result![0].id).not.toBe(result![1].id)
  })

  it('works with exactly 2 camps', () => {
    const camps = [makeCamp('a'), makeCamp('b')]
    const result = pickPair(camps, new Map(), [])
    expect(result).not.toBeNull()
    expect(new Set([result![0].id, result![1].id]).size).toBe(2)
  })

  it('falls back gracefully when all pairs are in recent history', () => {
    // Only 2 camps means the single pair will always be the "recent" one
    const camps = [makeCamp('a'), makeCamp('b')]
    const recent: Array<[string, string]> = Array(10).fill(['a', 'b'])
    const result = pickPair(camps, new Map(), recent)
    // Should still return a pair (fallback to full list)
    expect(result).not.toBeNull()
    expect(result![0].id).not.toBe(result![1].id)
  })

  it('prefers camps with fewer games', () => {
    const camps = [makeCamp('a'), makeCamp('b'), makeCamp('c'), makeCamp('d')]
    // 'a' and 'b' have 0 games, 'c' and 'd' have many
    const ratings = makeRatingsMap([
      { camp_id: 'a', games: 0 },
      { camp_id: 'b', games: 0 },
      { camp_id: 'c', games: 100 },
      { camp_id: 'd', games: 100 },
    ])

    // Run many times; the low-game pair should dominate
    const counts: Record<string, number> = { a: 0, b: 0, c: 0, d: 0 }
    for (let i = 0; i < 200; i++) {
      const pair = pickPair(camps, ratings, [])!
      counts[pair[0].id]++
      counts[pair[1].id]++
    }

    // 'a' and 'b' should appear far more often than 'c' and 'd'
    expect(counts['a'] + counts['b']).toBeGreaterThan(counts['c'] + counts['d'])
  })
})
