import test from 'node:test'
import assert from 'node:assert/strict'
import {can} from './permissions'
import {Role} from '@prisma/client'

test('Permission Matrix: org.create', () => {
 // Any signed-in user can create a company (even if already member of other companies)
 assert.equal(can(null, 'org.create'), true, 'User without membership can create org')
 assert.equal(can(undefined, 'org.create'), true, 'Undefined role can create org')

 const roles: Role[] = ['EMPLOYEE', 'MANAGER', 'HR', 'EXECUTIVE']
 for (const r of roles) {
  assert.equal(can(r, 'org.create'), true, `${r} can create another org`)
 }
})

test('Permission Matrix: member.invite EXECUTIVE', () => {
 // Nobody can invite an EXECUTIVE (only creator is executive)
 const allRoles: (Role | null)[] = ['EXECUTIVE', 'HR', 'MANAGER', 'EMPLOYEE', null]
 for (const r of allRoles) {
  assert.equal(can(r, 'member.invite', 'EXECUTIVE'), false, `${r} cannot invite EXECUTIVE`)
  assert.equal(can(r, 'member.invite', { targetRole: 'EXECUTIVE' }), false, `${r} cannot invite EXECUTIVE (object)`)
 }
})

test('Permission Matrix: member.invite HR or MANAGER', () => {
 // EXECUTIVE only
 for (const target of ['HR', 'MANAGER'] as Role[]) {
  assert.equal(can('EXECUTIVE', 'member.invite', target), true, `EXECUTIVE can invite ${target}`)
  assert.equal(can('HR', 'member.invite', target), false, `HR cannot invite ${target}`)
  assert.equal(can('MANAGER', 'member.invite', target), false, `MANAGER cannot invite ${target}`)
  assert.equal(can('EMPLOYEE', 'member.invite', target), false, `EMPLOYEE cannot invite ${target}`)
  assert.equal(can(null, 'member.invite', target), false, `Non-member cannot invite ${target}`)
 }
})

test('Permission Matrix: member.invite EMPLOYEE', () => {
 // EXECUTIVE, HR, MANAGER
 assert.equal(can('EXECUTIVE', 'member.invite', 'EMPLOYEE'), true, 'EXECUTIVE can invite EMPLOYEE')
 assert.equal(can('HR', 'member.invite', 'EMPLOYEE'), true, 'HR can invite EMPLOYEE')
 assert.equal(can('MANAGER', 'member.invite', 'EMPLOYEE'), true, 'MANAGER can invite EMPLOYEE')

 assert.equal(can('EMPLOYEE', 'member.invite', 'EMPLOYEE'), false, 'EMPLOYEE cannot invite EMPLOYEE')
 assert.equal(can(null, 'member.invite', 'EMPLOYEE'), false, 'Non-member cannot invite EMPLOYEE')
})

test('Permission Matrix: member.remove', () => {
 const allTargets: Role[] = ['EXECUTIVE', 'HR', 'MANAGER', 'EMPLOYEE']

 // EXECUTIVE can remove any
 for (const target of allTargets) {
  assert.equal(can('EXECUTIVE', 'member.remove', target), true, `EXECUTIVE can remove ${target}`)
 }

 // HR can remove employees only
 assert.equal(can('HR', 'member.remove', 'EMPLOYEE'), true, 'HR can remove EMPLOYEE')
 assert.equal(can('HR', 'member.remove', 'MANAGER'), false, 'HR cannot remove MANAGER')
 assert.equal(can('HR', 'member.remove', 'HR'), false, 'HR cannot remove HR')
 assert.equal(can('HR', 'member.remove', 'EXECUTIVE'), false, 'HR cannot remove EXECUTIVE')

 // MANAGER, EMPLOYEE, null cannot remove anyone
 for (const r of ['MANAGER', 'EMPLOYEE', null] as (Role | null)[]) {
  for (const target of allTargets) {
   assert.equal(can(r, 'member.remove', target), false, `${r} cannot remove ${target}`)
  }
 }
})

test('Permission Matrix: task.create / task.update / task.delete', () => {
 const actions = ['task.create', 'task.update', 'task.delete'] as const
 const orgRoles: Role[] = ['EMPLOYEE', 'MANAGER', 'HR', 'EXECUTIVE']

 for (const action of actions) {
  // Any member for their own tasks
  for (const r of orgRoles) {
   assert.equal(can(r, action, true), true, `${r} can manage own task for ${action}`)
   assert.equal(can(r, action, { isOwn: true }), true, `${r} can manage own task for ${action} (object)`)
  }

  // Non-member cannot manage company tasks even if flagged own
  assert.equal(can(null, action, true), false, 'Non-member cannot manage company task')

  // MANAGER and EXECUTIVE for anyone in the org (isOwn: false)
  assert.equal(can('EXECUTIVE', action, false), true, `EXECUTIVE can manage others task for ${action}`)
  assert.equal(can('MANAGER', action, false), true, `MANAGER can manage others task for ${action}`)

  // HR and EMPLOYEE cannot manage others' tasks
  assert.equal(can('HR', action, false), false, `HR cannot manage others task for ${action}`)
  assert.equal(can('EMPLOYEE', action, false), false, `EMPLOYEE cannot manage others task for ${action}`)
  assert.equal(can(null, action, false), false, `Non-member cannot manage others task for ${action}`)
 }
})

test('Permission Matrix: leave.decide', () => {
 // HR, EXECUTIVE
 assert.equal(can('EXECUTIVE', 'leave.decide'), true, 'EXECUTIVE can decide leave')
 assert.equal(can('HR', 'leave.decide'), true, 'HR can decide leave')

 assert.equal(can('MANAGER', 'leave.decide'), false, 'MANAGER cannot decide leave')
 assert.equal(can('EMPLOYEE', 'leave.decide'), false, 'EMPLOYEE cannot decide leave')
 assert.equal(can(null, 'leave.decide'), false, 'Non-member cannot decide leave')
})

test('Permission Matrix: exec reports (risks, revenue, contracts)', () => {
 // EXECUTIVE only
 assert.equal(can('EXECUTIVE', 'exec.reports'), true, 'EXECUTIVE can access exec reports')

 assert.equal(can('HR', 'exec.reports'), false, 'HR cannot access exec reports')
 assert.equal(can('MANAGER', 'exec.reports'), false, 'MANAGER cannot access exec reports')
 assert.equal(can('EMPLOYEE', 'exec.reports'), false, 'EMPLOYEE cannot access exec reports')
 assert.equal(can(null, 'exec.reports'), false, 'Non-member cannot access exec reports')
})

test('Organization slug format validation', () => {
 const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
 assert.equal(SLUG_RE.test('acme'), true, 'single word lowercase valid')
 assert.equal(SLUG_RE.test('acme-corp'), true, 'hyphenated words valid')
 assert.equal(SLUG_RE.test('acme-123-corp'), true, 'numbers and hyphens valid')
 assert.equal(SLUG_RE.test('-acme'), false, 'leading hyphen invalid')
 assert.equal(SLUG_RE.test('acme-'), false, 'trailing hyphen invalid')
 assert.equal(SLUG_RE.test('acme--corp'), false, 'consecutive hyphens invalid')
 assert.equal(SLUG_RE.test('Acme-Corp'), false, 'uppercase letters invalid')
 assert.equal(SLUG_RE.test('acme corp'), false, 'spaces invalid')
 assert.equal(SLUG_RE.test('acme_corp'), false, 'underscores invalid')
})


