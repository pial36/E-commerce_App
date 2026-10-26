import mongoose from "mongoose";

// One row per issued refresh token. Only a hash of the token is stored.
const refreshTokenSchema = new mongoose.Schema({
    tokenHash: { type: String, required: true, unique: true },
    role: { type: String, required: true, enum: ['user', 'admin'] },
    // user id for customers, 'admin' for the admin panel
    subject: { type: String, required: true, index: true },
    // MongoDB removes the row automatically once this date has passed
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    // set when the token was exchanged for a new one
    rotatedAt: { type: Date },
    // set on logout, password reset or detected token reuse
    revokedAt: { type: Date },
}, { timestamps: true })

const refreshTokenModel = mongoose.models.refreshToken || mongoose.model('refreshToken', refreshTokenSchema);

export default refreshTokenModel
