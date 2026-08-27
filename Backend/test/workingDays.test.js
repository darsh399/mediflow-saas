import test from 'node:test'
import assert from 'node:assert/strict'
import { countWorkingDays, calendarDaySpan, holidayDateSet } from '../src/utils/workingDays.js'

const MON_FRI = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

test('calendarDaySpan is an inclusive count', () => {
  assert.equal(calendarDaySpan('2026-08-24', '2026-08-24'), 1)
  assert.equal(calendarDaySpan('2026-08-24', '2026-08-28'), 5)
  assert.equal(calendarDaySpan('2026-08-28', '2026-08-24'), 0)
})

test('countWorkingDays skips weekend off days', () => {
  // Fri 2026-08-28 through Mon 2026-08-31 -> only Fri + Mon are working days.
  assert.equal(countWorkingDays('2026-08-28', '2026-08-31', MON_FRI), 2)
  // A full Mon-Sun week -> 5 working days.
  assert.equal(countWorkingDays('2026-08-24', '2026-08-30', MON_FRI), 5)
})

test('countWorkingDays skips company holidays inside the range', () => {
  const holidays = [{ date: '2026-08-25' }]
  assert.equal(countWorkingDays('2026-08-24', '2026-08-26', MON_FRI, holidays), 2)
})

test('countWorkingDays handles multi-day holiday ranges', () => {
  const holidays = [{ date: '2026-08-25', endDate: '2026-08-27' }]
  assert.equal(countWorkingDays('2026-08-24', '2026-08-28', MON_FRI, holidays), 2)
})

test('countWorkingDays falls back to Mon-Fri when working days are not configured', () => {
  assert.equal(countWorkingDays('2026-08-24', '2026-08-30', undefined), 5)
  assert.equal(countWorkingDays('2026-08-24', '2026-08-30', []), 5)
})

test('countWorkingDays returns 0 when the whole span is off', () => {
  assert.equal(countWorkingDays('2026-08-29', '2026-08-30', MON_FRI), 0)
})

test('holidayDateSet expands ranges into individual day keys', () => {
  const keys = holidayDateSet([{ date: '2026-01-01', endDate: '2026-01-03' }])
  assert.deepEqual([...keys].sort(), ['2026-01-01', '2026-01-02', '2026-01-03'])
})
