import {db} from '@/lib/db'
import {getContext,bad} from '@/lib/guard'

export const dynamic='force-dynamic'

const iso=(d:Date)=>d.toISOString().slice(0,10)
const TONE:any={'On track':'ok',Delayed:'warn',Planning:'accent'}

export async function GET(){
 const ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 const {user,membership,org}=ctx
 const isPersonal=!membership
 const R=isPersonal?'EMPLOYEE':membership.role
 const orgId=membership?.organizationId
 const wide=R==='MANAGER'||R==='EXECUTIVE'
 const hr=R==='HR'||R==='EXECUTIVE'

 const tasksWhere:any=isPersonal
  ? {ownerId:user.id,organizationId:null}
  : wide ? {organizationId:orgId!} : {organizationId:orgId!,OR:[{assigneeId:user.id},{ownerId:user.id}]}

 const projectsWhere:any=isPersonal
  ? {organizationId:'__none__'}
  : {organizationId:orgId!}

 const actWhere:any=isPersonal
  ? {userId:user.id}
  : R==='EMPLOYEE' ? {organizationId:orgId!,userId:user.id} : {organizationId:orgId!}

 const [tasks,projects,act]=await Promise.all([
  db.task.findMany({where:tasksWhere,include:{project:true,assignee:true,owner:true},orderBy:{due:'asc'}}),
  db.project.findMany({where:projectsWhere}),
  db.activity.findMany({where:actWhere,orderBy:{at:'desc'},take:6})
 ])

 const data:any={
  tasks:tasks.map(t=>({
   id:t.id,
   title:t.title,
   desc:t.desc,
   project:t.project?.name??'Personal',
   assignee:t.assignee?.name??t.owner?.name??'You',
   assigneeId:t.assigneeId,
   priority:t.priority,
   due:iso(t.due),
   status:t.status.toLowerCase(),
   progress:t.progress,
   reason:t.reason
  })),
  projects:projects.map(p=>({
   id:p.id,
   name:p.name,
   sub:p.sub,
   status:p.status,
   tone:TONE[p.status]||'mute',
   pct:p.pct,
   lead:p.lead,
   team:p.team,
   milestone:p.milestone,
   deadline:iso(p.deadline)
  })),
  activity:act.map(a=>({
   who:a.who,
   what:a.what,
   target:a.target,
   min:Math.max(1,Math.round((Date.now()-a.at.getTime())/60000))
  })),
  people:[],
  joiners:[],
  leave:[]
 }

 const leaveWhere:any=isPersonal ? {userId:user.id} : {userId:user.id,organizationId:orgId!}
 data.myLeave=(await db.leaveRequest.findMany({where:leaveWhere,orderBy:{from:'asc'}})).map(x=>({
  id:x.id,
  type:x.type,
  from:iso(x.from),
  to:iso(x.to),
  status:x.status
 }))

 if(!isPersonal&&R!=='EMPLOYEE'){
  const members=await db.membership.findMany({
   where:{organizationId:orgId!},
   include:{user:true},
   orderBy:{user:{name:'asc'}}
  })
  data.people=members.map(m=>({
   name:m.user.name||m.user.email,
   role:m.user.title||'Team member',
   dept:'General',
   city:m.user.city||'-',
   joined:iso(m.createdAt),
   status:'Active',
   access:m.role
  }))
  data.joiners=members.filter(m=>m.createdAt>new Date(Date.now()-14*864e5)).map(m=>({
   name:m.user.name||m.user.email,
   role:m.user.title,
   start:iso(m.createdAt)
  }))
 } else if(isPersonal){
  data.people=[{
   name:user.name||user.email,
   role:user.title||'Individual',
   dept:'Personal',
   city:user.city||'-',
   joined:iso(user.joinedAt),
   status:'Active',
   access:'EMPLOYEE'
  }]
 }

 if(!isPersonal&&hr){
  const l=await db.leaveRequest.findMany({
   where:{status:'PENDING',organizationId:orgId!},
   include:{user:true},
   orderBy:{from:'asc'}
  })
  data.leave=l.map(x=>({
   id:x.id,
   name:x.user.name||x.user.email,
   type:x.type,
   from:iso(x.from),
   to:iso(x.to)
  }))
 }

 if(!isPersonal&&R==='EXECUTIVE'){
  const [risks,contracts,rev]=await Promise.all([
   db.risk.findMany({where:{organizationId:orgId!}}),
   db.contract.findMany({where:{organizationId:orgId!},orderBy:{due:'asc'}}),
   db.revenue.findMany({where:{organizationId:orgId!},orderBy:{order:'asc'}})
  ])
  const W:any={Critical:3,Medium:2,Low:1},T:any={Critical:'bad',Medium:'warn',Low:'ok'}
  const open=tasks.filter(t=>t.status!=='DONE'),late=open.filter(t=>t.due<new Date()),blocked=tasks.filter(t=>t.status==='BLOCKED').length
  const delayed=projects.filter(p=>p.status==='Delayed').map(p=>p.name),soon=contracts.filter(c=>c.due.getTime()-Date.now()<7*864e5).length
  data.exec={
   score:Math.min(10,risks.reduce((n,r)=>n+(W[r.level]||0),0)),
   compliance:open.length?Math.round(100-late.length/open.length*100):100,
   summary:[
    delayed.length?`${delayed.join(', ')} ${delayed.length>1?'are':'is'} behind schedule.`:'All projects are on schedule.',
    blocked?`${blocked} task${blocked>1?'s are':' is'} blocked.`:'No tasks are blocked.',
    soon?`${soon} contract${soon>1?'s are':' is'} due within a week.`:'No contracts are due this week.'
   ],
   risks:risks.map(r=>({level:r.level,tone:T[r.level],title:r.title,detail:r.detail,dept:r.dept,next:r.next})),
   contracts:contracts.map(c=>({name:c.name,due:iso(c.due),note:c.note})),
   revenue:rev.map(r=>({m:r.month,product:r.product,services:r.services,sales:r.sales}))
  }
 }

 const pendingInvites=user.email
  ? await db.invitation.findMany({
      where:{email:user.email.toLowerCase(),status:'PENDING'},
      include:{organization:true,invitedBy:{select:{name:true,email:true}}},
      orderBy:{createdAt:'desc'}
    })
  : []

 return Response.json({
  me:{
   id:user.id,
   name:user.name||user.email,
   email:user.email,
   role:R
  },
  workspace:{
   isPersonal,
   activeCompany:org?{id:org.id,name:org.name,slug:org.slug}:null,
   companies:org?[{
    id:org.id,
    name:org.name,
    slug:org.slug,
    role:R,
    title:user.title
   }]:[],
   invitations:pendingInvites.map(i=>({
    id:i.id,
    token:i.token,
    companyName:i.organization.name,
    companySlug:i.organization.slug,
    role:i.role,
    invitedBy:i.invitedBy?.name||i.invitedBy?.email||'Team lead',
    expiresAt:i.expiresAt
   }))
  },
  data
 })
}
