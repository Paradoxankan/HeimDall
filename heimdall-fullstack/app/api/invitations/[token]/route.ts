import {db} from '@/lib/db'
import {getMe,bad} from '@/lib/guard'

export const dynamic='force-dynamic'

export async function GET(_:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params
 const invite=await db.invitation.findUnique({
  where:{token},
  include:{organization:{select:{name:true,slug:true}},invitedBy:{select:{name:true,email:true}}}
 })
 if(!invite)return bad('Invitation not found',404)

 const isExpired=invite.expiresAt<new Date()
 if(isExpired&&invite.status==='PENDING'){
  await db.invitation.update({where:{id:invite.id},data:{status:'REVOKED'}})
 }

 return Response.json({
  id:invite.id,
  token:invite.token,
  companyName:invite.organization.name,
  companySlug:invite.organization.slug,
  email:invite.email,
  role:invite.role,
  status:isExpired&&invite.status==='PENDING'?'REVOKED':invite.status,
  expiresAt:invite.expiresAt,
  invitedBy:invite.invitedBy?.name||invite.invitedBy?.email||'Team lead'
 })
}

export async function POST(_:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 const invite=await db.invitation.findUnique({where:{token},include:{organization:true}})
 if(!invite)return bad('Invitation not found',404)

 if(invite.status!=='PENDING')return bad(`This invitation has already been ${invite.status.toLowerCase()}`,400)
 if(invite.expiresAt<new Date()){
  await db.invitation.update({where:{id:invite.id},data:{status:'REVOKED'}})
  return bad('This invitation has expired',410)
 }

 if(!me.email||invite.email.toLowerCase()!==me.email.toLowerCase()){
  return bad(`This invitation is intended for ${invite.email}. You are signed in as ${me.email||'another account'}.`,403)
 }

 if(me.membership){
  return bad('You already belong to an organization. A user may belong to only one organization at a time.',409)
 }

 const result=await db.$transaction(async tx=>{
  const member=await tx.membership.create({
   data:{
    organizationId:invite.organizationId,
    userId:me.id,
    role:invite.role,
    addedById:invite.invitedById
   }
  })
  await tx.invitation.update({
   where:{id:invite.id},
   data:{status:'ACCEPTED'}
  })
  return {member,company:invite.organization}
 })

 return Response.json({success:true,company:result.company})
}

export async function DELETE(_:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 const invite=await db.invitation.findUnique({where:{token}})
 if(!invite)return bad('Invitation not found',404)

 const isInvitedUser=Boolean(me.email&&invite.email.toLowerCase()===me.email.toLowerCase())
 const isOrgAdmin=Boolean(
  me.membership&&
  me.membership.organizationId===invite.organizationId&&
  (me.membership.role==='EXECUTIVE'||me.membership.role==='HR')
 )

 if(!isInvitedUser&&!isOrgAdmin)return bad('Forbidden',403)

 const newStatus=isInvitedUser?'DECLINED':'REVOKED'
 await db.invitation.update({where:{id:invite.id},data:{status:newStatus}})
 return Response.json({success:true,status:newStatus})
}
