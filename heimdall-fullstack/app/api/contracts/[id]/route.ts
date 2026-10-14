import {getContext,bad} from '@/lib/guard'
import {db} from '@/lib/db'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const ctx = await getContext()
  if (!ctx) return bad('Unauthorized', 401)
  if (!ctx.membership || !ctx.org) {
    return bad('Organization membership required', 403)
  }

  const role = ctx.membership.role
  if (role !== 'MANAGER' && role !== 'EXECUTIVE') {
    return bad('Forbidden: Only Managers and Executives can delete contracts', 403)
  }

  const orgId = ctx.membership.organizationId
  const { id } = await params

  const contract = await db.contract.findFirst({
    where: {
      id,
      organizationId: orgId
    }
  })

  if (!contract) {
    return bad('Contract not found', 404)
  }

  await db.contract.delete({
    where: { id: contract.id }
  })

  await db.activity.create({
    data: {
      who: ctx.user.name || ctx.user.email || 'Someone',
      what: 'deleted contract',
      target: contract.name,
      userId: ctx.user.id,
      organizationId: orgId
    }
  })

  return Response.json({ ok: true, deletedId: contract.id })
}

