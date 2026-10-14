import {db} from '@/lib/db'
import {getContext,bad,can} from '@/lib/guard'
import {Role} from '@prisma/client'

export const dynamic='force-dynamic'

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params,ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 if(!ctx.membership)return bad('Forbidden',403)

 const member=await db.membership.findFirst({
  where:{
   organizationId:ctx.membership.organizationId,
   OR:[{id},{userId:id}]
  },
  include:{user:true}
 })
 if(!member)return bad('User is not a member of this organization',404)

 return Response.json({
  id:member.user.id,
  membershipId:member.id,
  name:member.user.name||member.user.email,
  email:member.user.email,
  title:member.user.title||'',
  city:member.user.city||'',
  role:member.role,
  joinedAt:member.createdAt
 })
}

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params,ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 if(!ctx.membership||ctx.membership.role!=='EXECUTIVE')return bad('Forbidden: Only Executives can modify member roles',403)

 const member=await db.membership.findFirst({
  where:{
   organizationId:ctx.membership.organizationId,
   OR:[{id},{userId:id}]
  },
  include:{organization:true}
 })
 if(!member)return bad('User is not a member of this organization',404)

 if(member.userId===ctx.user.id)return bad('You cannot change your own role',400)

 const b=await req.json().catch(()=>null)
 const role=b?.role as Role
 if(!['EMPLOYEE','MANAGER','HR','EXECUTIVE'].includes(role))return bad('Invalid role',400)

 // If demoting an executive, verify they are not the sole executive
 if(member.role==='EXECUTIVE'&&role!=='EXECUTIVE'){
  const execCount=await db.membership.count({
   where:{organizationId:ctx.membership.organizationId,role:'EXECUTIVE'}
  })
  if(execCount<=1){
   return bad('Cannot demote the only Executive of this organization. Promote another member to Executive first.',409)
  }
 }

 const updated=await db.membership.update({
  where:{id:member.id},
  data:{role}
 })

 return Response.json(updated)
}

export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params,ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 if(!ctx.membership)return bad('Forbidden',403)

 const member=await db.membership.findFirst({
  where:{
   organizationId:ctx.membership.organizationId,
   OR:[{id},{userId:id}]
  },
  include:{organization:true}
 })
 if(!member)return bad('User is not a member of this organization',404)

 if(member.userId===ctx.user.id)return bad('You cannot remove yourself from the organization',400)

 // Safety rule: a user who is the only EXECUTIVE cannot be removed
 if(member.role==='EXECUTIVE'){
  const execCount=await db.membership.count({
   where:{organizationId:ctx.membership.organizationId,role:'EXECUTIVE'}
  })
  if(execCount<=1){
   return bad('Cannot remove the only Executive of this organization. Promote another member to Executive first.',409)
  }
 }

 if(!can(ctx.membership.role,'member.remove',member.role)){
  return bad(`Forbidden: You do not have permission to remove a member with role ${member.role}`,403)
 }

 await db.membership.delete({where:{id:member.id}})
 return Response.json({success:true,message:'Member removed successfully'})
}
