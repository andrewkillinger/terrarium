/**
 * Elo rating system implementation.
 * K-factor: 24 (configurable)
 * Expected score: 1 / (1 + 10^((Rb - Ra) / 400))
 */

export const ELO_K = 24
export const ELO_DEFAULT = 1000

/**
 * Compute the expected score for player A when facing player B.
 */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

export interface EloResult {
  newWinnerElo: number
  newLoserElo: number
}

/**
 * Compute new Elo ratings after a match.
 * @param winnerElo - current Elo of the winner
 * @param loserElo  - current Elo of the loser
 * @param k         - K-factor (default ELO_K)
 */
export function computeEloUpdate(
  winnerElo: number,
  loserElo: number,
  k: number = ELO_K,
): EloResult {
  const expectedWinner = expectedScore(winnerElo, loserElo)
  const expectedLoser = expectedScore(loserElo, winnerElo)

  const newWinnerElo = Math.round(winnerElo + k * (1 - expectedWinner))
  const newLoserElo = Math.round(loserElo + k * (0 - expectedLoser))

  return { newWinnerElo, newLoserElo }
}
