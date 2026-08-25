import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateWorkingHours, startOfDay, endOfDay } from '../src/services/attendanceService.js'
import { hasPermission } from '../src/config/permissions.js'

test('working hours exclude completed breaks', () => {
  const attendance = {
    checkIn: new Date('2026-08-25T09:00:00Z'),
    checkOut: new Date('2026-08-25T18:00:00Z'),
    breaks: [{ startedAt: new Date('2026-08-25T13:00:00Z'), endedAt: new Date('2026-08-25T14:00:00Z') }],
  }
  assert.equal(calculateWorkingHours(attendance), 8)
})

test('attendance day boundaries cover exactly one day', () => {
  const dayStart = startOfDay(new Date('2026-08-25T15:30:00Z'))
  const dayEnd = endOfDay(dayStart)
  assert.equal(dayEnd - dayStart, 24 * 60 * 60 * 1000)
})

test('attendance permissions separate employees and reviewers', () => {
  assert.equal(hasPermission({ role: 'employee' }, 'attendance.create'), true)
  assert.equal(hasPermission({ role: 'mr' }, 'attendance.create'), true)
  assert.equal(hasPermission({ role: 'employee' }, 'attendance.approve'), false)
  assert.equal(hasPermission({ role: 'mr' }, 'attendance.approve'), false)
  assert.equal(hasPermission({ role: 'hr_manager' }, 'attendance.approve'), true)
})

test('authorized managers can view employee attendance status', () => {
  assert.equal(hasPermission({ role: 'company_owner' }, 'attendance.view'), true)
  assert.equal(hasPermission({ role: 'hr_manager' }, 'attendance.view'), true)
  assert.equal(hasPermission({ role: 'project_manager' }, 'attendance.view'), true)
  assert.equal(hasPermission({ role: 'employee' }, 'attendance.view'), true)
})
