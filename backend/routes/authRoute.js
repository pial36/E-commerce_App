import express from 'express'
import { refreshUser, logoutUser, refreshAdmin, logoutAdmin } from '../controllers/authController.js'

// The refresh cookies are scoped to this path, so they are only sent here
const authRouter = express.Router()

authRouter.post('/refresh', refreshUser)
authRouter.post('/logout', logoutUser)
authRouter.post('/admin/refresh', refreshAdmin)
authRouter.post('/admin/logout', logoutAdmin)

export default authRouter
