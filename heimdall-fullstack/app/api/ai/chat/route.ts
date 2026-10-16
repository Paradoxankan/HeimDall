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

  const tasksWhere: any = isPersonal
    ? { ownerId: user.id, organizationId: null }
    : (role === 'MANAGER' || role === 'EXECUTIVE')
    ? { organizationId: orgId! }
    : { organizationId: orgId!, OR: [{ assigneeId: user.id }, { ownerId: user.id }] }

  const tasks = await db.task.findMany({
    where: tasksWhere,
    select: { id: true, title: true, priority: true, due: true, status: true, progress: true },
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
          select: { text: true, owner: true, kind: true, due: true, priority: true, taskId: true }
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

  const systemPrompt = `You are HeimDall AI, the intelligent workspace and legal contract assistant.
Today's date is ${todayStr}.
You are speaking with ${user.name || user.email} whose role is ${role} in ${org?.name || 'Personal Space'}.
Base your answer on the authorized workspace data below, and answer the user's question directly and conversationally in under 120 words.

AUTHORIZED WORKSPACE CONTEXT:
${JSON.stringify(workspaceContext, null, 2)}`

  const gKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim()
  if (!gKey) {
    return Response.json({
      answer: null,
      fallback: true,
      debugError: 'Missing GEMINI_API_KEY in .env'
    })
  }

  // Query Google for the exact models enabled on this key, prioritizing Gemini 3 & non-deprecated models
  let modelsToTry: string[] = []
  const errors: string[] = []

  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(gKey)}`)
    if (listRes.ok) {
      const listData = await listRes.json()
      const retired = new Set([
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-1.5-flash',
        'gemini-1.5-pro'
      ])
      const discovered: string[] = (listData.models || [])
        .filter((m: any) =>
          m.supportedGenerationMethods?.includes('generateContent') &&
          !m.name.includes('image') &&
          !m.name.includes('tts') &&
          !m.name.includes('embedding') &&
          !m.name.includes('robotics') &&
          !m.name.includes('computer-use') &&
          !m.name.includes('aqa')
        )
        .map((m: any) => m.name.replace('models/', ''))
        .filter((name: string) => !retired.has(name))

      // Prioritize gemini-3 models first, then pro/gemma/latest models
      const gemini3 = discovered.filter(m => m.startsWith('gemini-3'))
      const others = discovered.filter(m => !m.startsWith('gemini-3'))
      modelsToTry = [...gemini3, ...others]
    }
  } catch {
    // Fallback list if listModels fails
  }

  if (modelsToTry.length === 0) {
    modelsToTry = [
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite-preview',
      'gemini-3.1-pro-preview',
      'gemini-2.5-pro',
      'gemini-flash-latest',
      'gemini-flash-lite-latest'
    ]
  }

  for (const model of modelsToTry.slice(0, 8)) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(gKey)}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }]
        })
      })
      if (res.ok) {
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) return Response.json({ answer: text, modelUsed: model })
      } else {
        const errJson = await res.json().catch(() => ({}))
        errors.push(`${model} (${res.status}): ${errJson?.error?.message?.slice(0, 80) || res.statusText}`)
      }
    } catch (e: any) {
      errors.push(`${model}: ${e.message}`)
    }
  }

  return Response.json({
    answer: null,
    fallback: true,
    debugError: errors.join(' | ')
  })
}

