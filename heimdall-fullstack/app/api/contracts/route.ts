import {getContext,bad} from '@/lib/guard'
import {db} from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const ctx = await getContext()
  if (!ctx) return bad('Unauthorized', 401)
  if (!ctx.membership || !ctx.org) {
    return bad('Organization membership required', 403)
  }

  const role = ctx.membership.role
  if (role !== 'MANAGER' && role !== 'EXECUTIVE') {
    return bad('Forbidden: Only Managers and Executives can view contracts', 403)
  }

  const orgId = ctx.membership.organizationId

  const contracts = await db.contract.findMany({
    where: { organizationId: orgId },
    include: {
      obligations: {
        orderBy: [
          { due: 'asc' },
          { createdAt: 'asc' }
        ]
      },
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return Response.json(contracts)
}

