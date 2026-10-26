import validator from "validator"
import bcrypt from "bcrypt"
import crypto from 'crypto'
import userModel from "../models/userModel.js"
import { sendMail, codeEmail } from "../config/mailer.js"
import { issueSession, endAllSessions } from "../utils/authSession.js"
import { publicUser } from "./authController.js"

// Signs the customer in with httpOnly session cookies and replies with their profile
const signInUser = async (req, res, user) => {
    await issueSession(req, res, 'user', user._id)
    res.json({ success: true, user: publicUser(user) })
}

// at least 1 uppercase, 1 lowercase, 1 number, 1 special character, min 8 characters
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const PASSWORD_RULES = "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character"

const CODE_TTL_MINUTES = 10
const CODE_MAX_ATTEMPTS = 5
const RESEND_COOLDOWN_MS = 60 * 1000

const hashCode = (code) => crypto.createHash('sha256').update(String(code)).digest('hex')

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

// accounts created before emails were normalised may contain capitals
const findUserByEmail = (email) => {
    const escaped = normalizeEmail(email).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return userModel.findOne({ email: { $regex: `^${escaped}$`, $options: 'i' } })
}

// Creates a 6-digit code, stores its hash on the user under `field`, and emails it.
// Throws if a code was sent less than a minute ago.
const issueCode = async (user, field, emailContent) => {
    const previous = user[field]
    if (previous?.sentAt && Date.now() - previous.sentAt < RESEND_COOLDOWN_MS) {
        const wait = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - previous.sentAt)) / 1000)
        throw new Error(`Please wait ${wait} seconds before requesting another code`)
    }

    const code = String(crypto.randomInt(100000, 1000000))
    user[field] = {
        codeHash: hashCode(code),
        expiresAt: Date.now() + CODE_TTL_MINUTES * 60 * 1000,
        sentAt: Date.now(),
        attempts: 0,
    }
    await user.save()

    await sendMail({ to: user.email, ...emailContent(code) })
}

// Checks a submitted code against `field`; returns an error message or null.
const checkCode = async (user, field, code) => {
    const entry = user[field]
    if (!entry?.codeHash) return "Please request a new code"
    if (Date.now() > entry.expiresAt) return "This code has expired. Please request a new one"
    if (entry.attempts >= CODE_MAX_ATTEMPTS) return "Too many attempts. Please request a new code"

    if (hashCode(String(code).trim()) !== entry.codeHash) {
        entry.attempts += 1
        user.markModified(field)
        await user.save()
        return "Incorrect code"
    }
    return null
}

const sendVerificationCode = (user) => issueCode(user, 'emailVerification', (code) => ({
    subject: `${code} is your Velariq Fashion verification code`,
    ...codeEmail({
        heading: 'Confirm your email',
        intro: `Hi ${user.name}, use this code to confirm your email address for your Velariq Fashion account.`,
        code,
        minutes: CODE_TTL_MINUTES,
    }),
}))

const sendResetCode = (user) => issueCode(user, 'passwordReset', (code) => ({
    subject: `${code} is your Velariq Fashion password reset code`,
    ...codeEmail({
        heading: 'Reset your password',
        intro: `Hi ${user.name}, use this code to set a new password for your Velariq Fashion account.`,
        code,
        minutes: CODE_TTL_MINUTES,
    }),
}))

// Route for User login
const loginUser = async (req,res) => {
    try {
        const {email,password} = req.body;

        const user = await findUserByEmail(email);

        if (!user) {
            return res.json({success:false, message:"User doesn't exits"})
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({success:false, message: 'Invalid credential'})
        }

        // unverified accounts (new or created before verification existed) confirm their email first
        if (!user.emailVerified) {
            try {
                await sendVerificationCode(user)
            } catch (error) {
                // a code sent within the last minute is still valid; anything else is a real failure
                if (!/Please wait/.test(error.message)) throw error
            }
            return res.json({success:true, needsVerification:true, email:user.email})
        }

        await signInUser(req, res, user)

    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }


}

