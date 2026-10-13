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

 const member=await db.companyMember.findUnique({
  where:{companyId_userId:{companyId:ctx.companyId!,userId:id}}
 })
 if(!member)return bad('User is not a member of this company',404)

 const updated=await db.companyMember.update({
  where:{id:member.id},
  data:{role}
 })

 await db.user.update({where:{id},data:{role}})
 return Response.json(updated)
}
