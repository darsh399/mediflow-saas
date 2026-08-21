import test from 'node:test';
import assert from 'node:assert/strict';
import { hasAnyRole, canActOn, roleRank } from '../src/utils/authorize.js';

test('project_manager is compatible with manager permissions', () => {
  assert.equal(hasAnyRole({ role: 'project_manager' }, ['manager']), true);
  assert.equal(roleRank('project_manager'), roleRank('manager'));
});

test('employees cannot act on administrative roles', () => {
  assert.equal(canActOn({ role: 'employee' }, 'hr'), false);
  assert.equal(canActOn({ role: 'employee' }, 'company_owner'), false);
});

test('company owners can act on lower company roles', () => {
  assert.equal(canActOn({ role: 'company_owner' }, 'employee'), true);
  assert.equal(canActOn({ role: 'company_owner' }, 'hr_manager'), true);
});

test('unknown roles do not gain privilege', () => {
  assert.equal(hasAnyRole({ role: 'unknown' }, ['admin']), false);
  assert.equal(canActOn({ role: 'unknown' }, 'employee'), false);
});
