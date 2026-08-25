import test from 'node:test'
import assert from 'node:assert/strict'
import { monthKey } from '../src/services/leaveService.js'
import { hasPermission } from '../src/config/permissions.js'

test('leave accrual month keys are stable', () => {
  assert.equal(monthKey(new Date('2026-01-10T12:00:00Z')), '2026-01')
  assert.equal(monthKey(new Date('2026-12-31T12:00:00Z')), '2026-12')
})

test('leave policy management is limited to company administration', () => {
  assert.equal(hasPermission({ role: 'company_owner' }, 'leave.manage_policy'), true)
  assert.equal(hasPermission({ role: 'hr_manager' }, 'leave.manage_policy'), true)
  assert.equal(hasPermission({ role: 'employee' }, 'leave.manage_policy'), false)
})

test('employees can apply but cannot approve leave', () => {
  assert.equal(hasPermission({ role: 'employee' }, 'leave.apply'), true)
  assert.equal(hasPermission({ role: 'employee' }, 'leave.approve'), false)
  assert.equal(hasPermission({ role: 'hr_manager' }, 'leave.approve'), true)
})

test('company users can apply and view their leave balance', () => {
  for (const role of ['employee', 'mr', 'manager', 'project_manager']) {
    assert.equal(hasPermission({ role }, 'leave.view'), true)
    assert.equal(hasPermission({ role }, 'leave.apply'), true)
  }
})
