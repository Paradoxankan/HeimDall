import {cookies} from 'next/headers'
import {db} from '@/lib/db'
import {getContext,bad,HD_ORG_COOKIE,getCookieOptions} from '@/lib/guard'

export const dynamic='force-dynamic'

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params
 const ctx=await getContext()
 if(!ctx)return bad('Unauthorized',401)
 const {user}=ctx

 const invite=await db.invitation.findFirst({
  where:{OR:[{id},{token:id}]},
  include:{organization:true}
 })

 if(!invite){
  return bad('Invitation not found',404)
 }

 if(invite.status!=='PENDING'){
  return bad(`This invitation has already been ${invite.status.toLowerCase()}`,400)
 }

 if(invite.expiresAt<new Date()){
  await db.invitation.update({where:{id:invite.id},data:{status:'REVOKED'}})
  return bad('This invitation has expired',410)
 }

 if(!user.email||invite.email.toLowerCase()!==user.email.toLowerCase()){
  return bad(`This invitation is intended for ${invite.email}. You are signed in as ${user.email||'another account'}.`,403)
 }

 // Check if user is already a member of this specific organization
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
  const newMembership=await tx.membership.create({
   data:{
    organizationId:invite.organizationId,
    userId:user.id,
    role:invite.role,
    addedById:invite.invitedById
   }
  })

  const updatedInvite=await tx.invitation.update({
   where:{id:invite.id},
   data:{status:'ACCEPTED'}
  })

  return {membership:newMembership,organization:invite.organization,invitation:updatedInvite}
 })

 // Switch active organization cookie to the newly joined company
 const cookieStore=await cookies()
 cookieStore.set(HD_ORG_COOKIE,invite.organizationId,getCookieOptions())

 return Response.json({
  success:true,
  company:result.organization,
  membership:result.membership
 })
}
