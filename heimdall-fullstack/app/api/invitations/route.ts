import {db} from '@/lib/db'
import {getMe,bad,getActiveContext} from '@/lib/guard'
import {Role} from '@prisma/client'

export const dynamic='force-dynamic'

const EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_ROLES:Role[]=['EMPLOYEE','MANAGER','HR','EXECUTIVE']

export async function GET(){
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 const ctx=getActiveContext(me)
 if(ctx.isPersonal||!ctx.companyId)return bad('Select a company workspace first',400)
 if(ctx.role!=='EXECUTIVE'&&ctx.role!=='HR')return bad('Forbidden: Only Executives and HR can view invitations',403)

 const list=await db.invitation.findMany({
  where:{companyId:ctx.companyId},
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
 if(ctx.isPersonal||!ctx.companyId)return bad('Select a company workspace first',400)
 if(ctx.role!=='EXECUTIVE'&&ctx.role!=='HR')return bad('Forbidden: Only Executives and HR can invite team members',403)

 const b=await req.json().catch(()=>null);if(!b)return bad('Invalid JSON body',400)
 const email=String(b.email||'').trim().toLowerCase()
 if(!EMAIL_RE.test(email))return bad('Please provide a valid email address',400)

 const role=(b.role||'EMPLOYEE') as Role
 if(!VALID_ROLES.includes(role))return bad('Invalid company role',400)

 const existingUser=await db.user.findUnique({where:{email}})
 if(existingUser){
  const existingMember=await db.companyMember.findUnique({
   where:{companyId_userId:{companyId:ctx.companyId,userId:existingUser.id}}
  })
  if(existingMember)return bad('User is already a member of this company',409)
 }

 const existingInvite=await db.invitation.findFirst({
  where:{companyId:ctx.companyId,email,status:'PENDING'}
 })
 if(existingInvite){
  if(existingInvite.expiresAt>new Date()){
   return bad('An invitation is already pending for this email',409)
  } else {
   await db.invitation.update({where:{id:existingInvite.id},data:{status:'EXPIRED'}})
  }
 }

 const invite=await db.invitation.create({
  data:{
   companyId:ctx.companyId,
   email,
   role,
   invitedById:me.id,
   expiresAt:new Date(Date.now()+7*864e5)
  }
 })

 return Response.json(invite,{status:201})
}

