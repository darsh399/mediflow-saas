import test from 'node:test'
import assert from 'node:assert/strict'
import { sign, computeBalances } from '../src/utils/sampleBalance.js'

test('sign: ISSUE/ADJUST add, RETURN/GIVEN subtract', () => {
  assert.equal(sign('ISSUE'), 1)
  assert.equal(sign('ADJUST'), 1)
  assert.equal(sign('RETURN'), -1)
  assert.equal(sign('GIVEN'), -1)
})

test('computeBalances nets movements per rep + item', () => {
  const balances = computeBalances([
    { employeeId: 'e1', itemId: 'i1', type: 'ISSUE', quantity: 100 },
    { employeeId: 'e1', itemId: 'i1', type: 'GIVEN', quantity: 15 },
    { employeeId: 'e1', itemId: 'i1', type: 'GIVEN', quantity: 5 },
    { employeeId: 'e1', itemId: 'i1', type: 'RETURN', quantity: 10 },
    { employeeId: 'e1', itemId: 'i2', type: 'ISSUE', quantity: 40 },
    { employeeId: 'e2', itemId: 'i1', type: 'ISSUE', quantity: 30 },
  ])
  const byKey = Object.fromEntries(balances.map((b) => [`${b.employeeId}:${b.itemId}`, b.balance]))
  assert.equal(byKey['e1:i1'], 70)
  assert.equal(byKey['e1:i2'], 40)
  assert.equal(byKey['e2:i1'], 30)
})

test('ADJUST can be negative', () => {
  const balances = computeBalances([
    { employeeId: 'e1', itemId: 'i1', type: 'ISSUE', quantity: 50 },
    { employeeId: 'e1', itemId: 'i1', type: 'ADJUST', quantity: -8 },
  ])
  assert.equal(balances[0].balance, 42)
})
