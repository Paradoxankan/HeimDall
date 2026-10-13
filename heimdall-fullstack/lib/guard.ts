import {auth} from '@/auth'
import {db} from './db'
import {Role} from '@prisma/client'

export async function getMe(){
 const s=await auth()
 const id=(s?.user as any)?.id
 if(!id)return null
 return db.user.findUnique({
  where:{id},
  include:{
   membership:{
    include:{organization:true}
   }
  }
 })
}

export type MeWithMembership = NonNullable<Awaited<ReturnType<typeof getMe>>>

export function getActiveContext(me: MeWithMembership){
 if(me.membership){
  return {
   isPersonal:false,
   organization:me.membership.organization,
   organizationId:me.membership.organizationId,
   role:me.membership.role,
   membership:me.membership,
   company:me.membership.organization,
   companyId:me.membership.organizationId
  }
 }
 return {
  isPersonal:true,
  organization:null,
  organizationId:null,
  role:'EMPLOYEE' as Role,
  membership:null,
  company:null,
  companyId:null
 }
}

export const bad=(m:string,status:number)=>Response.json({error:m},{status})
