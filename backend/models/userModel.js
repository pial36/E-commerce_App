import mongoose from "mongoose";

// One-time 6-digit code sent by email (stored hashed)
const emailCodeSchema = new mongoose.Schema({
    codeHash: { type: String },
    expiresAt: { type: Number },
    sentAt: { type: Number },
    attempts: { type: Number, default: 0 },
}, { _id: false })

const userSchema = new mongoose.Schema({
    name: { type : String, required: true },
    email: { type : String, required: true, unique: true },
    password: { type : String, required: true },
    cartData: { type : Object, default: {}},
    // accounts created before verification existed have no value here and
    // are treated as unverified, so they confirm their email on next login
    emailVerified: { type: Boolean, default: false },
    emailVerification: { type: emailCodeSchema, default: undefined },
    passwordReset: { type: emailCodeSchema, default: undefined },
}, { minimize: false })

const userModel = mongoose.models.user || mongoose.model('user',userSchema);

export default userModel
