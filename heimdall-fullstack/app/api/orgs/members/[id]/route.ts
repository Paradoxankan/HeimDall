import {db} from '@/lib/db'
import {getContext,bad} from '@/lib/guard'
import {can} from '@/lib/permissions'

export const dynamic='force-dynamic'

export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params
 const ctx=await getContext()
 if(!ctx)return bad('Unauthorized',401)
 if(!ctx.membership||!ctx.org)return bad('Select an organization workspace first',400)
 const orgId=ctx.membership.organizationId

 const targetMember=await db.membership.findFirst({
  where:{
   organizationId:orgId,
   OR:[{id},{userId:id}]
  },
  include:{organization:true,user:true}
 })

 if(!targetMember){
  return bad('Member not found in this organization',404)
 }

 // Prevent removing self from here
 if(targetMember.userId===ctx.user.id){
  return bad('You cannot remove yourself from the organization here',400)
 }

 // Prevent removing organization creator
 if(targetMember.userId===targetMember.organization.createdById){
  return bad('The organization owner/creator cannot be removed',403)
 }

 // Verify permissions: EXECUTIVE can remove any, HR can remove EMPLOYEE only
 if(!can(ctx.membership.role,'member.remove',targetMember.role)){
  return bad(`Forbidden: You do not have permission to remove a ${targetMember.role}`,403)
 }

 await db.membership.delete({where:{id:targetMember.id}})

 return Response.json({success:true,message:'Member removed successfully'})
}

