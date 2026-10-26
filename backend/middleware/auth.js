import { SESSIONS, verifyAccessToken } from '../utils/authSession.js'

// Customer routes: reads the access token from its httpOnly cookie.
// A 401 tells the store to call /api/auth/refresh and retry once.
const authUser = async (req, res, next) => {

    const token = req.cookies?.[SESSIONS.user.accessCookie]

    if (!token) {
        return res.status(401).json({ success: false, code: 'NOT_AUTHENTICATED', message: 'Please sign in' })
    }

    try {
        const payload = verifyAccessToken(token, 'user')
        req.body.userId = payload.sub
        next()
    } catch (error) {
        res.status(401).json({
            success: false,
            code: error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'NOT_AUTHENTICATED',
            message: 'Please sign in again',
        })
    }

}

export default authUser
