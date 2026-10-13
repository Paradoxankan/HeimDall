import {db} from '@/lib/db'
import {getMe,bad,getActiveContext} from '@/lib/guard'

export const dynamic='force-dynamic'

const iso=(d:Date)=>d.toISOString().slice(0,10)
const TONE:any={'On track':'ok',Delayed:'warn',Planning:'accent'}

export async function GET(){
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 const ctx=getActiveContext(me)
 const R=ctx.isPersonal?'EMPLOYEE':ctx.role
 const wide=R==='MANAGER'||R==='EXECUTIVE'
 const hr=R==='HR'||R==='EXECUTIVE'

 const tasksWhere:any=ctx.isPersonal
  ? {assigneeId:me.id}
  : wide ? {companyId:ctx.companyId} : {companyId:ctx.companyId,assigneeId:me.id}

 const projectsWhere:any=ctx.isPersonal
  ? {OR:[{companyId:null},{tasks:{some:{assigneeId:me.id}}}]}
  : {companyId:ctx.companyId}

 const actWhere:any=ctx.isPersonal
  ? {userId:me.id}
  : R==='EMPLOYEE' ? {companyId:ctx.companyId,userId:me.id} : {companyId:ctx.companyId}

 const [tasks,projects,act]=await Promise.all([
  db.task.findMany({where:tasksWhere,include:{project:true,assignee:true},orderBy:{due:'asc'}}),
  db.project.findMany({where:projectsWhere}),
  db.activity.findMany({where:actWhere,orderBy:{at:'desc'},take:6})
 ])

 const data:any={
  tasks:tasks.map(t=>({
   id:t.id,
   title:t.title,
   desc:t.desc,
   project:t.project?.name??'Personal',
   assignee:t.assignee?.name??'Unassigned',
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

 const leaveWhere:any=ctx.isPersonal ? {userId:me.id} : {userId:me.id,companyId:ctx.companyId}
 data.myLeave=(await db.leaveRequest.findMany({where:leaveWhere,orderBy:{from:'asc'}})).map(x=>({
  id:x.id,
  type:x.type,
  from:iso(x.from),
  to:iso(x.to),
  status:x.status
 }))

 if(!ctx.isPersonal&&R!=='EMPLOYEE'){
  const members=await db.companyMember.findMany({
   where:{companyId:ctx.companyId!},
   include:{user:true},
   orderBy:{user:{name:'asc'}}
  })
  data.people=members.map(m=>({
   name:m.user.name||m.user.email,
   role:m.title||m.user.title||'Team member',
   dept:m.dept||m.user.dept||'General',
   city:m.user.city||'-',
   joined:iso(m.joinedAt),
   status:m.user.onLeave?'On leave':'Active',
   access:m.role
  }))
  data.joiners=members.filter(m=>m.joinedAt>new Date()).map(m=>({
   name:m.user.name||m.user.email,
   role:m.title||m.user.title,
   start:iso(m.joinedAt)
  }))
 } else if(ctx.isPersonal){
  data.people=[{
   name:me.name||me.email,
   role:me.title||'Individual',
   dept:'Personal',
   city:me.city||'-',
   joined:iso(me.joinedAt),
   status:'Active',
   access:'EMPLOYEE'
  }]
 }

 if(!ctx.isPersonal&&hr){
  const l=await db.leaveRequest.findMany({
   where:{status:'PENDING',companyId:ctx.companyId!},
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

 if(!ctx.isPersonal&&R==='EXECUTIVE'){
  const [risks,contracts,rev]=await Promise.all([
   db.risk.findMany({where:{companyId:ctx.companyId!}}),
   db.contract.findMany({where:{companyId:ctx.companyId!},orderBy:{due:'asc'}}),
   db.revenue.findMany({where:{companyId:ctx.companyId!},orderBy:{order:'asc'}})
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

 const pendingInvites=me.email
  ? await db.invitation.findMany({
      where:{email:me.email,status:'PENDING'},
      include:{company:true,invitedBy:{select:{name:true,email:true}}},
      orderBy:{createdAt:'desc'}
    })
  : []

 return Response.json({
  me:{
   id:me.id,
   name:me.name||me.email,
   email:me.email,
   role:R
  },
  workspace:{
   isPersonal:ctx.isPersonal,
   activeCompany:ctx.company?{id:ctx.company.id,name:ctx.company.name,slug:ctx.company.slug}:null,
   companies:me.memberships.map(m=>({
    id:m.company.id,
    name:m.company.name,
    slug:m.company.slug,
    role:m.role,
    title:m.title
   })),
   invitations:pendingInvites.map(i=>({
    id:i.id,
    token:i.token,
    companyName:i.company.name,
    companySlug:i.company.slug,
    role:i.role,
    invitedBy:i.invitedBy?.name||i.invitedBy?.email||'Team lead',
    expiresAt:i.expiresAt
   }))
  },
  data
 })
}
