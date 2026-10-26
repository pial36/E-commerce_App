import { SESSIONS, verifyAccessToken } from '../utils/authSession.js'

// Admin routes: reads the admin access token from its httpOnly cookie.
// A 401 tells the admin panel to call /api/auth/admin/refresh and retry once.
const adminAuth = async (req,res,next) => {

    const token = req.cookies?.[SESSIONS.admin.accessCookie]

    if (!token) {
        return res.status(401).json({ success: false, code: 'NOT_AUTHENTICATED', message: 'Not Authorized Login Again' })
    }

    try {
        verifyAccessToken(token, 'admin')
        next()
    } catch (error) {
        res.status(401).json({
            success: false,
            code: error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'NOT_AUTHENTICATED',
            message: 'Not Authorized Login Again',
        })
    }

}

export default adminAuth
