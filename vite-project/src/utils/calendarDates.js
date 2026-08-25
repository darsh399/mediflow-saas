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

export { DAY_MS }
