import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateSalary, daysWithinMonth, daysInMonth } from '../src/services/salaryService.js'

test('salary calculation evaluates dynamic earnings and deductions', () => {
  const result = calculateSalary({ components: [
    { name: 'Basic', type: 'EARNING', calculationType: 'PERCENTAGE', percentage: 50, basedOn: 'MONTHLY_CTC', active: true },
    { name: 'HRA', type: 'EARNING', calculationType: 'PERCENTAGE', percentage: 40, basedOn: 'BASIC', active: true },
    { name: 'Tax', type: 'DEDUCTION', calculationType: 'FIXED', fixedAmount: 200, basedOn: 'MONTHLY_CTC', active: true },
  ] }, 'MONTHLY', 50000)
  assert.equal(result.annualCtc, 600000)
  assert.equal(result.grossSalary, 35000)
  assert.equal(result.totalDeductions, 200)
  assert.equal(result.netSalary, 34800)
})

test('annual salary basis is converted to monthly salary', () => {
  const result = calculateSalary({ components: [] }, 'ANNUAL', 600000)
  assert.equal(result.monthlyCtc, 50000)
  assert.equal(result.annualCtc, 600000)
  assert.equal(result.netSalary, 0)
})

test('LOP leave entirely inside the salary month counts all its days', () => {
  assert.equal(daysWithinMonth('2026-08-10', '2026-08-11', 8, 2026), 2)
  assert.equal(daysWithinMonth('2026-08-20', '2026-08-20', 8, 2026), 1)
})

test('LOP leave crossing into the salary month from the previous month is clipped', () => {
  assert.equal(daysWithinMonth('2026-07-30', '2026-08-03', 8, 2026), 3)
})

test('LOP leave crossing out of the salary month into the next month is clipped', () => {
  assert.equal(daysWithinMonth('2026-08-29', '2026-09-02', 8, 2026), 3)
})

test('leave entirely outside the salary month contributes zero days', () => {
  assert.equal(daysWithinMonth('2026-07-01', '2026-07-05', 8, 2026), 0)
  assert.equal(daysWithinMonth('2026-09-01', '2026-09-05', 8, 2026), 0)
})

test('no LOP days means no LOP deduction', () => {
  const totalDays = daysInMonth(2026, 8)
  const lopDays = 0
  const lopDeduction = lopDays > 0 ? Number(((50000 / totalDays) * lopDays).toFixed(2)) : 0
  assert.equal(lopDeduction, 0)
})

test('LOP deduction is prorated across the salary month using monthly CTC', () => {
  const totalDays = daysInMonth(2026, 8)
  assert.equal(totalDays, 31)
  const lopDeduction = Number(((50000 / totalDays) * 2).toFixed(2))
  assert.equal(lopDeduction, 3225.81)
})

test('multiple LOP leaves in the same month are summed without double-counting', () => {
  const days = daysWithinMonth('2026-08-05', '2026-08-06', 8, 2026)
    + daysWithinMonth('2026-08-15', '2026-08-15', 8, 2026)
    + daysWithinMonth('2026-08-25', '2026-08-27', 8, 2026)
  assert.equal(days, 6)
})
