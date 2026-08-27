const DAY_MS = 86400000

export function fromDateKey(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export function startOfWeek(date) {
  const mondayOffset = (date.getDay() + 6) % 7
  return addDays(new Date(date.getFullYear(), date.getMonth(), date.getDate()), -mondayOffset)
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function rangeForView(date, view) {
  if (view === 'week') return { start: startOfWeek(date), end: addDays(startOfWeek(date), 6) }
  if (view === 'year') return { start: new Date(date.getFullYear(), 0, 1), end: new Date(date.getFullYear(), 11, 31) }
  const monthStart = startOfMonth(date)
  const monthGridStart = startOfWeek(monthStart)
  return { start: monthGridStart, end: addDays(startOfWeek(endOfMonth(date)), 6) }
}

export function eachDay(start, end) {
  const result = []
  for (let date = new Date(start); date <= end; date = addDays(date, 1)) result.push(new Date(date))
  return result
}

export function monthLabel(date) {
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export function formatDay(date) {
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export function formatDateInput(date) {
  return toDateKey(date)
}

const WEEKDAY_KEYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const DEFAULT_WORKING_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

// Expand company holidays (single day or date range) into a Set of date keys.
export function holidayKeySet(holidays = []) {
  const keys = new Set()
  for (const holiday of holidays) {
    if (!holiday?.date) continue
    const start = fromDateKey(String(holiday.date).slice(0, 10))
    const end = holiday.endDate ? fromDateKey(String(holiday.endDate).slice(0, 10)) : new Date(start)
    for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) keys.add(toDateKey(cursor))
  }
  return keys
}

// Mirror of the backend Backend/src/utils/workingDays.js — the days in
// [start, end] that fall on a working weekday and are not a company holiday.
// `holidays` should be the COMPANY-type list; weeklyWorkingDays is the company
// setting (falls back to Mon-Fri).
export function workingDaysBetween(start, end, weeklyWorkingDays, holidays = []) {
  if (!start || !end) return 0
  const from = start instanceof Date ? start : fromDateKey(String(start).slice(0, 10))
  const to = end instanceof Date ? end : fromDateKey(String(end).slice(0, 10))
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return 0
  const working = new Set(
    (weeklyWorkingDays && weeklyWorkingDays.length ? weeklyWorkingDays : DEFAULT_WORKING_DAYS).map((day) =>
      String(day).toUpperCase()
    )
  )
  const offDays = holidayKeySet(holidays)
  let count = 0
  for (let cursor = new Date(from); cursor <= to; cursor = addDays(cursor, 1)) {
    if (!working.has(WEEKDAY_KEYS[cursor.getDay()])) continue
    if (offDays.has(toDateKey(cursor))) continue
    count += 1
  }
  return count
}

export { DAY_MS }
