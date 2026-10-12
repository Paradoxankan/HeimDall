import {db} from '@/lib/db'
import {getMe,bad} from '@/lib/guard'
export async function GET(){
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 return Response.json(await db.leaveRequest.findMany({where:{userId:me.id},orderBy:{from:'asc'}}))}
export async function POST(req:Request){
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 const b=await req.json().catch(()=>null);if(!b)return bad('Invalid JSON body',400)
 if(!['Annual leave','Casual leave','Sick leave'].includes(b.type))return bad('Invalid leave type',400)
 const from=new Date(b.from),to=new Date(b.to);if(isNaN(+from)||isNaN(+to))return bad('Valid from and to dates are required',400)
 if(to<from)return bad('End date must be on or after the start date',400)
 return Response.json(await db.leaveRequest.create({data:{userId:me.id,type:b.type,from,to}}),{status:201})}
