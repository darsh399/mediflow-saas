// Shared helpers for turning a date span into the number of days an employee
// would actually have worked — i.e. excluding the company's weekly off days and
// its COMPANY-type holidays. Leave is charged on this figure, not the raw span.

const WEEKDAY_KEYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const DEFAULT_WORKING_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

function normalize(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// Expand each holiday (a single day, or a date range when endDate is set) into a
// Set of 'YYYY-MM-DD' keys for O(1) lookup.
export function holidayDateSet(holidays = []) {
  const keys = new Set()
  for (const holiday of holidays) {
    const start = normalize(holiday?.date)
    if (!start) continue
    const end = normalize(holiday?.endDate) || new Date(start)
    for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      keys.add(dayKey(cursor))
    }
  }
  return keys
}

// Raw inclusive span, e.g. Mon -> Wed is 3.
export function calendarDaySpan(start, end) {
  const from = normalize(start)
  const to = normalize(end)
  if (!from || !to || to < from) return 0
  return Math.floor((to - from) / 86400000) + 1
}

// Days in [start, end] (inclusive) that land on a configured working weekday and
// are not a company holiday.
export function countWorkingDays(start, end, weeklyWorkingDays, holidays = []) {
  const from = normalize(start)
  const to = normalize(end)
  if (!from || !to || to < from) return 0

  const working = new Set(
    (Array.isArray(weeklyWorkingDays) && weeklyWorkingDays.length ? weeklyWorkingDays : DEFAULT_WORKING_DAYS)
      .map((day) => String(day).toUpperCase())
  )
  const offDays = holidayDateSet(holidays)

  let count = 0
  for (const cursor = new Date(from); cursor <= to; cursor.setDate(cursor.getDate() + 1)) {
    if (!working.has(WEEKDAY_KEYS[cursor.getDay()])) continue
    if (offDays.has(dayKey(cursor))) continue
    count += 1
  }
  return count
}

export default { holidayDateSet, calendarDaySpan, countWorkingDays }
