// Shared "what day is it, and what does THIS_WEEK/THIS_MONTH/etc mean" logic
// for every module that filters by date range (visits, attendance, ...).
// Previously visitController.js and attendanceController.js each computed
// this independently — visits used an IST offset, attendance used the
// server process's local clock — so the same real day could land in
// different buckets depending on which module you were looking at. Everyone
// now goes through here so "today" always means the same instant.
const DEFAULT_OFFSET_MINUTES = 330 // IST

function timezoneOffsetMinutes() {
  return Number(process.env.APP_TIMEZONE_OFFSET_MINUTES || DEFAULT_OFFSET_MINUTES)
}

function localDateParts(date = new Date()) {
  const offset = timezoneOffsetMinutes()
  const local = new Date(date.getTime() + offset * 60000)
  return { year: local.getUTCFullYear(), month: local.getUTCMonth() + 1, day: local.getUTCDate() }
}

function dateValueFromParts({ year, month, day }) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function todayValue(date = new Date()) {
  return dateValueFromParts(localDateParts(date))
}

// Parses a YYYY-MM-DD string into the UTC instant of local-midnight for that
// calendar date (in the configured offset).
function dateAtStart(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) throw new Error('Dates must use YYYY-MM-DD format')
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new Error('Invalid date')
  const offset = timezoneOffsetMinutes()
  return new Date(date.getTime() - offset * 60000)
}

function addDays(value, days) {
  const date = new Date(`${value}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return dateValueFromParts({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() })
}

function firstOfMonthValue(year, month) {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

// Local-time-aware equivalents of the classic startOfDay/endOfDay helpers,
// for code that works with Date instances rather than range presets.
function startOfDay(value = new Date()) {
  return dateAtStart(todayValue(value))
}

function endOfDay(value = new Date()) {
  return new Date(startOfDay(value).getTime() + 86400000)
}

// [start, end) UTC-instant window covering a whole calendar month (or a
// whole calendar year, if month is omitted), in the configured offset.
function monthRange(year, month) {
  const startDate = dateAtStart(firstOfMonthValue(year, month || 1))
  const next = month ? (month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }) : { year: year + 1, month: 1 }
  const endDate = dateAtStart(firstOfMonthValue(next.year, next.month))
  return { start: startDate, end: endDate }
}

// Resolves a query's {range, startDate, endDate} into a concrete [start, end)
// window. `range` supports TODAY/YESTERDAY/LAST_7_DAYS/THIS_WEEK/LAST_WEEK/
// THIS_MONTH/LAST_MONTH/THIS_YEAR/LAST_3_MONTHS, or an explicit
// startDate/endDate pair (YYYY-MM-DD) overrides the preset entirely.
function resolveDateRange(query, now = new Date()) {
  const todayParts = localDateParts(now)
  const today = dateValueFromParts(todayParts)
  const range = String(query.range || 'TODAY').toUpperCase()
  let start = query.startDate
  let end = query.endDate
  if (!start && !end) {
    if (range === 'YESTERDAY') { start = end = addDays(today, -1) }
    else if (range === 'LAST_7_DAYS') { start = addDays(today, -6); end = today }
    else if (range === 'THIS_WEEK') {
      const weekday = new Date(`${today}T00:00:00Z`).getUTCDay()
      start = addDays(today, weekday === 0 ? -6 : 1 - weekday)
      end = today
    } else if (range === 'LAST_WEEK') {
      const weekday = new Date(`${today}T00:00:00Z`).getUTCDay()
      const thisWeek = addDays(today, weekday === 0 ? -6 : 1 - weekday)
      start = addDays(thisWeek, -7)
      end = addDays(thisWeek, -1)
    } else if (range === 'THIS_MONTH') {
      start = firstOfMonthValue(todayParts.year, todayParts.month)
      end = today
    } else if (range === 'LAST_MONTH') {
      const firstThisMonth = firstOfMonthValue(todayParts.year, todayParts.month)
      end = addDays(firstThisMonth, -1)
      const endParts = new Date(`${end}T00:00:00Z`)
      start = firstOfMonthValue(endParts.getUTCFullYear(), endParts.getUTCMonth() + 1)
    } else if (range === 'THIS_YEAR') {
      start = `${todayParts.year}-01-01`
      end = today
    } else if (range === 'LAST_3_MONTHS') {
      const firstThisMonth = new Date(`${firstOfMonthValue(todayParts.year, todayParts.month)}T00:00:00Z`)
      firstThisMonth.setUTCMonth(firstThisMonth.getUTCMonth() - 2)
      start = firstOfMonthValue(firstThisMonth.getUTCFullYear(), firstThisMonth.getUTCMonth() + 1)
      end = today
    } else { start = end = today }
  }
  if (!start || !end) throw new Error('Both startDate and endDate are required')
  const startDate = dateAtStart(start)
  const endDate = new Date(dateAtStart(end).getTime() + 86400000)
  if (startDate >= endDate) throw new Error('startDate cannot be after endDate')
  return { start, end, startDate, endDate }
}

export { timezoneOffsetMinutes, localDateParts, todayValue, dateAtStart, addDays, startOfDay, endOfDay, monthRange, resolveDateRange }
export default { resolveDateRange, startOfDay, endOfDay, monthRange, localDateParts, todayValue }
