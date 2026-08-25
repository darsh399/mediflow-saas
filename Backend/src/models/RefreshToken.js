import mongoose from 'mongoose'

const refreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
  revokedAt: { type: Date },
}, { timestamps: true })

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('RefreshToken', refreshTokenSchema)
