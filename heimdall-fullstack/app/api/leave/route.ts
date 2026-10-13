import {db} from '@/lib/db'
import {getContext,bad} from '@/lib/guard'

export async function GET(){
 const ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 const isPersonal=!ctx.membership
 const orgId=ctx.membership?.organizationId
 const where=isPersonal?{userId:ctx.user.id}:{userId:ctx.user.id,organizationId:orgId!}
 return Response.json(await db.leaveRequest.findMany({where,orderBy:{from:'asc'}}))
}

export async function POST(req:Request){
 const ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 if(!ctx.membership||!ctx.org)return bad('Please select an organization workspace to submit leave requests',400)
 const orgId=ctx.membership.organizationId

 const b=await req.json().catch(()=>null);if(!b)return bad('Invalid JSON body',400)
 if(!['Annual leave','Casual leave','Sick leave'].includes(b.type))return bad('Invalid leave type',400)
 const from=new Date(b.from),to=new Date(b.to);if(isNaN(+from)||isNaN(+to))return bad('Valid from and to dates are required',400)
 if(to<from)return bad('End date must be on or after the start date',400)

 return Response.json(
  await db.leaveRequest.create({
   data:{
    userId:ctx.user.id,
    organizationId:orgId,
    type:b.type,
    from,
    to
   }
  }),
  {status:201}
 )
}
