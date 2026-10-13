import {db} from '@/lib/db'
import {getContext,bad,can} from '@/lib/guard'
import {Role} from '@prisma/client'

export const dynamic='force-dynamic'

const EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_ROLES:Role[]=['EMPLOYEE','MANAGER','HR','EXECUTIVE']

export async function GET(){
 const ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 if(!ctx.membership||!ctx.org)return bad('Select an organization workspace first',400)
 const orgId=ctx.membership.organizationId

 const list=await db.invitation.findMany({
  where:{organizationId:orgId},
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
 const ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 if(!ctx.membership||!ctx.org)return bad('Select an organization workspace first',400)
 const orgId=ctx.membership.organizationId

 const b=await req.json().catch(()=>null);if(!b)return bad('Invalid JSON body',400)
 const email=String(b.email||'').trim().toLowerCase()
 if(!EMAIL_RE.test(email))return bad('Please provide a valid email address',400)

 const role=(b.role||'EMPLOYEE') as Role
 if(!VALID_ROLES.includes(role))return bad('Invalid organization role',400)

 if(!can(ctx.membership.role,'member.invite',role)){
  return bad(`Forbidden: You do not have permission to invite a member as ${role}`,403)
 }

 const existingUser=await db.user.findUnique({where:{email}})
 if(existingUser){
  const existingMem=await db.membership.findUnique({where:{userId:existingUser.id}})
  if(existingMem&&existingMem.organizationId===orgId){
   return bad('User is already a member of this organization',409)
  }
 }

 const existingInvite=await db.invitation.findFirst({
  where:{organizationId:orgId,email,status:'PENDING'}
 })
 if(existingInvite){
  if(existingInvite.expiresAt>new Date()){
   return bad('An invitation is already pending for this email address',409)
  }else{
   await db.invitation.update({where:{id:existingInvite.id},data:{status:'REVOKED'}})
  }
 }

 const expiresAt=new Date(Date.now()+14*864e5)

 const invite=await db.invitation.create({
  data:{
   organizationId:orgId,
   email,
   role,
   invitedById:ctx.user.id,
   expiresAt
  }
 })

 return Response.json(invite,{status:201})
}
