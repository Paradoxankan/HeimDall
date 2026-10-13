import {db} from '@/lib/db'
import {getContext,bad} from '@/lib/guard'

const OK=['TODO','PROGRESS','BLOCKED','DONE']
const iso=(d:Date)=>d.toISOString().slice(0,10)

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params,ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 const task=await db.task.findUnique({where:{id}})
 if(!task||task.ownerId!==ctx.user.id||task.organizationId!==null){
  return bad('Task not found',404)
 }

 const b=await req.json().catch(()=>null);if(!b)return bad('Invalid JSON body',400)
 const d:any={}

 if(b.status!==undefined){
  const st=String(b.status).toUpperCase()
  if(!OK.includes(st))return bad('Invalid status',400)
  d.status=st
  if(st==='DONE')d.progress=100
 }

 if(b.title!==undefined){
  const s=String(b.title).trim()
  if(s.length<3||s.length>120)return bad('Title must be between 3 and 120 characters',400)
  d.title=s
 }

 if(b.desc!==undefined)d.desc=String(b.desc).slice(0,500)
 if(b.priority!==undefined){
  if(!['high','medium','low'].includes(b.priority))return bad('Invalid priority',400)
  d.priority=b.priority
 }

 if(b.due!==undefined){
  const x=new Date(b.due)
  if(isNaN(+x))return bad('Invalid due date',400)
  d.due=x
 }

 if(b.progress!==undefined){
  const n=Number(b.progress)
  if(!Number.isInteger(n)||n<0||n>100)return bad('Progress must be 0 to 100',400)
  d.progress=n
 }

 if(!Object.keys(d).length)return bad('Nothing to update',400)

 const u=await db.task.update({where:{id},data:d})
 return Response.json({
  id:u.id,
  title:u.title,
  desc:u.desc,
  priority:u.priority,
  due:iso(u.due),
  status:u.status.toLowerCase(),
  progress:u.progress
 })
}

export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params,ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 const task=await db.task.findUnique({where:{id}})
 if(!task||task.ownerId!==ctx.user.id||task.organizationId!==null){
  return bad('Task not found',404)
 }

 await db.task.delete({where:{id}})
 return Response.json({ok:true})
}

