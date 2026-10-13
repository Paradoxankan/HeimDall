import {auth} from '@/auth'
import {db} from './db'
import {can,AppAction,ActionDetails} from './permissions'
import {Membership,Organization,User,Role} from '@prisma/client'

export type ContextUser = User
export type ContextMembership = (Membership & { organization: Organization }) | null
export type ContextOrg = Organization | null

export type Context = {
 user: ContextUser
 membership: ContextMembership
 org: ContextOrg
}

/**
 * Returns { user, membership | null, org | null } for the signed-in user.
 * Returns null if not authenticated or user record is not found.
 */
export async function getContext(): Promise<Context | null> {
 const s = await auth()
 const id = (s?.user as any)?.id
 if (!id) return null

 const user = await db.user.findUnique({
  where: { id },
  include: {
   membership: {
    include: { organization: true }
   }
  }
 })
 if (!user) return null

 return {
  user,
  membership: user.membership,
  org: user.membership?.organization ?? null
 }
}

/**
 * Enforces organization membership.
 * Never trust organization IDs from the client: always use orgId from the verified server membership.
 */
export async function requireOrgContext() {
 const ctx = await getContext()
 if (!ctx) return { error: bad('Unauthorized', 401), ctx: null }
 if (!ctx.membership || !ctx.org) {
  return { error: bad('Organization membership required', 403), ctx: null }
 }
 return {
  error: null,
  ctx: {
   user: ctx.user,
   membership: ctx.membership,
   org: ctx.org,
   orgId: ctx.membership.organizationId,
   role: ctx.membership.role
  }
 }
}

export const bad = (m: string, status: number) => Response.json({ error: m }, { status })

export { can }
export type { AppAction, ActionDetails }

// Backwards-compatible aliases for existing routes
export async function getMe() {
 return getContext()
}

export function getActiveContext(ctxOrMe: any) {
 const membership = ctxOrMe?.membership ?? ctxOrMe?.user?.membership
 if (membership) {
  return {
   isPersonal: false,
   organization: membership.organization,
   organizationId: membership.organizationId,
   role: membership.role as Role,
   membership,
   company: membership.organization,
   companyId: membership.organizationId
  }
 }
 return {
  isPersonal: true,
  organization: null,
  organizationId: null,
  role: 'EMPLOYEE' as Role,
  membership: null,
  company: null,
  companyId: null
 }
}
