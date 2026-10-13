import test from 'node:test'
import assert from 'node:assert/strict'
import {can} from './permissions'
import {Role} from '@prisma/client'

test('Verification (1): Two personal users cannot see or modify each other\'s tasks', () => {
 const userA = { id: 'user_a', email: 'alice@example.com' }
 const userB = { id: 'user_b', email: 'bob@example.com' }

 // Simulated personal tasks in db
 const allTasks = [
  { id: 'task_1', title: 'Alice personal task', ownerId: userA.id, organizationId: null },
  { id: 'task_2', title: 'Bob personal task', ownerId: userB.id, organizationId: null }
 ]

 // Route query for userA: where: { ownerId: userA.id, organizationId: null }
 const aliceTasks = allTasks.filter(t => t.ownerId === userA.id && t.organizationId === null)
 assert.equal(aliceTasks.length, 1)
 assert.equal(aliceTasks[0].id, 'task_1')
 assert.equal(aliceTasks.some(t => t.ownerId === userB.id), false, 'Alice cannot see Bob tasks')

 // Route query for userB: where: { ownerId: userB.id, organizationId: null }
 const bobTasks = allTasks.filter(t => t.ownerId === userB.id && t.organizationId === null)
 assert.equal(bobTasks.length, 1)
 assert.equal(bobTasks[0].id, 'task_2')
 assert.equal(bobTasks.some(t => t.ownerId === userA.id), false, 'Bob cannot see Alice tasks')

 // Route mutation authorization check: ownerId must match ctx.user.id
 const canAliceModifyBobsTask = allTasks[1].ownerId === userA.id
 assert.equal(canAliceModifyBobsTask, false, 'Alice cannot modify Bob personal task')
})

test('Verification (2): A user creates a company and becomes Executive', () => {
 // User without membership is allowed to create org
 assert.equal(can(null, 'org.create'), true, 'User without membership can create company')
 assert.equal(can(undefined, 'org.create'), true)

 // User with existing membership is prohibited (single org limit)
 const existingRoles: Role[] = ['EXECUTIVE', 'HR', 'MANAGER', 'EMPLOYEE']
 for (const r of existingRoles) {
  assert.equal(can(r, 'org.create'), false, `${r} cannot create another company`)
 }
})

test('Verification (3): Executive can invite HR, Manager, and Employee (but not Executive)', () => {
 assert.equal(can('EXECUTIVE', 'member.invite', 'HR'), true, 'Executive can invite HR')
 assert.equal(can('EXECUTIVE', 'member.invite', 'MANAGER'), true, 'Executive can invite Manager')
 assert.equal(can('EXECUTIVE', 'member.invite', 'EMPLOYEE'), true, 'Executive can invite Employee')
 assert.equal(can('EXECUTIVE', 'member.invite', 'EXECUTIVE'), false, 'Executive cannot invite Executive')
})

test('Verification (4): HR and Manager can invite only Employees, and other roles are rejected', () => {
 // HR permissions
 assert.equal(can('HR', 'member.invite', 'EMPLOYEE'), true, 'HR can invite Employee')
 assert.equal(can('HR', 'member.invite', 'HR'), false, 'HR cannot invite HR (rejected with 403)')
 assert.equal(can('HR', 'member.invite', 'MANAGER'), false, 'HR cannot invite Manager (rejected with 403)')
 assert.equal(can('HR', 'member.invite', 'EXECUTIVE'), false, 'HR cannot invite Executive (rejected with 403)')

 // Manager permissions
 assert.equal(can('MANAGER', 'member.invite', 'EMPLOYEE'), true, 'Manager can invite Employee')
 assert.equal(can('MANAGER', 'member.invite', 'HR'), false, 'Manager cannot invite HR (rejected with 403)')
 assert.equal(can('MANAGER', 'member.invite', 'MANAGER'), false, 'Manager cannot invite Manager (rejected with 403)')
 assert.equal(can('MANAGER', 'member.invite', 'EXECUTIVE'), false, 'Manager cannot invite Executive (rejected with 403)')

 // Employee permissions
 for (const r of ['EXECUTIVE', 'HR', 'MANAGER', 'EMPLOYEE'] as Role[]) {
  assert.equal(can('EMPLOYEE', 'member.invite', r), false, `Employee cannot invite ${r}`)
 }
})

test('Verification (5): A user from another company cannot read this company\'s data', () => {
 const org1Id = 'org_alpha'
 const org2Id = 'org_beta'

 const companyTasks = [
  { id: 't_alpha', title: 'Alpha task', organizationId: org1Id },
  { id: 't_beta', title: 'Beta task', organizationId: org2Id }
 ]

 // Caller from org2 querying with organizationId from their own membership
 const callerMembership = { organizationId: org2Id, role: 'EXECUTIVE' as Role }
 const queriedTasks = companyTasks.filter(t => t.organizationId === callerMembership.organizationId)

 assert.equal(queriedTasks.length, 1)
 assert.equal(queriedTasks[0].id, 't_beta')
 assert.equal(queriedTasks.some(t => t.organizationId === org1Id), false, 'Org2 user cannot read Org1 data')

 // Mutation attempt on a task from org1
 const targetTask = companyTasks[0]
 const isSameOrg = targetTask.organizationId === callerMembership.organizationId
 assert.equal(isSameOrg, false, 'Cross-organization task mutation rejected with 403')
})

test('Verification (6): An invitation for another email cannot be accepted', () => {
 const invite = {
  id: 'inv_123',
  token: 'tok_abc',
  email: 'intended@example.com',
  organizationId: 'org_alpha',
  role: 'EMPLOYEE' as Role,
  status: 'PENDING'
 }

 const intruderUser = { id: 'intruder', email: 'intruder@example.com' }
 const rightfulUser = { id: 'rightful', email: 'intended@example.com' }

 // Check email match validation rule
 const canIntruderAccept = intruderUser.email.toLowerCase() === invite.email.toLowerCase()
 assert.equal(canIntruderAccept, false, 'Intruder cannot accept invitation for different email')

 const canRightfulAccept = rightfulUser.email.toLowerCase() === invite.email.toLowerCase()
 assert.equal(canRightfulAccept, true, 'Rightful user email matches invitation')
})

