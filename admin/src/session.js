// Admin session rules: the panel signs out when the token expires, after a
// period with no activity (also while the tab was closed), or when the API
// says the session is no longer valid.

export const IDLE_LIMIT_MS = 30 * 60 * 1000
const LAST_ACTIVITY_KEY = 'adminLastActivity'

// Expiry time (ms) from the JWT payload, or null for tokens without one
export const getTokenExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

export const markActivity = () => {
  try { localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now())) } catch { /* storage unavailable */ }
}

export const getLastActivity = () => {
  const value = Number(localStorage.getItem(LAST_ACTIVITY_KEY))
  return Number.isFinite(value) && value > 0 ? value : null
}

export const isIdleTooLong = () => {
  const last = getLastActivity()
  return last !== null && Date.now() - last > IDLE_LIMIT_MS
}

// Messages the backend's adminAuth / jwt.verify send for a bad or expired token
export const isAuthFailure = (message = '') =>
  /not authori|jwt expired|jwt malformed|invalid signature|invalid token|jwt must be provided/i.test(message)
