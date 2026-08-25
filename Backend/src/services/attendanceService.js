import Attendance from '../models/Attendance.js'

function startOfDay(value = new Date()) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function endOfDay(value = new Date()) {
  const date = startOfDay(value)
  date.setDate(date.getDate() + 1)
  return date
}

function calculateSessionHours(session) {
  if (!session.checkIn || !session.checkOut) return 0
  const breakMilliseconds = (session.breaks || []).reduce((total, item) => {
    if (!item.endedAt) return total
    return total + (new Date(item.endedAt) - new Date(item.startedAt))
  }, 0)
  return Math.max(0, Number((((new Date(session.checkOut) - new Date(session.checkIn) - breakMilliseconds) / 3600000)).toFixed(2)))
}

function calculateWorkingHours(attendance) {
  if (attendance.sessions?.length) return Number(attendance.sessions.reduce((total, session) => total + calculateSessionHours(session), 0).toFixed(2))
  return calculateSessionHours(attendance)
}

function normalizeLegacySessions(attendance) {
  if (attendance.sessions?.length || !attendance.checkIn) return
  attendance.sessions = [{ checkIn: attendance.checkIn, checkOut: attendance.checkOut, breaks: attendance.breaks || [], location: attendance.location }]
}

function validateLocation(location) {
  if (location === undefined) return undefined
  if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') throw new Error('Location latitude and longitude are required')
  if (location.latitude < -90 || location.latitude > 90 || location.longitude < -180 || location.longitude > 180) throw new Error('Invalid location coordinates')
  return { latitude: location.latitude, longitude: location.longitude, ...(typeof location.accuracy === 'number' ? { accuracy: location.accuracy } : {}) }
}

export async function getToday(companyId, employeeId) {
  return Attendance.findOne({ companyId, employeeId, date: { $gte: startOfDay(), $lt: endOfDay() } })
}

export async function checkIn({ companyId, employeeId, location, userAgent, platform }) {
  const existing = await getToday(companyId, employeeId)
  if (existing) normalizeLegacySessions(existing)
  const attendance = existing || new Attendance({ companyId, employeeId, date: startOfDay() })
  const checkInTime = new Date()
  const openSession = attendance.sessions?.find((session) => !session.checkOut)
  if (openSession) throw new Error('Already checked in. Check out before starting another session')
  attendance.sessions.push({ checkIn: checkInTime, location: { checkIn: validateLocation(location) } })
  if (!attendance.checkIn) attendance.checkIn = checkInTime
  attendance.status = 'PRESENT'
  attendance.device = { userAgent, platform }
  return attendance.save()
}

export async function checkOut({ companyId, employeeId, location }) {
  const attendance = await getToday(companyId, employeeId)
  if (!attendance) throw new Error('Check in before checking out')
  normalizeLegacySessions(attendance)
  const session = attendance.sessions.find((item) => !item.checkOut)
  if (!session) throw new Error('Check in before checking out')
  session.checkOut = new Date()
  session.location = { ...(session.location || {}), checkOut: validateLocation(location) }
  attendance.checkOut = session.checkOut
  attendance.totalWorkingHours = calculateWorkingHours(attendance)
  if (attendance.totalWorkingHours < 4) attendance.status = 'HALF_DAY'
  return attendance.save()
}

export async function toggleBreak({ companyId, employeeId }) {
  const attendance = await getToday(companyId, employeeId)
  if (!attendance) throw new Error('Active attendance is required for a break')
  normalizeLegacySessions(attendance)
  const session = attendance.sessions.find((item) => !item.checkOut)
  if (!session) throw new Error('Active attendance is required for a break')
  const openBreak = session.breaks.find((item) => !item.endedAt)
  if (openBreak) openBreak.endedAt = new Date()
  else session.breaks.push({ startedAt: new Date() })
  attendance.breaks = session.breaks
  attendance.totalWorkingHours = calculateWorkingHours(attendance)
  return attendance.save()
}

export { calculateWorkingHours, startOfDay, endOfDay }
export default { checkIn, checkOut, toggleBreak, getToday }
