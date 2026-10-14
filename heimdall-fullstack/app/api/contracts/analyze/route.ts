import {getContext,bad} from '@/lib/guard'
import {db} from '@/lib/db'
import {extractContract} from '@/lib/ai'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const ctx = await getContext()
  if (!ctx) return bad('Unauthorized', 401)
  if (!ctx.membership || !ctx.org) {
    return bad('Organization membership required', 403)
  }

  const role = ctx.membership.role
  if (role !== 'MANAGER' && role !== 'EXECUTIVE') {
    return bad('Forbidden: Only Managers and Executives can analyze contracts', 403)
  }

  const orgId = ctx.membership.organizationId

  const formData = await req.formData().catch(() => null)
  if (!formData) return bad('Invalid multipart form data', 400)

  const file = formData.get('file') as File | null
  if (!file) return bad('No file provided in form data', 400)

  // Maximum file size: 3.5 MB (Vercel serverless body limit is 4.5 MB)
  if (file.size > 3.5 * 1024 * 1024) {
    return bad('File size exceeds 3.5 MB limit', 400)
  }

  const fileName = file.name || 'document'
  const lowerName = fileName.toLowerCase()
  const isAllowedExt = lowerName.endsWith('.pdf') || lowerName.endsWith('.txt') || lowerName.endsWith('.md')
  if (!isAllowedExt) {
    return bad('Unsupported file format: Only .pdf, .txt, and .md files are supported', 400)
  }

  const mimeType = file.type || (lowerName.endsWith('.pdf') ? 'application/pdf' : 'text/plain')
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  let extracted
  try {
    extracted = await extractContract({
      buffer,
      mimeType,
      fileName
    })
  } catch (err: any) {
    return bad(err.message || 'Contract extraction failed', 500)
  }

  // Calculate earliest future obligation date for Contract.due
  const now = new Date()
  let earliestFutureDue: Date | null = null
  for (const ob of extracted.obligations) {
    if (ob.due) {
      const d = new Date(ob.due)
      if (!isNaN(d.getTime()) && d >= now) {
        if (!earliestFutureDue || d < earliestFutureDue) {
          earliestFutureDue = d
        }
      }
    }
  }

  const contract = await db.contract.create({
    data: {
      name: extracted.title || fileName,
      party: extracted.party,
      summary: extracted.summary,
      fileName,
      uploadedById: ctx.user.id,
      organizationId: orgId,
      due: earliestFutureDue,
      note: extracted.summary ? extracted.summary.slice(0, 200) : '',
      obligations: {
        create: extracted.obligations.map(o => ({
          text: o.text,
          owner: o.owner,
          kind: o.kind,
          due: o.due ? new Date(o.due) : null,
          priority: o.priority
        }))
      }
    },
    include: {
      obligations: true
    }
  })

  await db.activity.create({
    data: {
      who: ctx.user.name || ctx.user.email || 'Someone',
      what: 'analyzed contract',
      target: contract.name,
      userId: ctx.user.id,
      organizationId: orgId
    }
  })

  return Response.json(contract, { status: 201 })
}
