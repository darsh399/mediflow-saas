import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Company from '../models/Company.js'
import RefreshToken from '../models/RefreshToken.js'
import createToken from '../utils/createToken.js'
import getCookieOptions from '../utils/getCookieOptions.js'

const REFRESH_COOKIE = 'refreshToken'

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function cookieValue(req, name) {
  const cookies = String(req.headers.cookie || '').split(';')
  const entry = cookies.map((item) => item.trim().split('=')) .find(([key]) => key === name)
  return entry ? decodeURIComponent(entry.slice(1).join('=')) : null
}

function refreshCookieOptions() {
  return { ...getCookieOptions(), maxAge: Number(process.env.REFRESH_TOKEN_COOKIE_MAX_AGE_MS || 7 * 24 * 60 * 60 * 1000) }
}

export async function issueSession(res, user) {
  const accessToken = createToken({ id: user._id }, process.env.ACCESS_TOKEN_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '1h')
  const refreshToken = jwt.sign({ id: user._id, type: 'refresh', jti: crypto.randomUUID() }, process.env.JWT_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' })
  await RefreshToken.create({ tokenHash: hashToken(refreshToken), userId: user._id, expiresAt: new Date(Date.now() + Number(process.env.REFRESH_TOKEN_COOKIE_MAX_AGE_MS || 7 * 24 * 60 * 60 * 1000)) })
  res.cookie('token', accessToken, { ...getCookieOptions(), maxAge: Number(process.env.ACCESS_TOKEN_COOKIE_MAX_AGE_MS || 60 * 60 * 1000) })
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions())
  return accessToken
}

export async function refreshSession(req, res) {
  const rawToken = cookieValue(req, REFRESH_COOKIE)
  if (!rawToken) return null
  let payload
  try {
    payload = jwt.verify(rawToken, process.env.JWT_SECRET)
  } catch {
    return null
  }
  if (payload.type !== 'refresh' || !payload.id) return null
  const record = await RefreshToken.findOneAndUpdate(
    { tokenHash: hashToken(rawToken), userId: payload.id, revokedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
    { $set: { revokedAt: new Date() } },
    { new: true }
  )
  if (!record) return null
  const user = await User.findById(payload.id).select('_id email role companyId active blocked')
  if (!user || user.blocked || user.active === false) return null
  if (user.companyId && user.role !== 'super_admin') {
    const company = await Company.findById(user.companyId).select('status isActive')
    if (!company || !company.isActive || company.status !== 'ACTIVE') return null
  }
  const accessToken = await issueSession(res, user)
  return { accessToken, user }
}

export async function revokeRefreshToken(req) {
  const rawToken = cookieValue(req, REFRESH_COOKIE)
  if (rawToken) await RefreshToken.updateOne({ tokenHash: hashToken(rawToken), revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } })
}

export function clearSessionCookies(res) {
  const options = getCookieOptions()
  res.clearCookie('token', options)
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions())
}
