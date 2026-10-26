import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import refreshTokenModel from '../models/refreshTokenModel.js'

// Sessions use two httpOnly cookies per role:
//   access token  - short-lived JWT read by the auth middleware on every request
//   refresh token - long-lived random string, stored hashed in MongoDB, only
//                   sent to /api/auth and exchanged (rotated) for a new pair
// Customers and the admin panel use different cookie names because both
// apps talk to the same API host and share its cookie jar.

const ACCESS_TTL_SECONDS = 15 * 60
const ROTATION_GRACE_MS = 30 * 1000

export const SESSIONS = {
    user: {
        accessCookie: 'vf_at',
        refreshCookie: 'vf_rt',
        refreshTtlMs: 30 * 24 * 60 * 60 * 1000,
        // each refresh extends the session, so active customers stay signed in
        sliding: true,
    },
    admin: {
        accessCookie: 'vf_admin_at',
        refreshCookie: 'vf_admin_rt',
        refreshTtlMs: 24 * 60 * 60 * 1000,
        // admin sessions end 1 day after sign-in no matter what
        sliding: false,
    },
}

const REFRESH_PATH = '/api/auth'

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

const cookieOptions = (req, maxAge, path) => ({
    httpOnly: true,
    // https in production (req.secure relies on app.set('trust proxy')); plain http on localhost
    secure: req.secure,
    // the store, admin and API are subdomains of one site, so Lax cookies are sent
    // with their requests but not with requests started from other sites
    sameSite: 'lax',
    path,
    maxAge,
})

export const signAccessToken = (role, subject) =>
    jwt.sign({ sub: String(subject), role, type: 'access' }, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL_SECONDS })

// Verifies an access token for `role`; returns its payload or throws
export const verifyAccessToken = (token, role) => {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (payload.type !== 'access' || payload.role !== role) {
        throw new Error('Wrong token type')
    }
    return payload
}

// Signs `subject` in: new refresh token row + both cookies
export const issueSession = async (req, res, role, subject, { expiresAt } = {}) => {
    const session = SESSIONS[role]
    const refreshToken = crypto.randomBytes(48).toString('base64url')
    const expires = expiresAt ?? new Date(Date.now() + session.refreshTtlMs)

    await refreshTokenModel.create({
        tokenHash: hashToken(refreshToken),
        role,
        subject: String(subject),
        expiresAt: expires,
    })

    res.cookie(session.accessCookie, signAccessToken(role, subject), cookieOptions(req, ACCESS_TTL_SECONDS * 1000, '/'))
    res.cookie(session.refreshCookie, refreshToken, cookieOptions(req, expires.getTime() - Date.now(), REFRESH_PATH))
}

export const clearSessionCookies = (req, res, role) => {
    const session = SESSIONS[role]
    const { maxAge, ...base } = cookieOptions(req, 0, '/')
    res.clearCookie(session.accessCookie, { ...base, path: '/' })
    res.clearCookie(session.refreshCookie, { ...base, path: REFRESH_PATH })
}

// Exchanges the refresh cookie for a new access + refresh pair.
// Returns the subject on success, or null (and clears the cookies) if the
// refresh token is missing, unknown, expired or revoked.
export const rotateSession = async (req, res, role) => {
    const session = SESSIONS[role]
    const presented = req.cookies?.[session.refreshCookie]
    if (!presented) return null

    const record = await refreshTokenModel.findOne({ tokenHash: hashToken(presented), role })
    const now = Date.now()

    const fail = () => {
        clearSessionCookies(req, res, role)
        return null
    }

    if (!record || record.revokedAt || record.expiresAt.getTime() <= now) {
        return fail()
    }

    if (record.rotatedAt) {
        // Two tabs refreshing at the same moment both present the same token;
        // allow that for a few seconds. Later reuse means the token was copied:
        // end every session for this account.
        if (now - record.rotatedAt.getTime() > ROTATION_GRACE_MS) {
            await refreshTokenModel.updateMany(
                { subject: record.subject, role, revokedAt: null },
                { revokedAt: new Date() }
            )
            return fail()
        }
    } else {
        record.rotatedAt = new Date()
        await record.save()
    }

    await issueSession(req, res, role, record.subject, {
        expiresAt: session.sliding ? undefined : record.expiresAt,
    })
    return record.subject
}

// Signs out this browser: revokes its refresh token and clears the cookies
export const endSession = async (req, res, role) => {
    const presented = req.cookies?.[SESSIONS[role].refreshCookie]
    if (presented) {
        await refreshTokenModel.updateOne(
            { tokenHash: hashToken(presented), role },
            { revokedAt: new Date() }
        )
    }
    clearSessionCookies(req, res, role)
}

// Signs out every device for an account (used after a password reset)
export const endAllSessions = (role, subject) =>
    refreshTokenModel.updateMany(
        { subject: String(subject), role, revokedAt: null },
        { revokedAt: new Date() }
    )
