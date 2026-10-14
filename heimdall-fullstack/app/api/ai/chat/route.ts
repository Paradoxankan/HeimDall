import {getContext,bad} from '@/lib/guard'
import {db} from '@/lib/db'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const ctx = await getContext()
  if (!ctx) return bad('Unauthorized', 401)

  const body = await req.json().catch(() => null)
  const userMessage = String(body?.message || '').trim()
  if (!userMessage) return bad('Message is required', 400)

  const {user,membership,org} = ctx
  const isPersonal = !membership
  const role = isPersonal ? 'EMPLOYEE' : membership.role
  const orgId = membership?.organizationId
  const todayStr = new Date().toISOString().slice(0, 10)

  // Strictly collect ONLY data authorized for caller's role
  const tasksWhere: any = isPersonal
    ? { ownerId: user.id, organizationId: null }
    : (role === 'MANAGER' || role === 'EXECUTIVE')
    ? { organizationId: orgId! }
    : { organizationId: orgId!, OR: [{ assigneeId: user.id }, { ownerId: user.id }] }

  const tasks = await db.task.findMany({
    where: tasksWhere,
    select: {
      id: true,
      title: true,
      priority: true,
      due: true,
      status: true,
      progress: true
    },
    take: 40,
    orderBy: { due: 'asc' }
  })

  const projects = isPersonal
    ? []
    : await db.project.findMany({
        where: { organizationId: orgId! },
        select: { name: true, status: true, pct: true, deadline: true }
      })

  let contracts: any[] = []
  if (!isPersonal && (role === 'MANAGER' || role === 'EXECUTIVE')) {
    const rawContracts = await db.contract.findMany({
      where: { organizationId: orgId! },
      include: {
        obligations: {
          select: {
            text: true,
            owner: true,
            kind: true,
            due: true,
            priority: true,
            taskId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    contracts = rawContracts.map(c => ({
      name: c.name,
      party: c.party,
      summary: c.summary,
      due: c.due ? c.due.toISOString().slice(0, 10) : null,
      obligations: c.obligations.map(o => ({
        text: o.text,
        owner: o.owner,
        kind: o.kind,
        due: o.due ? o.due.toISOString().slice(0, 10) : null,
        priority: o.priority,
        hasTask: !!o.taskId
      }))
    }))
  }

  let risks: any[] = []
  if (!isPersonal && role === 'EXECUTIVE') {
    risks = await db.risk.findMany({
      where: { organizationId: orgId! },
      select: { level: true, title: true, detail: true, dept: true }
    })
  }

  const workspaceContext = {
    role,
    company: org?.name || 'Personal Space',
    tasks: tasks.map(t => ({
      title: t.title,
      due: t.due ? t.due.toISOString().slice(0, 10) : null,
      status: t.status,
      priority: t.priority
    })),
    projects: projects.map(p => ({
      name: p.name,
      status: p.status,
      pct: p.pct,
      deadline: p.deadline.toISOString().slice(0, 10)
    })),
    contracts,
    risks
  }

  const provider = (process.env.AI_PROVIDER || 'anthropic').toLowerCase()
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY

  if (!anthropicKey && !geminiKey) {
    // Return flag to client to use smart local answer generator
    return Response.json({ answer: null, fallback: true })
  }

  const systemPrompt = `You are HeimDall AI, the intelligent workspace and legal contract assistant.
Today's date is ${todayStr}.
You are speaking with ${user.name || user.email} whose role is ${role} in ${org?.name || 'Personal Space'}.

CRITICAL SECURITY RULES:
1. Base your answer SOLELY on the authorized workspace data below.
2. NEVER mention or speculate on data from other companies or roles.
3. If the user asks about something not in the workspace data, succinctly state that the information is not tracked in the current workspace.
4. Keep responses concise (under 120 words), clear, and actionable.

AUTHORIZED WORKSPACE CONTEXT:
${JSON.stringify(workspaceContext, null, 2)}`

  try {
    if (provider === 'gemini' && geminiKey) {
      const model = process.env.AI_MODEL || 'gemini-1.5-flash'
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': geminiKey
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }]
        })
      })
      if (res.ok) {
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) return Response.json({ answer: text })
      }
    } else if (anthropicKey) {
      const model = process.env.AI_MODEL || 'claude-3-5-sonnet-20241022'
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }]
        })
      })
      if (res.ok) {
        const data = await res.json()
        const text = data?.content?.[0]?.text
        if (text) return Response.json({ answer: text })
      }
    }
  } catch {
    // If AI network call times out or errors, fall back to smart local answer
  }

  return Response.json({ answer: null, fallback: true })
}

