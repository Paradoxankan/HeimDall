import {db} from '@/lib/db'
import {getContext,bad,can} from '@/lib/guard'

export async function GET(){
 const ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 const isPersonal=!ctx.membership
 const orgId=ctx.membership?.organizationId
 const role=ctx.membership?.role

 const where=isPersonal
  ? {ownerId:ctx.user.id,organizationId:null}
  : role==='MANAGER'||role==='EXECUTIVE'
  ? {organizationId:orgId!}
  : {organizationId:orgId!,OR:[{assigneeId:ctx.user.id},{ownerId:ctx.user.id}]}

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
 const ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 const b=await req.json().catch(()=>null);if(!b)return bad('Invalid JSON body',400)

 const title=String(b.title||'').trim()
 if(title.length<3||title.length>120)return bad('Title must be 3 to 120 characters',400)

 const due=new Date(b.due)
 if(isNaN(+due))return bad('A valid due date is required',400)

 const isPersonal=!ctx.membership
 const orgId=ctx.membership?.organizationId

 let projectId:string|null=null
 if(!isPersonal&&orgId){
  if(b.projectId){
   const found=await db.project.findFirst({where:{id:String(b.projectId),organizationId:orgId}})
   if(!found)return bad('Project not found in this organization',400)
   projectId=found.id
  }else{
   let defProj=await db.project.findFirst({where:{organizationId:orgId}})
   if(!defProj){
    defProj=await db.project.create({
     data:{
      name:`${ctx.org?.name||'General'} Tasks`,
      sub:'Team tasks and milestones',
      status:'On track',
      pct:0,
      team:1,
      lead:ctx.user.name||ctx.user.email||'Lead',
      milestone:'Active',
      deadline:new Date(Date.now()+30*864e5),
      organizationId:orgId
     }
    })
   }
   projectId=defProj.id
  }
 }

 const priority=['high','medium','low'].includes(b.priority)?b.priority:'medium'
 const targetAssigneeId=b.assigneeId?String(b.assigneeId):ctx.user.id
 const isOwn=targetAssigneeId===ctx.user.id

 if(!isPersonal&&!can(ctx.membership?.role,'task.create',isOwn)){
  return bad('Forbidden: Only Managers and Executives can assign tasks to other members',403)
 }

 const assigneeId=isPersonal?null:targetAssigneeId

 const t=await db.task.create({
  data:{
   title,
   desc:String(b.desc||'').slice(0,500),
   priority,
   due,
   projectId,
   ownerId:ctx.user.id,
   assigneeId,
   organizationId:isPersonal?null:orgId
  }
 })

 if(!isPersonal&&orgId){
  await db.activity.create({
   data:{
    who:ctx.user.name||ctx.user.email||'Someone',
    what:'created',
    target:title,
    userId:ctx.user.id,
    organizationId:orgId
   }
  })
 }

 return Response.json(t,{status:201})
}
