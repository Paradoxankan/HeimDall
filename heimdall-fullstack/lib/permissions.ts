import {Role} from '@prisma/client'

export type AppAction=
 | 'org.create'
 | 'member.invite'
 | 'member.remove'
 | 'task.create'
 | 'task.update'
 | 'task.delete'
 | 'leave.decide'
 | 'exec.reports'

export interface ActionDetails {
 targetRole?: Role
 isOwn?: boolean
}

/**
 * Permission matrix evaluation helper.
 *
 * Rules:
 * - org.create: any signed-in user without a membership.
 * - member.invite EXECUTIVE: nobody (only the creator is executive).
 * - member.invite HR or MANAGER: EXECUTIVE only.
 * - member.invite EMPLOYEE: EXECUTIVE, HR, MANAGER.
 * - member.remove: EXECUTIVE (any), HR (employees only).
 * - task.create/update/delete (company): any member for their own tasks, MANAGER and EXECUTIVE for anyone in the org.
 * - leave.decide: HR, EXECUTIVE.
 * - exec reports (risks, revenue, contracts): EXECUTIVE only.
 */
export function can(
 role: Role | null | undefined,
 action: AppAction,
 details?: ActionDetails | Role | boolean
): boolean {
 let targetRole: Role | undefined
 let isOwn: boolean | undefined

 if (typeof details === 'string') {
  targetRole = details as Role
 } else if (typeof details === 'boolean') {
  isOwn = details
 } else if (details && typeof details === 'object') {
  targetRole = details.targetRole
  isOwn = details.isOwn
 }

 switch (action) {
  case 'org.create':
   // Any signed-in user without a membership
   return !role

  case 'member.invite':
   if (!role) return false
   // nobody can invite an EXECUTIVE (only the creator is executive)
   if (targetRole === 'EXECUTIVE') return false
   // HR or MANAGER: EXECUTIVE only
   if (targetRole === 'HR' || targetRole === 'MANAGER') {
    return role === 'EXECUTIVE'
   }
   // EMPLOYEE: EXECUTIVE, HR, MANAGER
   if (targetRole === 'EMPLOYEE') {
    return role === 'EXECUTIVE' || role === 'HR' || role === 'MANAGER'
   }
   return false

  case 'member.remove':
   if (!role) return false
   // EXECUTIVE (any)
   if (role === 'EXECUTIVE') return true
   // HR (employees only)
   if (role === 'HR') {
    return targetRole === 'EMPLOYEE'
   }
   return false

  case 'task.create':
  case 'task.update':
  case 'task.delete':
   if (!role) return false
   // Any member for their own tasks
   if (isOwn) return true
   // MANAGER and EXECUTIVE for anyone in the org
   return role === 'MANAGER' || role === 'EXECUTIVE'

  case 'leave.decide':
   if (!role) return false
   // HR, EXECUTIVE
   return role === 'HR' || role === 'EXECUTIVE'

  case 'exec.reports':
   if (!role) return false
   // EXECUTIVE only
   return role === 'EXECUTIVE'

  default:
   return false
 }
}

