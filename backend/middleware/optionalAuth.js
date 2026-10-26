import { SESSIONS, verifyAccessToken } from '../utils/authSession.js'

// For routes open to guests as well as signed-in customers (checkout).
// Sets req.body.userId when a valid customer session cookie is present.
//
// A request only counts as a guest when the store says so with
// `asGuest: true`. Otherwise a signed-in customer whose 15-minute access
// cookie has just run out would silently place a guest order; instead they
// get a 401, the store refreshes the session and retries.
const optionalAuth = async (req, res, next) => {

    // never trust a user id sent by the client
    delete req.body.userId

    const token = req.cookies?.[SESSIONS.user.accessCookie]

    if (token) {
        try {
            req.body.userId = verifyAccessToken(token, 'user').sub
            return next()
        } catch (error) {
            // fall through: treated like a missing cookie
        }
    }

    if (req.body.asGuest === true) {
        return next()
    }

    res.status(401).json({ success: false, code: 'NOT_AUTHENTICATED', message: 'Please sign in again' })
}

export default optionalAuth
