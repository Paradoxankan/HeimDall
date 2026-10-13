import {db} from '@/lib/db'
import {getMe,bad,getActiveContext} from '@/lib/guard'

export async function GET(){
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 const ctx=getActiveContext(me)
 const where=ctx.isPersonal?{userId:me.id}:{userId:me.id,companyId:ctx.companyId}
 return Response.json(await db.leaveRequest.findMany({where,orderBy:{from:'asc'}}))
}

export async function POST(req:Request){
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 const ctx=getActiveContext(me)
 if(ctx.isPersonal||!ctx.companyId)return bad('Please select a company workspace to submit leave requests',400)

 const b=await req.json().catch(()=>null);if(!b)return bad('Invalid JSON body',400)
 if(!['Annual leave','Casual leave','Sick leave'].includes(b.type))return bad('Invalid leave type',400)
 const from=new Date(b.from),to=new Date(b.to);if(isNaN(+from)||isNaN(+to))return bad('Valid from and to dates are required',400)
 if(to<from)return bad('End date must be on or after the start date',400)

 return Response.json(
  await db.leaveRequest.create({
   data:{
    userId:me.id,
    companyId:ctx.companyId,
    type:b.type,
    from,
    to
   }
  }),
  {status:201}
 )
}
