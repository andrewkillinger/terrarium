/**
 * Persistent device session id stored in localStorage.
 * Generated once per device, reused across visits.
 */
const SESSION_KEY = 'camp_session_id'

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}
