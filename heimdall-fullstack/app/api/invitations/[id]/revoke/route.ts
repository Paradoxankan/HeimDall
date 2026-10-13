import {db} from '@/lib/db'
import {getContext,bad} from '@/lib/guard'

export const dynamic='force-dynamic'

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params
 const ctx=await getContext()
 if(!ctx)return bad('Unauthorized',401)
 const {membership}=ctx

 if(!membership){
  return bad('Select an organization workspace first',400)
 }

 const invite=await db.invitation.findFirst({
  where:{OR:[{id},{token:id}]}
 })

 if(!invite){
  return bad('Invitation not found',404)
 }

 if(invite.organizationId!==membership.organizationId){
  return bad('Forbidden: Invitation belongs to a different organization',403)
 }

 const isAuthorized=membership.role==='EXECUTIVE'||membership.role==='HR'||membership.role==='MANAGER'
 if(!isAuthorized){
  return bad('Forbidden: You do not have permission to revoke invitations',403)
 }

 await db.invitation.update({
  where:{id:invite.id},
  data:{status:'REVOKED'}
 })

 return Response.json({success:true,status:'REVOKED'})
}
