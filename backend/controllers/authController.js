import userModel from "../models/userModel.js"
import { rotateSession, endSession } from "../utils/authSession.js"

// what the store needs to know about the signed-in customer
export const publicUser = (user) => ({ name: user.name, email: user.email })

// Customer: swap the refresh cookie for new cookies. The store also calls this
// on page load to find out whether someone is signed in.
const refreshUser = async (req,res) => {
    try {
        const userId = await rotateSession(req, res, 'user')
        const user = userId && await userModel.findById(userId)
        if (!user) {
            return res.status(401).json({ success: false, message: 'Not signed in' })
        }
        res.json({ success: true, user: publicUser(user) })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

const logoutUser = async (req,res) => {
    try {
        await endSession(req, res, 'user')
        res.json({ success: true })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

const refreshAdmin = async (req,res) => {
    try {
        const subject = await rotateSession(req, res, 'admin')
        if (!subject) {
            return res.status(401).json({ success: false, message: 'Not signed in' })
        }
        res.json({ success: true })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

const logoutAdmin = async (req,res) => {
    try {
        await endSession(req, res, 'admin')
        res.json({ success: true })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

export { refreshUser, logoutUser, refreshAdmin, logoutAdmin }
