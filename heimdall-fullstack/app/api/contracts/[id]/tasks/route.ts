import {getContext,bad} from '@/lib/guard'
import {db} from '@/lib/db'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const ctx = await getContext()
  if (!ctx) return bad('Unauthorized', 401)
  if (!ctx.membership || !ctx.org) {
    return bad('Organization membership required', 403)
  }

  const role = ctx.membership.role
  if (role !== 'MANAGER' && role !== 'EXECUTIVE') {
    return bad('Forbidden: Only Managers and Executives can convert obligations to tasks', 403)
  }

  const orgId = ctx.membership.organizationId
  const { id } = await params

  const contract = await db.contract.findFirst({
    where: {
      id,
      organizationId: orgId
    },
    include: {
      obligations: true
    }
  })

  if (!contract) {
    return bad('Contract not found', 404)
  }

  const body = await req.json().catch(() => ({}))
  let targetObligations = contract.obligations.filter(o => !o.taskId)

  if (Array.isArray(body?.obligationIds) && body.obligationIds.length > 0) {
    const idSet = new Set(body.obligationIds.map((x: any) => String(x)))
    targetObligations = targetObligations.filter(o => idSet.has(o.id))
  }

  if (targetObligations.length === 0) {
    return Response.json({
      ok: true,
      createdTasksCount: 0,
      tasks: [],
      message: 'No pending obligations without tasks found'
    })
  }

  // Find or upsert a dedicated "Contracts" project for the organization
  let project = await db.project.findFirst({
    where: {
      organizationId: orgId,
      name: 'Contracts'
    }
  })

  if (!project) {
    project = await db.project.create({
      data: {
        name: 'Contracts',
        sub: 'Contractual obligations and compliance milestones',
        status: 'On track',
        pct: 0,
        team: 1,
        lead: ctx.user.name || ctx.user.email || 'Legal & Ops Lead',
        milestone: 'Active Obligations',
        deadline: new Date(Date.now() + 90 * 864e5),
        organizationId: orgId
      }
    })
  }

  const createdTasks: any[] = []

  for (const ob of targetObligations) {
    // Ensure strict idempotency: re-check if taskId was already populated
    const current = await db.obligation.findUnique({ where: { id: ob.id } })
    if (!current || current.taskId) continue

    const due = ob.due || new Date(Date.now() + 7 * 864e5)
    const priority = ['high', 'medium', 'low'].includes(ob.priority) ? ob.priority : 'medium'

    const task = await db.task.create({
      data: {
        title: ob.text,
        desc: `Contract: ${contract.name}${contract.party ? ` (${contract.party})` : ''} • Kind: ${ob.kind} • Owner: ${ob.owner}`,
        priority,
        due,
        status: 'TODO',
        progress: 0,
        organizationId: orgId,
        ownerId: ctx.user.id,
        assigneeId: ctx.user.id,
        projectId: project.id
      }
    })

    await db.obligation.update({
      where: { id: ob.id },
      data: { taskId: task.id }
    })

    await db.activity.create({
      data: {
        who: ctx.user.name || ctx.user.email || 'Someone',
        what: 'created task from obligation',
        target: ob.text.slice(0, 50),
        userId: ctx.user.id,
        organizationId: orgId
      }
    })

    createdTasks.push(task)
  }

  return Response.json({
    ok: true,
    createdTasksCount: createdTasks.length,
    tasks: createdTasks
  })
}

