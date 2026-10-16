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

  // Check all common environment variable names for the API key
  const rawKey = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.AI_API_KEY ||
    ''
  ).trim()

  if (!rawKey) {
    return Response.json({
      answer: null,
      fallback: true,
      debugError: 'No API key found in process.env (checked GEMINI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, GROQ_API_KEY).'
    })
  }

  const errors: string[] = []

  // 1. Google Gemini Key (starts with AIza)
  if (rawKey.startsWith('AIza') || process.env.GEMINI_API_KEY) {
    const gKey = (process.env.GEMINI_API_KEY || rawKey).trim()
    let modelsToTry = [
      process.env.AI_MODEL,
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest'
    ].filter(Boolean) as string[]

    // Dynamically fetch exact models enabled for this key
    try {
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(gKey)}`)
      if (listRes.ok) {
        const listData = await listRes.json()
        const discovered = (listData.models || [])
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent') && !m.name.includes('image') && !m.name.includes('tts') && !m.name.includes('embedding'))
          .map((m: any) => m.name.replace('models/', ''))
        if (discovered.length > 0) {
          const preferred = discovered.filter((m: string) => m.includes('flash'))
          modelsToTry = [...new Set([...preferred, ...discovered])]
        }
      } else {
        errors.push(`Gemini listModels (${listRes.status}): ${await listRes.text()}`)
      }
    } catch (e: any) {
      errors.push(`Gemini listModels network error: ${e.message}`)
    }

    for (const model of modelsToTry.slice(0, 4)) {
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
          errors.push(`Gemini ${model} (${res.status}): ${(await res.text()).slice(0, 150)}`)
        }
      } catch (e: any) {
        errors.push(`Gemini ${model} error: ${e.message}`)
      }
    }
  }

  // 2. Anthropic Key (starts with sk-ant)
  if (rawKey.startsWith('sk-ant') || process.env.ANTHROPIC_API_KEY) {
    const aKey = (process.env.ANTHROPIC_API_KEY || rawKey).trim()
    const modelsToTry = [
      process.env.AI_MODEL,
      'claude-3-7-sonnet-latest',
      'claude-3-5-sonnet-latest',
      'claude-3-5-haiku-latest',
      'claude-3-haiku-20240307'
    ].filter(Boolean) as string[]

    for (const model of modelsToTry) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': aKey,
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
          if (text) return Response.json({ answer: text, modelUsed: model })
        } else {
          errors.push(`Anthropic ${model} (${res.status}): ${(await res.text()).slice(0, 150)}`)
        }
      } catch (e: any) {
        errors.push(`Anthropic ${model} error: ${e.message}`)
      }
    }
  }

  // 3. Groq Key (starts with gsk_) or OpenAI Key (starts with sk-)
  if (rawKey.startsWith('gsk_') || (rawKey.startsWith('sk-') && !rawKey.startsWith('sk-ant'))) {
    const isGroq = rawKey.startsWith('gsk_')
    const baseUrl = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions'
    const defaultModel = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini'
    const model = process.env.AI_MODEL || defaultModel
    try {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${rawKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]
        })
      })
      if (res.ok) {
        const data = await res.json()
        const text = data?.choices?.[0]?.message?.content
        if (text) return Response.json({ answer: text, modelUsed: model })
      } else {
        errors.push(`${isGroq ? 'Groq' : 'OpenAI'} (${res.status}): ${(await res.text()).slice(0, 150)}`)
      }
    } catch (e: any) {
      errors.push(`OpenAI/Groq error: ${e.message}`)
    }
  }

  return Response.json({
    answer: null,
    fallback: true,
    debugError: errors.join(' | ') || 'Unrecognized API key format'
  })
}

