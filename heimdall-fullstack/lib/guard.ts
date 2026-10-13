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
   memberships:{
    include:{company:true},
    orderBy:{joinedAt:'asc'}
   }
  }
 })
}

export type MeWithMemberships = NonNullable<Awaited<ReturnType<typeof getMe>>>

export function getActiveContext(me: MeWithMemberships){
 if(me.activeCompanyId){
  const mem=me.memberships.find(m=>m.companyId===me.activeCompanyId)
  if(mem){
   return {
    isPersonal:false,
    company:mem.company,
    companyId:mem.companyId,
    role:mem.role,
    membership:mem
   }
  }
 }
 return {
  isPersonal:true,
  company:null,
  companyId:null,
  role:(me.role||'EMPLOYEE') as Role,
  membership:null
 }
}

export const bad=(m:string,status:number)=>Response.json({error:m},{status})
