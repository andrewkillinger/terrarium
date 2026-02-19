import { describe, it, expect } from 'vitest'
import {
  expectedScore,
  computeEloUpdate,
  ELO_DEFAULT,
  ELO_K,
} from '../lib/elo'

describe('expectedScore', () => {
  it('returns 0.5 when ratings are equal', () => {
    expect(expectedScore(1000, 1000)).toBeCloseTo(0.5)
  })

  it('returns > 0.5 when ratingA > ratingB', () => {
    expect(expectedScore(1200, 1000)).toBeGreaterThan(0.5)
  })

  it('returns < 0.5 when ratingA < ratingB', () => {
    expect(expectedScore(800, 1000)).toBeLessThan(0.5)
  })

  it('is symmetric: expected(A,B) + expected(B,A) = 1', () => {
    const a = 1150
    const b = 950
    expect(expectedScore(a, b) + expectedScore(b, a)).toBeCloseTo(1)
  })

  it('approaches 1 for a very strong player', () => {
    expect(expectedScore(2000, 1000)).toBeGreaterThan(0.99)
  })
})

describe('computeEloUpdate', () => {
  it('winner gains rating and loser loses rating when equally matched', () => {
    const { newWinnerElo, newLoserElo } = computeEloUpdate(1000, 1000)
    expect(newWinnerElo).toBeGreaterThan(1000)
    expect(newLoserElo).toBeLessThan(1000)
  })

  it('winner gains exactly K/2 when equally matched (expected = 0.5)', () => {
    // K * (1 - 0.5) = K/2
    const { newWinnerElo } = computeEloUpdate(1000, 1000)
    expect(newWinnerElo).toBe(1000 + Math.round(ELO_K * 0.5))
  })

  it('ratings are conserved (total stays the same) within rounding', () => {
    const { newWinnerElo, newLoserElo } = computeEloUpdate(1200, 800)
    // Due to rounding, sum may differ by at most 1
    expect(Math.abs(newWinnerElo + newLoserElo - (1200 + 800))).toBeLessThanOrEqual(1)
  })

  it('strong favourite gains very little when winning', () => {
    const { newWinnerElo } = computeEloUpdate(1600, 800)
    // Expected score is close to 1, so gain is small
    expect(newWinnerElo - 1600).toBeLessThan(5)
  })

  it('underdog gains a lot when winning', () => {
    const { newWinnerElo } = computeEloUpdate(800, 1600)
    expect(newWinnerElo - 800).toBeGreaterThan(20)
  })

  it('uses the default K factor', () => {
    // Equal match: gain = K * 0.5 rounded
    const { newWinnerElo } = computeEloUpdate(ELO_DEFAULT, ELO_DEFAULT)
    expect(newWinnerElo).toBe(ELO_DEFAULT + Math.round(ELO_K / 2))
  })

  it('respects custom K factor', () => {
    const { newWinnerElo } = computeEloUpdate(1000, 1000, 32)
    expect(newWinnerElo).toBe(1000 + Math.round(32 / 2))
  })

  it('never produces negative ratings from moderate differences', () => {
    const { newLoserElo } = computeEloUpdate(1000, 100)
    expect(newLoserElo).toBeGreaterThanOrEqual(0)
  })
})

describe('Elo constants', () => {
  it('ELO_DEFAULT is 1000', () => {
    expect(ELO_DEFAULT).toBe(1000)
  })

  it('ELO_K is 24', () => {
    expect(ELO_K).toBe(24)
  })
})
