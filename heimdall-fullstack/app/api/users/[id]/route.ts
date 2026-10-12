import {db} from '@/lib/db'
import {getMe,bad} from '@/lib/guard'
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params,me=await getMe();if(!me)return bad('Unauthorized',401)
 if(me.role!=='EXECUTIVE')return bad('Forbidden',403)
 if(id===me.id)return bad('You cannot change your own role',400)
 const {role}=await req.json();if(!['EMPLOYEE','MANAGER','HR','EXECUTIVE'].includes(role))return bad('Invalid role',400)
 return Response.json(await db.user.update({where:{id},data:{role}}))}