// Route for Register user
const registerUser = async (req,res) => {

    try {
        const { name, password } = req.body
        const email = normalizeEmail(req.body.email)

        //validating email format & strong Password
        if (!validator.isEmail(email)) {
            return res.json({success:false, message:"Please enter Valid email"})
        }

        //checking user already exists or not
        const exists = await findUserByEmail(email);
        if (exists) {
            return res.json({success:false, message:"User already exits"})
        }

         // Validate password strength
         if (!passwordPattern.test(password)) {
             return res.json({ success: false, message: PASSWORD_RULES });
         }
        // Hasing user password
        const salt = await bcrypt.genSalt(10)
        const hashesPassword = await bcrypt.hash(password,salt)

        const newUser = new userModel({
            name,
            email,
            password:hashesPassword,
            emailVerified:false,
        })

        const user = await newUser.save()

        // the account is usable only after the emailed code is confirmed
        try {
            await sendVerificationCode(user)
        } catch (error) {
            // don't leave an account behind that can never be verified
            await userModel.findByIdAndDelete(user._id)
            throw error
        }

        res.json({success:true, needsVerification:true, email:user.email})


    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }

}

// Route to confirm an email with the 6-digit code; signs the user in
const verifyEmail = async (req,res) => {
    try {
        const { email, code } = req.body

        const user = await findUserByEmail(email)
        if (!user) {
            return res.json({success:false, message:"Please request a new code"})
        }
        if (user.emailVerified) {
            return signInUser(req, res, user)
        }

        const error = await checkCode(user, 'emailVerification', code)
        if (error) {
            return res.json({success:false, message:error})
        }

        user.emailVerified = true
        user.emailVerification = undefined
        await user.save()

        await signInUser(req, res, user)

    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

// Route to send the verification code again
const resendVerification = async (req,res) => {
    try {
        const user = await findUserByEmail(req.body.email)
        if (user && !user.emailVerified) {
            await sendVerificationCode(user)
        }
        res.json({success:true, message:"A new code has been sent"})

    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

// Route to start a password reset: emails a code if the account exists.
// The reply is the same either way so it can't be used to discover accounts.
const forgotPassword = async (req,res) => {
    try {
        const email = normalizeEmail(req.body.email)
        if (!validator.isEmail(email)) {
            return res.json({success:false, message:"Please enter Valid email"})
        }

        const user = await findUserByEmail(email)
        if (user) {
            try {
                await sendResetCode(user)
            } catch (error) {
                // during the resend cooldown the earlier code still works
                if (!/Please wait/.test(error.message)) throw error
            }
        }
        res.json({success:true, message:"If an account exists for this email, we've sent a reset code"})

    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

// Route to set a new password with the emailed code; signs the user in
const resetPassword = async (req,res) => {
    try {
        const { email, code, password } = req.body

        const user = await findUserByEmail(email)
        if (!user) {
            return res.json({success:false, message:"Please request a new code"})
        }

        const error = await checkCode(user, 'passwordReset', code)
        if (error) {
            return res.json({success:false, message:error})
        }

        if (!passwordPattern.test(password)) {
            return res.json({ success: false, message: PASSWORD_RULES });
        }

        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(password,salt)
        user.passwordReset = undefined
        // receiving the code proves they own the address
        user.emailVerified = true
        user.emailVerification = undefined
        await user.save()

        // a new password signs out every other device, then signs in this one
        await endAllSessions('user', user._id)
        await signInUser(req, res, user)

    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

// Route for admin login
const adminLogin = async (req,res) => {

   try {

    const {email,password} = req.body

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        await issueSession(req, res, 'admin', 'admin')
        res.json({success:true})
    }else{
        res.json({success:false,message:"Invalid credentials"})
    }


   } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
   }

}

export { loginUser,registerUser,adminLogin,verifyEmail,resendVerification,forgotPassword,resetPassword }
