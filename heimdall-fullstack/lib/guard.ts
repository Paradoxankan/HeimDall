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
 memberships: (Membership & { organization: Organization })[]
}

export const HD_ORG_COOKIE = 'hd-org'

export function getCookieOptions() {
 return {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30 // 30 days
 }
}

/**
 * Returns { user, membership, org, memberships } for the signed-in user.
 * Active organization is resolved from the HTTP-only 'hd-org' cookie.
 * Never trusts the cookie value: verifies user membership in that organization.
 * If cookie is missing or invalid, falls back to most recently joined membership, or null.
 */
export async function getContext(): Promise<Context | null> {
 const s = await auth()
 const id = (s?.user as any)?.id
 if (!id) return null

 const user = await db.user.findUnique({
  where: { id },
  include: {
   memberships: {
    include: { organization: true },
    orderBy: { createdAt: 'desc' }
   }
  }
 })
 if (!user) return null

 let cookieOrgId: string | null = null
 let hasCookie = false
 try {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const c = cookieStore.get(HD_ORG_COOKIE)
  if (c !== undefined) {
   hasCookie = true
   cookieOrgId = c.value
  }
 } catch {
  // Outside of request context (e.g. tests or scripts)
 }

 let activeMembership: ContextMembership = null

 if (hasCookie && (cookieOrgId === 'personal' || cookieOrgId === '')) {
  // Explicitly switched to personal space
  activeMembership = null
 } else if (hasCookie && cookieOrgId) {
  // Check caller's verified membership for that organization
  const match = user.memberships.find(m => m.organizationId === cookieOrgId)
  if (match) {
   activeMembership = match
  } else {
   // Cookie value invalid (not a member of this org) -> fall back to most recently joined membership
   activeMembership = user.memberships[0] ?? null
  }
 } else {
  // Cookie missing -> fall back to most recently joined membership, or null if none
  activeMembership = user.memberships[0] ?? null
 }

 return {
  user,
  membership: activeMembership,
  org: activeMembership?.organization ?? null,
  memberships: user.memberships
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
   role: ctx.membership.role,
   memberships: ctx.memberships
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
