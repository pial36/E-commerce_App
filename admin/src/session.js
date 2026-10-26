import axios from 'axios'

// The admin session lives in httpOnly cookies set by the API (separate from
// customer cookies), so JavaScript never sees a token. Every request sends the
// cookies; when the 15-minute access cookie has run out the API answers 401,
// and we swap the refresh cookie for new ones once and retry. The server ends
// admin sessions 1 day after sign-in; the panel also signs out after a period
// with no activity, including while the tab was closed.

axios.defaults.withCredentials = true

const backendUrl = import.meta.env.VITE_BACKEND_URL

export const IDLE_LIMIT_MS = 30 * 60 * 1000
const LAST_ACTIVITY_KEY = 'adminLastActivity'

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

let refreshing = null

// Resolves to true when the admin session could be renewed
export const refreshAdminSession = () => {
  if (!refreshing) {
    refreshing = axios.post(backendUrl + '/api/auth/admin/refresh')
      .then(response => !!response.data.success)
      .catch(() => false)
      .finally(() => { refreshing = null })
  }
  return refreshing
}

export const logoutAdminSession = () =>
  axios.post(backendUrl + '/api/auth/admin/logout').catch(() => {})

let onSignedOut = () => {}
export const setSignedOutHandler = (handler) => { onSignedOut = handler }

axios.interceptors.response.use(response => response, async (error) => {
  const { config, response } = error
  if (response?.status === 401 && config && !config._retried && !config.url.includes('/api/auth/')) {
    config._retried = true
    if (await refreshAdminSession()) return axios(config)
    onSignedOut()
    error.message = 'Your session has expired. Please sign in again.'
  }
  return Promise.reject(error)
})
