import {db} from '@/lib/db'
import {getMe,bad,getActiveContext} from '@/lib/guard'

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params,me=await getMe();if(!me)return bad('Unauthorized',401)
 const ctx=getActiveContext(me)
 const l=await db.leaveRequest.findUnique({where:{id}})
 if(!l)return bad('Leave request not found',404)

 const isAuthorized=!ctx.isPersonal&&
  (ctx.role==='HR'||ctx.role==='EXECUTIVE')&&
  (!l.companyId||l.companyId===ctx.companyId)

 if(!isAuthorized)return bad('Forbidden: Only HR and Executives can approve leave',403)

 const b=await req.json().catch(()=>null)
 if(!b||!['APPROVED','DECLINED'].includes(b.decision))return bad('Invalid decision',400)

 return Response.json(await db.leaveRequest.update({where:{id},data:{status:b.decision}}))
}

export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params,me=await getMe();if(!me)return bad('Unauthorized',401)
 const l=await db.leaveRequest.findUnique({where:{id}})
 if(!l||l.userId!==me.id)return bad('Leave request not found',404)
 if(l.status!=='PENDING')return bad('Only pending requests can be cancelled',409)

 await db.leaveRequest.delete({where:{id}})
 return Response.json({ok:true})
}
