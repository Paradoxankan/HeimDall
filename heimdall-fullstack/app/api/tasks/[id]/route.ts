import {db} from '@/lib/db'
import {getContext,bad,can} from '@/lib/guard'

const OK=['TODO','PROGRESS','BLOCKED','DONE']

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params,ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 const b=await req.json().catch(()=>null);if(!b)return bad('Invalid JSON body',400)
 const t=await db.task.findUnique({where:{id}});if(!t)return bad('Task not found',404)

 const isOwn=t.ownerId===ctx.user.id||t.assigneeId===ctx.user.id
 const isPersonal=!t.organizationId

 if(isPersonal){
  if(t.ownerId!==ctx.user.id)return bad('Forbidden',403)
 }else{
  if(t.organizationId!==ctx.membership?.organizationId)return bad('Forbidden',403)
  if(!can(ctx.membership?.role,'task.update',isOwn))return bad('Forbidden',403)
 }

 const d:any={}
 if(b.status!==undefined){if(!OK.includes(b.status))return bad('Invalid status',400);d.status=b.status;if(b.status==='DONE')d.progress=100}
 if(b.title!==undefined){const s=String(b.title).trim();if(s.length<3||s.length>120)return bad('Title must be 3 to 120 characters',400);d.title=s}
 if(b.desc!==undefined)d.desc=String(b.desc).slice(0,500)
 if(b.priority!==undefined){if(!['high','medium','low'].includes(b.priority))return bad('Invalid priority',400);d.priority=b.priority}
 if(b.due!==undefined){const x=new Date(b.due);if(isNaN(+x))return bad('Invalid due date',400);d.due=x}
 if(b.progress!==undefined){const n=Number(b.progress);if(!Number.isInteger(n)||n<0||n>100)return bad('Progress must be 0 to 100',400);d.progress=n}
 if(!Object.keys(d).length)return bad('Nothing to update',400)

 const u=await db.task.update({where:{id},data:d})
 if(d.status&&t.organizationId){
  await db.activity.create({
   data:{
    who:ctx.user.name||ctx.user.email||'Someone',
    what:`marked as ${d.status.toLowerCase()}`,
    target:t.title,
    userId:ctx.user.id,
    organizationId:t.organizationId
   }
  })
 }
 return Response.json(u)
}

export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params,ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 const t=await db.task.findUnique({where:{id}});if(!t)return bad('Task not found',404)

 const isOwn=t.ownerId===ctx.user.id||t.assigneeId===ctx.user.id
 const isPersonal=!t.organizationId

 if(isPersonal){
  if(t.ownerId!==ctx.user.id)return bad('Forbidden',403)
 }else{
  if(t.organizationId!==ctx.membership?.organizationId)return bad('Forbidden',403)
  if(!can(ctx.membership?.role,'task.delete',isOwn))return bad('Forbidden',403)
 }

 await db.task.delete({where:{id}});return Response.json({ok:true})
}
