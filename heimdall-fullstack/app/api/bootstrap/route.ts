import {db} from '@/lib/db'
import {getMe,bad} from '@/lib/guard'
export const dynamic='force-dynamic'
const iso=(d:Date)=>d.toISOString().slice(0,10)
const TONE:any={'On track':'ok',Delayed:'warn',Planning:'accent'}
export async function GET(){
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 const R=me.role,wide=R==='MANAGER'||R==='EXECUTIVE',hr=R==='HR'||R==='EXECUTIVE'
 const [tasks,projects,act]=await Promise.all([db.task.findMany({where:wide?{}:{assigneeId:me.id},include:{project:true,assignee:true},orderBy:{due:'asc'}}),db.project.findMany(),db.activity.findMany({where:R==='EMPLOYEE'?{userId:me.id}:{},orderBy:{at:'desc'},take:6})])
 const data:any={
  tasks:tasks.map(t=>({id:t.id,title:t.title,desc:t.desc,project:t.project.name,assignee:t.assignee?.name??'Unassigned',assigneeId:t.assigneeId,priority:t.priority,due:iso(t.due),status:t.status.toLowerCase(),progress:t.progress,reason:t.reason})),
  projects:projects.map(p=>({id:p.id,name:p.name,sub:p.sub,status:p.status,tone:TONE[p.status]||'mute',pct:p.pct,lead:p.lead,team:p.team,milestone:p.milestone,deadline:iso(p.deadline)})),
  activity:act.map(a=>({who:a.who,what:a.what,target:a.target,min:Math.max(1,Math.round((Date.now()-a.at.getTime())/60000))})),people:[],joiners:[],leave:[]}
 data.myLeave=(await db.leaveRequest.findMany({where:{userId:me.id},orderBy:{from:'asc'}})).map(x=>({id:x.id,type:x.type,from:iso(x.from),to:iso(x.to),status:x.status}))
 if(R!=='EMPLOYEE'){const us=await db.user.findMany({orderBy:{name:'asc'}})
  data.people=us.map(u=>({name:u.name,role:u.title||'Team member',dept:u.dept||'General',city:u.city||'-',joined:iso(u.joinedAt),status:u.onLeave?'On leave':'Active',access:u.role}))
  data.joiners=us.filter(u=>u.joinedAt>new Date()).map(u=>({name:u.name,role:u.title,start:iso(u.joinedAt)}))}
 if(hr){const l=await db.leaveRequest.findMany({where:{status:'PENDING'},include:{user:true},orderBy:{from:'asc'}});data.leave=l.map(x=>({id:x.id,name:x.user.name,type:x.type,from:iso(x.from),to:iso(x.to)}))}
 if(R==='EXECUTIVE'){
  const [risks,contracts,rev]=await Promise.all([db.risk.findMany(),db.contract.findMany({orderBy:{due:'asc'}}),db.revenue.findMany({orderBy:{order:'asc'}})])
  const W:any={Critical:3,Medium:2,Low:1},T:any={Critical:'bad',Medium:'warn',Low:'ok'}
  const open=tasks.filter(t=>t.status!=='DONE'),late=open.filter(t=>t.due<new Date()),blocked=tasks.filter(t=>t.status==='BLOCKED').length
  const delayed=projects.filter(p=>p.status==='Delayed').map(p=>p.name),soon=contracts.filter(c=>c.due.getTime()-Date.now()<7*864e5).length
  data.exec={score:Math.min(10,risks.reduce((n,r)=>n+(W[r.level]||0),0)),compliance:open.length?Math.round(100-late.length/open.length*100):100,
   summary:[delayed.length?`${delayed.join(', ')} ${delayed.length>1?'are':'is'} behind schedule.`:'All projects are on schedule.',blocked?`${blocked} task${blocked>1?'s are':' is'} blocked.`:'No tasks are blocked.',soon?`${soon} contract${soon>1?'s are':' is'} due within a week.`:'No contracts are due this week.'],
   risks:risks.map(r=>({level:r.level,tone:T[r.level],title:r.title,detail:r.detail,dept:r.dept,next:r.next})),
   contracts:contracts.map(c=>({name:c.name,due:iso(c.due),note:c.note})),revenue:rev.map(r=>({m:r.month,product:r.product,services:r.services,sales:r.sales}))}}
 return Response.json({me:{id:me.id,name:me.name||me.email,email:me.email,role:me.role},data})}
