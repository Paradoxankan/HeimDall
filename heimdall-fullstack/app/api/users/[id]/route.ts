import {db} from '@/lib/db'
import {getMe,bad,getActiveContext} from '@/lib/guard'
import {Role} from '@prisma/client'

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params,me=await getMe();if(!me)return bad('Unauthorized',401)
 const ctx=getActiveContext(me)

 if(ctx.isPersonal||ctx.role!=='EXECUTIVE')return bad('Forbidden: Only Executives can modify member roles',403)
 if(id===me.id)return bad('You cannot change your own role',400)

 const b=await req.json().catch(()=>null)
 const role=b?.role as Role
 if(!['EMPLOYEE','MANAGER','HR','EXECUTIVE'].includes(role))return bad('Invalid role',400)

 const member=await db.membership.findUnique({
  where:{userId:id}
 })
 if(!member||member.organizationId!==ctx.organizationId)return bad('User is not a member of this organization',404)

 const updated=await db.membership.update({
  where:{id:member.id},
  data:{role}
 })

 return Response.json(updated)
}
