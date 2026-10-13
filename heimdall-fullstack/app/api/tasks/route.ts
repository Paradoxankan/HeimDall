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

 let projectId=b.projectId?String(b.projectId):null
 if(!projectId){
  const defaultProjName=ctx.isPersonal?'Personal Workspace':`${ctx.company?.name||'General'} Tasks`
  let proj=await db.project.findFirst({
   where:ctx.isPersonal
    ? {name:defaultProjName,companyId:null}
    : {name:defaultProjName,companyId:ctx.companyId}
  })
  if(!proj){
   proj=await db.project.create({
    data:{
     name:defaultProjName,
     sub:ctx.isPersonal?'Personal tasks and milestones':'General team workspace',
     status:'On track',
     pct:0,
     team:1,
     lead:me.name||me.email||'You',
     milestone:'Active',
     deadline:new Date(Date.now()+30*864e5),
     companyId:ctx.companyId
    }
   })
  }
  projectId=proj.id
 }else{
  const found=await db.project.findUnique({where:{id:projectId}})
  if(!found)return bad('Project not found',400)
 }

 const priority=['high','medium','low'].includes(b.priority)?b.priority:'medium'
 const canAssign=Boolean(!ctx.isPersonal&&wideRole(ctx.role))
 const assigneeId=canAssign&&b.assigneeId?String(b.assigneeId):me.id

 const t=await db.task.create({
  data:{
   title,
   desc:String(b.desc||'').slice(0,500),
   priority,
   due,
   projectId,
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
