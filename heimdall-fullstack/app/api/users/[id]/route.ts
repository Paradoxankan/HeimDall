import {db} from '@/lib/db'
import {getContext,bad,can} from '@/lib/guard'
import {Role} from '@prisma/client'

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params,ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 if(!ctx.membership||ctx.membership.role!=='EXECUTIVE')return bad('Forbidden: Only Executives can modify member roles',403)
 if(id===ctx.user.id)return bad('You cannot change your own role',400)

 const b=await req.json().catch(()=>null)
 const role=b?.role as Role
 if(!['EMPLOYEE','MANAGER','HR','EXECUTIVE'].includes(role))return bad('Invalid role',400)

 const member=await db.membership.findUnique({
  where:{userId:id}
 })
 if(!member||member.organizationId!==ctx.membership.organizationId)return bad('User is not a member of this organization',404)

 const updated=await db.membership.update({
  where:{id:member.id},
  data:{role}
 })

 return Response.json(updated)
}

export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params,ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 if(!ctx.membership)return bad('Forbidden',403)
 if(id===ctx.user.id)return bad('You cannot remove yourself from the organization',400)

 const member=await db.membership.findUnique({
  where:{userId:id}
 })
 if(!member||member.organizationId!==ctx.membership.organizationId){
  return bad('User is not a member of this organization',404)
 }

 if(!can(ctx.membership.role,'member.remove',member.role)){
  return bad(`Forbidden: You do not have permission to remove a member with role ${member.role}`,403)
 }

 await db.membership.delete({where:{id:member.id}})
 return Response.json({success:true})
}
