import {db} from '@/lib/db'
import {getMe,bad} from '@/lib/guard'

export const dynamic='force-dynamic'

export async function GET(_:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params
 const invite=await db.invitation.findUnique({
  where:{token},
  include:{company:{select:{name:true,slug:true}},invitedBy:{select:{name:true,email:true}}}
 })
 if(!invite)return bad('Invitation not found',404)

 const isExpired=invite.expiresAt<new Date()
 if(isExpired&&invite.status==='PENDING'){
  await db.invitation.update({where:{id:invite.id},data:{status:'EXPIRED'}})
 }

 return Response.json({
  id:invite.id,
  token:invite.token,
  companyName:invite.company.name,
  companySlug:invite.company.slug,
  email:invite.email,
  role:invite.role,
  status:isExpired&&invite.status==='PENDING'?'EXPIRED':invite.status,
  expiresAt:invite.expiresAt,
  invitedBy:invite.invitedBy?.name||invite.invitedBy?.email||'Team lead'
 })
}

export async function POST(_:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 const invite=await db.invitation.findUnique({where:{token},include:{company:true}})
 if(!invite)return bad('Invitation not found',404)

 if(invite.status!=='PENDING')return bad(`This invitation has already been ${invite.status.toLowerCase()}`,400)
 if(invite.expiresAt<new Date()){
  await db.invitation.update({where:{id:invite.id},data:{status:'EXPIRED'}})
  return bad('This invitation has expired',410)
 }

 if(!me.email||invite.email.toLowerCase()!==me.email.toLowerCase()){
  return bad(`This invitation is intended for ${invite.email}. You are signed in as ${me.email||'another account'}.`,403)
 }

 const result=await db.$transaction(async tx=>{
  const member=await tx.companyMember.upsert({
   where:{companyId_userId:{companyId:invite.companyId,userId:me.id}},
   update:{role:invite.role},
   create:{
    companyId:invite.companyId,
    userId:me.id,
    role:invite.role
   }
  })
  await tx.invitation.update({
   where:{id:invite.id},
   data:{status:'ACCEPTED'}
  })
  await tx.user.update({
   where:{id:me.id},
   data:{activeCompanyId:invite.companyId}
  })
  return {member,company:invite.company}
 })

 return Response.json({success:true,company:result.company})
}

export async function DELETE(_:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 const invite=await db.invitation.findUnique({where:{token}})
 if(!invite)return bad('Invitation not found',404)

 const isInvitedUser=me.email&&invite.email.toLowerCase()===me.email.toLowerCase()
 const membership=me.memberships.find(m=>m.companyId===invite.companyId)
 const isCompanyAdmin=membership&&(membership.role==='EXECUTIVE'||membership.role==='HR')

 if(!isInvitedUser&&!isCompanyAdmin)return bad('Forbidden',403)

 const newStatus=isInvitedUser?'DECLINED':'CANCELLED'
 await db.invitation.update({where:{id:invite.id},data:{status:newStatus}})
 return Response.json({success:true,status:newStatus})
}

