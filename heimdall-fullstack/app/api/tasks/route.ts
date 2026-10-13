import {db} from '@/lib/db'
import {getMe,bad,getActiveContext} from '@/lib/guard'

const wideRole=(r:string)=>r==='MANAGER'||r==='EXECUTIVE'

export async function GET(){
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 const ctx=getActiveContext(me)
 const where=ctx.isPersonal
  ? {assigneeId:me.id}
  : wideRole(ctx.role)?{companyId:ctx.companyId}:{companyId:ctx.companyId,assigneeId:me.id}

 const t=await db.task.findMany({where,include:{project:true,assignee:true},orderBy:{due:'asc'}})
 return Response.json(t.map(x=>({
  id:x.id,
  title:x.title,
  desc:x.desc,
  project:x.project?.name??'Personal',
  assignee:x.assignee?.name??null,
  priority:x.priority,
  due:x.due,
  status:x.status,
  progress:x.progress
 })))
}

export async function POST(req:Request){
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 const ctx=getActiveContext(me)
 const b=await req.json().catch(()=>null);if(!b)return bad('Invalid JSON body',400)

 const title=String(b.title||'').trim()
 if(title.length<3||title.length>120)return bad('Title must be 3 to 120 characters',400)

 const due=new Date(b.due)
 if(isNaN(+due))return bad('A valid due date is required',400)

 if(!await db.project.findUnique({where:{id:String(b.projectId)}}))return bad('Project not found',400)

 const priority=['high','medium','low'].includes(b.priority)?b.priority:'medium'
 const canAssign=Boolean(!ctx.isPersonal&&wideRole(ctx.role))
 const assigneeId=canAssign&&b.assigneeId?String(b.assigneeId):me.id

 const t=await db.task.create({
  data:{
   title,
   desc:String(b.desc||'').slice(0,500),
   priority,
   due,
   projectId:String(b.projectId),
   assigneeId,
   companyId:ctx.companyId
  }
 })

 await db.activity.create({
  data:{
   who:me.name||me.email||'Someone',
   what:'created',
   target:title,
   userId:me.id,
   companyId:ctx.companyId
  }
 })

 return Response.json(t,{status:201})
}
