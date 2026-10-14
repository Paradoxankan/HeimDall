import {cookies} from 'next/headers'
import {db} from '@/lib/db'
import {getContext,bad,HD_ORG_COOKIE,getCookieOptions} from '@/lib/guard'

export const dynamic='force-dynamic'

const SLUG_RE=/^[a-z0-9]+(?:-[a-z0-9]+)*$/

export async function POST(req:Request){
 const ctx=await getContext()
 if(!ctx)return bad('Unauthorized',401)

 const b=await req.json().catch(()=>null)
 if(!b)return bad('Invalid JSON body',400)

 const name=String(b.name||'').trim()
 if(name.length<3||name.length>60){
  return bad('Company name must be between 3 and 60 characters',400)
 }

 const slug=String(b.slug||'').trim().toLowerCase()
 if(slug.length<3||slug.length>40){
  return bad('Company handle must be between 3 and 40 characters',400)
 }

 if(!SLUG_RE.test(slug)){
  return bad('Handle may only contain lowercase letters, numbers, and hyphens without consecutive or trailing dashes',400)
 }

 const existing=await db.organization.findUnique({where:{slug}})
 if(existing){
  return bad('An organization with this handle already exists',409)
 }

 const result=await db.$transaction(async tx=>{
  const organization=await tx.organization.create({
   data:{
    name,
    slug,
    createdById:ctx.user.id,
    plan:'STARTER'
   }
  })

  const membership=await tx.membership.create({
   data:{
    organizationId:organization.id,
    userId:ctx.user.id,
    role:'EXECUTIVE'
   }
  })

  return {organization,membership}
 })

 // Switch active organization to the newly created company
 const cookieStore=await cookies()
 cookieStore.set(HD_ORG_COOKIE,result.organization.id,getCookieOptions())

 return Response.json(result,{status:201})
}
