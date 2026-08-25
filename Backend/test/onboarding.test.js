import test from 'node:test'
import assert from 'node:assert/strict'
import { generateTempPassword } from '../src/utils/generatePassword.js'
import { deriveCompanyDomain } from '../src/utils/companyEmail.js'
import { calculateProfileCompletion, maskAccountNumber } from '../src/controllers/employeeProfileController.js'

test('generated temp password is 12 chars and mixes all character classes', () => {
  const password = generateTempPassword()
  assert.equal(password.length, 12)
  assert.match(password, /[A-Z]/)
  assert.match(password, /[a-z]/)
  assert.match(password, /[0-9]/)
  assert.match(password, /[!@#$%^&*]/)
})

test('generated temp passwords are not predictable/repeating', () => {
  const passwords = new Set(Array.from({ length: 20 }, () => generateTempPassword()))
  assert.equal(passwords.size, 20)
  for (const password of passwords) {
    assert.notEqual(password.toLowerCase(), 'password123!')
    assert.notEqual(password, '123456789012')
  }
})

test('company domain prefers an explicit company email over the company name', () => {
  assert.equal(deriveCompanyDomain({ companyName: 'MediFlow Technologies', companyEmail: 'hr@mediflow.com' }), 'mediflow.com')
})

test('company domain falls back to the company website when no email is set', () => {
  assert.equal(deriveCompanyDomain({ companyName: 'MediFlow Technologies', companyWebsite: 'https://www.mediflow.io/about' }), 'mediflow.io')
})

test('company domain normalizes the company name as a last resort', () => {
  assert.equal(deriveCompanyDomain({ companyName: 'MediFlow Technologies' }), 'mediflowtechnologies.com')
})

test('company domain never crashes on an empty company', () => {
  assert.equal(deriveCompanyDomain({}), 'company.com')
})

test('account number masking keeps only the last 4 digits, grouped in 4s', () => {
  assert.equal(maskAccountNumber('123456784521'), 'XXXX XXXX 4521')
  assert.equal(maskAccountNumber('4521'), '4521')
  assert.equal(maskAccountNumber(''), null)
})

test('profile completion is 0 with nothing filled in', () => {
  const result = calculateProfileCompletion({}, {})
  assert.equal(result.percentage, 0)
  assert.equal(result.sections.personal.complete, false)
})

test('profile completion reaches 100 when every section is complete', () => {
  const profile = {
    profileData: { fullName: 'Rahul Sharma', dob: '1990-01-01', mobile: '9999999999', bloodGroup: 'O+', emergencyContact: { name: 'A', phone: '1' }, currentAddress: { line1: 'x' }, permanentAddress: { line1: 'x' } },
    experienceType: 'fresher',
    documents: [{ type: 'aadhar' }, { type: 'pan' }, { type: 'addressProof' }, { type: 'tenth' }, { type: 'twelfth' }, { type: 'degree' }, { type: 'passportPhoto' }],
    bankDetails: { accountHolderName: 'Rahul Sharma', bankName: 'HDFC', accountNumber: '123456784521', ifscCode: 'HDFC0001234', branchName: 'Pune', accountType: 'SAVINGS' },
  }
  const user = { employeeId: 'EMP001', departmentId: 'd1', designationId: 'r1', joiningDate: new Date(), employmentType: 'FULL_TIME' }
  const result = calculateProfileCompletion(profile, user)
  assert.equal(result.percentage, 100)
  assert.equal(result.sections.bank.complete, true)
  assert.equal(result.sections.documents.complete, true)
})

test('experienced employees must also upload experience documents to complete the documents section', () => {
  const baseDocs = [{ type: 'aadhar' }, { type: 'pan' }, { type: 'addressProof' }, { type: 'tenth' }, { type: 'twelfth' }, { type: 'degree' }, { type: 'passportPhoto' }]
  const withoutExperienceDocs = calculateProfileCompletion({ experienceType: 'experienced', documents: baseDocs }, {})
  const withExperienceDocs = calculateProfileCompletion({ experienceType: 'experienced', documents: [...baseDocs, { type: 'offerLetter' }, { type: 'relievingLetter' }, { type: 'salarySlips' }] }, {})
  assert.equal(withoutExperienceDocs.sections.documents.complete, false)
  assert.equal(withExperienceDocs.sections.documents.complete, true)
})
