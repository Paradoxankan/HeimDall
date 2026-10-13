import {db} from '@/lib/db'
import {getMe,bad,getActiveContext} from '@/lib/guard'

const wideRole=(r:string)=>r==='MANAGER'||r==='EXECUTIVE'

export async function GET(){
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 const ctx=getActiveContext(me)
 const where=ctx.isPersonal
  ? {ownerId:me.id,organizationId:null}
  : wideRole(ctx.role)
  ? {organizationId:ctx.organizationId!}
  : {organizationId:ctx.organizationId!,OR:[{assigneeId:me.id},{ownerId:me.id}]}

 const t=await db.task.findMany({where,include:{project:true,assignee:true,owner:true},orderBy:{due:'asc'}})
 return Response.json(t.map(x=>({
  id:x.id,
  title:x.title,
  desc:x.desc,
  project:x.project?.name??'Personal',
  assignee:x.assignee?.name??x.owner?.name??'You',
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

 let projectId:string|null=null
 if(!ctx.isPersonal){
  if(b.projectId){
   const found=await db.project.findFirst({where:{id:String(b.projectId),organizationId:ctx.organizationId!}})
   if(!found)return bad('Project not found in this organization',400)
   projectId=found.id
  }else{
   let defProj=await db.project.findFirst({where:{organizationId:ctx.organizationId!}})
   if(!defProj){
    defProj=await db.project.create({
     data:{
      name:`${ctx.organization?.name||'General'} Tasks`,
      sub:'Team tasks and milestones',
      status:'On track',
      pct:0,
      team:1,
      lead:me.name||me.email||'Lead',
      milestone:'Active',
      deadline:new Date(Date.now()+30*864e5),
      organizationId:ctx.organizationId!
     }
    })
   }
   projectId=defProj.id
  }
 }

 const priority=['high','medium','low'].includes(b.priority)?b.priority:'medium'
 const canAssign=Boolean(!ctx.isPersonal&&wideRole(ctx.role))
 const assigneeId=canAssign&&b.assigneeId?String(b.assigneeId):(ctx.isPersonal?null:me.id)

 const t=await db.task.create({
  data:{
   title,
   desc:String(b.desc||'').slice(0,500),
   priority,
   due,
   projectId,
   ownerId:me.id,
   assigneeId,
   organizationId:ctx.organizationId
  }
 })

 if(!ctx.isPersonal&&ctx.organizationId){
  await db.activity.create({
   data:{
    who:me.name||me.email||'Someone',
    what:'created',
    target:title,
    userId:me.id,
    organizationId:ctx.organizationId
   }
  })
 }

 return Response.json(t,{status:201})
}
