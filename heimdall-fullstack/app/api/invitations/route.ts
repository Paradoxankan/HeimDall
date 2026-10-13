import {db} from '@/lib/db'
import {getMe,bad,getActiveContext} from '@/lib/guard'
import {Role} from '@prisma/client'

export const dynamic='force-dynamic'

const EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_ROLES:Role[]=['EMPLOYEE','MANAGER','HR','EXECUTIVE']

export async function GET(){
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 const ctx=getActiveContext(me)
 if(ctx.isPersonal||!ctx.organizationId)return bad('Select an organization workspace first',400)
 if(ctx.role!=='EXECUTIVE'&&ctx.role!=='HR')return bad('Forbidden: Only Executives and HR can view invitations',403)

 const list=await db.invitation.findMany({
  where:{organizationId:ctx.organizationId},
  include:{invitedBy:{select:{name:true,email:true}}},
  orderBy:{createdAt:'desc'}
 })

 return Response.json(list.map(i=>({
  id:i.id,
  email:i.email,
  role:i.role,
  status:i.status,
  token:i.token,
  createdAt:i.createdAt,
  expiresAt:i.expiresAt,
  invitedBy:i.invitedBy?.name||i.invitedBy?.email||'Team lead'
 })))
}

export async function POST(req:Request){
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 const ctx=getActiveContext(me)
 if(ctx.isPersonal||!ctx.organizationId)return bad('Select an organization workspace first',400)
 if(ctx.role!=='EXECUTIVE'&&ctx.role!=='HR')return bad('Forbidden: Only Executives and HR can invite team members',403)

 const b=await req.json().catch(()=>null);if(!b)return bad('Invalid JSON body',400)
 const email=String(b.email||'').trim().toLowerCase()
 if(!EMAIL_RE.test(email))return bad('Please provide a valid email address',400)

 const role=(b.role||'EMPLOYEE') as Role
 if(!VALID_ROLES.includes(role))return bad('Invalid organization role',400)

 const existingUser=await db.user.findUnique({where:{email}})
 if(existingUser){
  const existingMem=await db.membership.findUnique({where:{userId:existingUser.id}})
  if(existingMem&&existingMem.organizationId===ctx.organizationId){
   return bad('User is already a member of this organization',409)
  }
 }

 const existingInvite=await db.invitation.findFirst({
  where:{organizationId:ctx.organizationId,email,status:'PENDING'}
 })
 if(existingInvite){
  if(existingInvite.expiresAt>new Date()){
   return bad('An invitation is already pending for this email address',409)
  }else{
   await db.invitation.update({where:{id:existingInvite.id},data:{status:'REVOKED'}})
  }
 }

 // 14 days expiration as specified
 const expiresAt=new Date(Date.now()+14*864e5)

 const invite=await db.invitation.create({
  data:{
   organizationId:ctx.organizationId,
   email,
   role,
   invitedById:me.id,
   expiresAt
  }
 })

 return Response.json(invite,{status:201})
}
