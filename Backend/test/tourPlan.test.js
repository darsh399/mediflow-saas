import test from 'node:test';
import assert from 'node:assert/strict';
import { detectDuplicatePlanItems } from '../src/controllers/tourPlanController.js';

test('detectDuplicatePlanItems rejects duplicates for the same doctor on the same planned date', () => {
  assert.throws(
    () => detectDuplicatePlanItems([
      { kind: 'DOCTOR', doctorId: '507f1f77bcf86cd799439011', plannedDate: '2026-09-01' },
      { kind: 'DOCTOR', doctorId: '507f1f77bcf86cd799439011', plannedDate: '2026-09-01' },
    ]),
    /already exists in this plan/i,
  );
});

test('detectDuplicatePlanItems allows the same doctor on different planned dates', () => {
  const items = detectDuplicatePlanItems([
    { kind: 'DOCTOR', doctorId: '507f1f77bcf86cd799439011', plannedDate: '2026-09-01' },
    { kind: 'DOCTOR', doctorId: '507f1f77bcf86cd799439011', plannedDate: '2026-09-02' },
  ]);

  assert.equal(items.length, 2);
});
