import {cookies} from 'next/headers'
import {getContext,bad,HD_ORG_COOKIE,getCookieOptions} from '@/lib/guard'
import {db} from '@/lib/db'

export const dynamic='force-dynamic'

export async function POST(req:Request){
 const ctx=await getContext()
 if(!ctx)return bad('Unauthorized',401)

 const b=await req.json().catch(()=>null)
 if(!b)return bad('Invalid JSON body',400)

 // Accept organizationId or companyId for compatibility
 const targetOrgId=b.organizationId!==undefined?b.organizationId:b.companyId

 if(targetOrgId===null){
  const cookieStore=await cookies()
  cookieStore.set(HD_ORG_COOKIE,'personal',getCookieOptions())
  return Response.json({success:true,activeOrganization:null,isPersonal:true})
 }

 if(typeof targetOrgId!=='string'||!targetOrgId.trim()){
  return bad('Invalid organization ID',400)
 }

 const orgId=targetOrgId.trim()

 // Verify caller has a membership in that organization
 const membership=await db.membership.findUnique({
  where:{
   userId_organizationId:{
    userId:ctx.user.id,
    organizationId:orgId
   }
  },
  include:{organization:true}
 })

 if(!membership){
  return bad('You are not a member of this organization',403)
 }

 const cookieStore=await cookies()
 cookieStore.set(HD_ORG_COOKIE,orgId,getCookieOptions())

 return Response.json({
  success:true,
  activeOrganization:{
   id:membership.organization.id,
   name:membership.organization.name,
   slug:membership.organization.slug
  },
  isPersonal:false,
  role:membership.role
 })
}
