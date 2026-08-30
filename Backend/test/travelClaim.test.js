import test from 'node:test'
import assert from 'node:assert/strict'
import { summariseTravelClaim } from '../src/utils/travelClaim.js'

// ~1.11 km per 0.01 degree of latitude near the equator.
const at = (lat, lon, iso) => ({ visitLatitude: lat, visitLongitude: lon, visitedAt: iso })

test('empty visit list produces a zero claim', () => {
  const summary = summariseTravelClaim([], 10, 100)
  assert.equal(summary.totalKm, 0)
  assert.equal(summary.daysWithVisits, 0)
  assert.equal(summary.total, 0)
  assert.deepEqual(summary.days, [])
})

test('single visit in a day has no distance but still counts as a visit day', () => {
  const summary = summariseTravelClaim([at(19.0, 72.8, '2026-08-10T09:00:00Z')], 12, 150)
  assert.equal(summary.totalKm, 0)
  assert.equal(summary.daysWithVisits, 1)
  assert.equal(summary.daAmount, 150)
  assert.equal(summary.total, 150)
})

test('distance is summed between consecutive stops per day and priced', () => {
  const summary = summariseTravelClaim([
    at(19.00, 72.80, '2026-08-10T09:00:00Z'),
    at(19.05, 72.80, '2026-08-10T11:00:00Z'),
    at(19.10, 72.80, '2026-08-10T14:00:00Z'),
  ], 10, 0)
  // ~5.56 km + ~5.56 km ≈ 11.1 km
  assert.ok(summary.totalKm > 10.5 && summary.totalKm < 11.7, `got ${summary.totalKm}`)
  assert.equal(summary.daysWithVisits, 1)
  assert.equal(summary.travelAmount, summary.totalKm * 10)
})

test('visits are grouped by calendar day and out-of-order input is sorted', () => {
  const summary = summariseTravelClaim([
    at(19.10, 72.80, '2026-08-11T14:00:00Z'),
    at(19.00, 72.80, '2026-08-10T09:00:00Z'),
    at(19.05, 72.80, '2026-08-10T11:00:00Z'),
  ], 5, 200)
  assert.equal(summary.days.length, 2)
  assert.equal(summary.days[0].date, '2026-08-10')
  assert.equal(summary.days[1].date, '2026-08-11')
  assert.equal(summary.days[1].km, 0)
  assert.equal(summary.daAmount, 400)
})
