import {db} from '@/lib/db'
import {getContext,bad} from '@/lib/guard'

export const dynamic='force-dynamic'

const iso=(d:Date)=>d.toISOString().slice(0,10)

export async function GET(){
 const ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 const tasks=await db.task.findMany({
  where:{ownerId:ctx.user.id,organizationId:null},
  orderBy:{due:'asc'}
 })

 return Response.json(tasks.map(t=>({
  id:t.id,
  title:t.title,
  desc:t.desc,
  priority:t.priority,
  due:iso(t.due),
  status:t.status.toLowerCase(),
  progress:t.progress
 })))
}

export async function POST(req:Request){
 const ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 const b=await req.json().catch(()=>null);if(!b)return bad('Invalid JSON body',400)

 const title=String(b.title||'').trim()
 if(title.length<3||title.length>120)return bad('Title must be between 3 and 120 characters',400)

 const due=new Date(b.due)
 if(isNaN(+due))return bad('A valid due date is required',400)

 const priority=['high','medium','low'].includes(b.priority)?b.priority:'medium'
 const desc=b.desc?String(b.desc).slice(0,500):''

 const task=await db.task.create({
  data:{
   title,
   desc,
   priority,
   due,
   ownerId:ctx.user.id,
   organizationId:null
  }
 })

 return Response.json({
  id:task.id,
  title:task.title,
  desc:task.desc,
  priority:task.priority,
  due:iso(task.due),
  status:task.status.toLowerCase(),
  progress:task.progress
 },{status:201})
}

