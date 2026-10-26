import axios from 'axios'

// The session lives in httpOnly cookies set by the API, so JavaScript never
// sees a token. Every request sends the cookies; when the short-lived access
// cookie has run out the API answers 401, and we swap the refresh cookie for
// new ones (once, shared by all requests waiting at that moment) and retry.

axios.defaults.withCredentials = true

const backendUrl = import.meta.env.VITE_BACKEND_URL

let refreshing = null

// Resolves to the signed-in customer ({ name, email }) or null
export const refreshSession = () => {
    if (!refreshing) {
        refreshing = axios.post(backendUrl + '/api/auth/refresh')
            .then(response => response.data.user || null)
            .catch(() => null)
            .finally(() => { refreshing = null })
    }
    return refreshing
}

let onSignedOut = () => {}
export const setSignedOutHandler = (handler) => { onSignedOut = handler }

axios.interceptors.response.use(response => response, async (error) => {
    const { config, response } = error
    if (response?.status === 401 && config && !config._retried && !config.url.includes('/api/auth/')) {
        config._retried = true
        const user = await refreshSession()
        if (user) return axios(config)
        onSignedOut()
        error.message = 'Please sign in to continue'
    }
    return Promise.reject(error)
})
