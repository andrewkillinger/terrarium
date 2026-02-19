import type { PendingVote } from '../types'

const QUEUE_KEY = 'camp_offline_queue'

export function getPendingVotes(): PendingVote[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? (JSON.parse(raw) as PendingVote[]) : []
  } catch {
    return []
  }
}

export function enqueueVote(vote: PendingVote): void {
  const queue = getPendingVotes()
  queue.push(vote)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function removeVote(id: string): void {
  const queue = getPendingVotes().filter((v) => v.id !== id)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY)
}
