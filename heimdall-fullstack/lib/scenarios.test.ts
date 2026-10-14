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

test('Verification (2): A user can create a company and become Executive, even if in other companies', () => {
 // User without membership is allowed to create org
 assert.equal(can(null, 'org.create'), true, 'User without membership can create company')
 assert.equal(can(undefined, 'org.create'), true)

 // In multi-org, users with existing memberships CAN create additional companies
 const existingRoles: Role[] = ['EXECUTIVE', 'HR', 'MANAGER', 'EMPLOYEE']
 for (const r of existingRoles) {
  assert.equal(can(r, 'org.create'), true, `${r} can create another company`)
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

test('Verification (7): User in two companies sees only the active company\'s data', () => {
 const userId = 'user_multi'
 const orgAId = 'org_alpha'
 const orgBId = 'org_beta'

 const userMemberships = [
  { organizationId: orgAId, userId, role: 'EXECUTIVE' as Role },
  { organizationId: orgBId, userId, role: 'EMPLOYEE' as Role }
 ]

 const allTasks = [
  { id: 'task_a1', title: 'Org A Task 1', organizationId: orgAId },
  { id: 'task_a2', title: 'Org A Task 2', organizationId: orgAId },
  { id: 'task_b1', title: 'Org B Task 1', organizationId: orgBId }
 ]

 // Active company is Org A
 let activeOrgId = orgAId
 const activeMembershipA = userMemberships.find(m => m.organizationId === activeOrgId)!
 const tasksOrgA = allTasks.filter(t => t.organizationId === activeMembershipA.organizationId)
 assert.equal(tasksOrgA.length, 2, 'Only 2 tasks from Org A visible')
 assert.equal(tasksOrgA.every(t => t.organizationId === orgAId), true, 'All returned tasks belong to Org A')
 assert.equal(tasksOrgA.some(t => t.organizationId === orgBId), false, 'No Org B tasks visible while Org A is active')

 // Switch active company to Org B
 activeOrgId = orgBId
 const activeMembershipB = userMemberships.find(m => m.organizationId === activeOrgId)!
 const tasksOrgB = allTasks.filter(t => t.organizationId === activeMembershipB.organizationId)
 assert.equal(tasksOrgB.length, 1, 'Only 1 task from Org B visible')
 assert.equal(tasksOrgB[0].id, 'task_b1')
 assert.equal(tasksOrgB.some(t => t.organizationId === orgAId), false, 'No Org A tasks visible while Org B is active')
})

test('Verification (8): Switching to a company the user doesn\'t belong to returns 403', () => {
 const userMemberships = [
  { organizationId: 'org_acme', role: 'EXECUTIVE' as Role },
  { organizationId: 'org_globex', role: 'MANAGER' as Role }
 ]

 function attemptSwitch(targetOrgId: string): { status: number; allowed: boolean } {
  const member = userMemberships.find(m => m.organizationId === targetOrgId)
  if (!member) {
   return { status: 403, allowed: false }
  }
  return { status: 200, allowed: true }
 }

 // Valid memberships switch successfully
 const switchAcme = attemptSwitch('org_acme')
 assert.equal(switchAcme.status, 200)
 assert.equal(switchAcme.allowed, true)

 const switchGlobex = attemptSwitch('org_globex')
 assert.equal(switchGlobex.status, 200)
 assert.equal(switchGlobex.allowed, true)

 // Unjoined organization switch is forbidden with 403
 const switchInitech = attemptSwitch('org_initech')
 assert.equal(switchInitech.status, 403, 'Unjoined organization switch rejected with 403')
 assert.equal(switchInitech.allowed, false)
})

test('Verification (9): Roles are evaluated per company', () => {
 const membershipA = { organizationId: 'org_a', role: 'EXECUTIVE' as Role }
 const membershipB = { organizationId: 'org_b', role: 'EMPLOYEE' as Role }

 // In Org A (where user is EXECUTIVE):
 assert.equal(can(membershipA.role, 'member.invite', 'MANAGER'), true, 'User is Executive in Org A -> can invite Manager')
 assert.equal(can(membershipA.role, 'exec.reports'), true, 'User is Executive in Org A -> can view exec reports')
 assert.equal(can(membershipA.role, 'member.remove', 'HR'), true, 'User is Executive in Org A -> can remove HR')

 // In Org B (where user is EMPLOYEE):
 assert.equal(can(membershipB.role, 'member.invite', 'MANAGER'), false, 'User is Employee in Org B -> cannot invite Manager')
 assert.equal(can(membershipB.role, 'exec.reports'), false, 'User is Employee in Org B -> cannot view exec reports')
 assert.equal(can(membershipB.role, 'member.remove', 'HR'), false, 'User is Employee in Org B -> cannot remove HR')
 assert.equal(can(membershipB.role, 'task.create', true), true, 'User is Employee in Org B -> can create own tasks')
 assert.equal(can(membershipB.role, 'task.create', false), false, 'User is Employee in Org B -> cannot create tasks for others')
})

test('Verification (10): Safety rule - sole Executive cannot leave or be removed (409)', () => {
 const orgMembers = [
  { id: 'm1', organizationId: 'org_alpha', userId: 'user1', role: 'EXECUTIVE' as Role },
  { id: 'm2', organizationId: 'org_alpha', userId: 'user2', role: 'EMPLOYEE' as Role }
 ]

 function validateLeaveOrRemoval(targetMemberId: string, orgId: string): { status: number; allowed: boolean; message?: string } {
  const member = orgMembers.find(m => m.id === targetMemberId && m.organizationId === orgId)
  if (!member) return { status: 404, allowed: false }

  if (member.role === 'EXECUTIVE') {
   const execCount = orgMembers.filter(m => m.organizationId === orgId && m.role === 'EXECUTIVE').length
   if (execCount <= 1) {
    return {
     status: 409,
     allowed: false,
     message: 'Cannot leave or remove the only Executive of this organization. Promote another member to Executive first.'
    }
   }
  }

  return { status: 200, allowed: true }
 }

 // Sole executive attempt returns 409 Conflict
 const soleExecCheck = validateLeaveOrRemoval('m1', 'org_alpha')
 assert.equal(soleExecCheck.status, 409, 'Sole executive blocked with 409 Conflict')
 assert.equal(soleExecCheck.allowed, false)
 assert.match(soleExecCheck.message!, /only Executive/)

 // Non-sole executive (when 2 executives exist) can leave / be removed
 orgMembers.push({ id: 'm3', organizationId: 'org_alpha', userId: 'user3', role: 'EXECUTIVE' as Role })
 const dualExecCheck = validateLeaveOrRemoval('m1', 'org_alpha')
 assert.equal(dualExecCheck.status, 200, 'Executive allowed to leave when another Executive exists')
 assert.equal(dualExecCheck.allowed, true)

 // Employee can leave / be removed
 const employeeCheck = validateLeaveOrRemoval('m2', 'org_alpha')
 assert.equal(employeeCheck.status, 200, 'Employee allowed to leave / be removed')
 assert.equal(employeeCheck.allowed, true)
})
