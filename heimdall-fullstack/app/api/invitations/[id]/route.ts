import {cookies} from 'next/headers'
import {db} from '@/lib/db'
import {getContext,bad,HD_ORG_COOKIE,getCookieOptions} from '@/lib/guard'

export const dynamic='force-dynamic'

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params
 const invite=await db.invitation.findFirst({
  where:{OR:[{id},{token:id}]},
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

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params
 const ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 const {user}=ctx

 const invite=await db.invitation.findFirst({where:{OR:[{id},{token:id}]},include:{organization:true}})
 if(!invite)return bad('Invitation not found',404)

 if(invite.status!=='PENDING')return bad(`This invitation has already been ${invite.status.toLowerCase()}`,400)
 if(invite.expiresAt<new Date()){
  await db.invitation.update({where:{id:invite.id},data:{status:'REVOKED'}})
  return bad('This invitation has expired',410)
 }

 if(!user.email||invite.email.toLowerCase()!==user.email.toLowerCase()){
  return bad(`This invitation is intended for ${invite.email}. You are signed in as ${user.email||'another account'}.`,403)
 }

 const alreadyMember=await db.membership.findUnique({
  where:{
   userId_organizationId:{
    userId:user.id,
    organizationId:invite.organizationId
   }
  }
 })
 if(alreadyMember){
  return bad('You are already a member of this organization',409)
 }

 const result=await db.$transaction(async tx=>{
  const member=await tx.membership.create({
   data:{
    organizationId:invite.organizationId,
    userId:user.id,
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

 const cookieStore=await cookies()
 cookieStore.set(HD_ORG_COOKIE,invite.organizationId,getCookieOptions())

 return Response.json({success:true,company:result.company})
}

export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params
 const ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 const {user,membership}=ctx

 const invite=await db.invitation.findFirst({where:{OR:[{id},{token:id}]}})
 if(!invite)return bad('Invitation not found',404)

 const isInvitedUser=Boolean(user.email&&invite.email.toLowerCase()===user.email.toLowerCase())
 const isOrgAdmin=Boolean(
  membership&&
  membership.organizationId===invite.organizationId&&
  (membership.role==='EXECUTIVE'||membership.role==='HR'||membership.role==='MANAGER')
 )

 if(!isInvitedUser&&!isOrgAdmin)return bad('Forbidden',403)

 const newStatus=isInvitedUser?'DECLINED':'REVOKED'
 await db.invitation.update({where:{id:invite.id},data:{status:newStatus}})
 return Response.json({success:true,status:newStatus})
}
