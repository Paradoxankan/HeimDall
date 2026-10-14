import {cookies} from 'next/headers'
import {getContext,bad,HD_ORG_COOKIE,getCookieOptions} from '@/lib/guard'
import {db} from '@/lib/db'

export const dynamic='force-dynamic'

export async function POST(){
 const ctx=await getContext()
 if(!ctx)return bad('Unauthorized',401)
 if(!ctx.membership||!ctx.org){
  return bad('Select an organization workspace first',400)
 }

 const orgId=ctx.org.id

 // Safety rule: a user who is the only EXECUTIVE cannot leave
 if(ctx.membership.role==='EXECUTIVE'){
  const execCount=await db.membership.count({
   where:{organizationId:orgId,role:'EXECUTIVE'}
  })
  if(execCount<=1){
   return bad('Cannot leave organization: You are the only Executive. You must promote another member to Executive first.',409)
  }
 }

 // Remove this membership
 await db.membership.delete({
  where:{id:ctx.membership.id}
 })

 // Find user's remaining memberships
 const remaining=await db.membership.findMany({
  where:{userId:ctx.user.id},
  include:{organization:true},
  orderBy:{createdAt:'desc'}
 })

 const cookieStore=await cookies()
 if(remaining.length>0){
  cookieStore.set(HD_ORG_COOKIE,remaining[0].organizationId,getCookieOptions())
 }else{
  cookieStore.set(HD_ORG_COOKIE,'personal',getCookieOptions())
 }

 return Response.json({
  success:true,
  message:`You have left ${ctx.org.name}.`,
  activeCompanyId:remaining[0]?.organizationId||null,
  isPersonal:remaining.length===0
 })
}
