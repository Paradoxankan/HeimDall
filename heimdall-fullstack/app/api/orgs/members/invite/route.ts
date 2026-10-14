import {db} from '@/lib/db'
import {getContext,bad} from '@/lib/guard'
import {can} from '@/lib/permissions'
import {Role} from '@prisma/client'

export const dynamic='force-dynamic'

const EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_ROLES:Role[]=['EMPLOYEE','MANAGER','HR','EXECUTIVE']

export async function POST(req:Request){
 const ctx=await getContext()
 if(!ctx)return bad('Unauthorized',401)
 if(!ctx.membership||!ctx.org)return bad('Select an organization workspace first',400)
 const orgId=ctx.membership.organizationId

 const b=await req.json().catch(()=>null)
 if(!b)return bad('Invalid JSON body',400)

 const email=String(b.email||'').trim().toLowerCase()
 if(!EMAIL_RE.test(email)){
  return bad('Please provide a valid email address',400)
 }

 const role=(b.role||'EMPLOYEE') as Role
 if(!VALID_ROLES.includes(role)){
  return bad('Invalid organization role',400)
 }

 // Enforce permission matrix: caller must have permission to invite target role
 if(!can(ctx.membership.role,'member.invite',role)){
  return bad(`Forbidden: You do not have permission to invite members as ${role}`,403)
 }

 // Check if user with this email is already a member of this organization
 const existingUser=await db.user.findUnique({where:{email}})
 if(existingUser){
  const existingMem=await db.membership.findUnique({
   where:{
    userId_organizationId:{
     userId:existingUser.id,
     organizationId:orgId
    }
   }
  })
  if(existingMem){
   return bad('User is already a member of this organization',409)
  }
 }

 // Check if a pending invitation exists for this email in this organization
 const existingInvite=await db.invitation.findFirst({
  where:{organizationId:orgId,email,status:'PENDING'}
 })
 if(existingInvite){
  if(existingInvite.expiresAt>new Date()){
   return bad('An invitation is already pending for this email address',409)
  }else{
   // Revoke expired invitation so a fresh one can be issued
   await db.invitation.update({where:{id:existingInvite.id},data:{status:'REVOKED'}})
  }
 }

 // Invitations expire in 14 days
 const expiresAt=new Date(Date.now()+14*864e5)

 const invite=await db.invitation.create({
  data:{
   organizationId:orgId,
   email,
   role,
   invitedById:ctx.user.id,
   expiresAt,
   status:'PENDING'
  },
  include:{
   organization:{select:{name:true,slug:true}},
   invitedBy:{select:{name:true,email:true}}
  }
 })

 return Response.json({
  id:invite.id,
  email:invite.email,
  role:invite.role,
  token:invite.token,
  status:invite.status,
  expiresAt:invite.expiresAt,
  createdAt:invite.createdAt,
  organizationName:invite.organization.name,
  invitedBy:invite.invitedBy?.name||invite.invitedBy?.email||'Team lead'
 },{status:201})
}
