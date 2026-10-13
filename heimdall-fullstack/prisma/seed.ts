import {PrismaClient} from '@prisma/client'
import data from '../lib/data.json'
const db=new PrismaClient(),base=Date.parse('2026-10-06'),now=Date.now()
const shift=(d:string)=>new Date(now+(Date.parse(d)-base))
// EDIT: use each person's real GitHub/Google primary email so their login links to this profile.
const EMAIL:any={Ankan:'paradoxankan123@gmail.com',Sumit:'sumit@example.com',Debashis:'debashis@example.com',Swapnil:'swapnil@example.com',Anamitra:'anamitra@example.com'}
const ROLE:any={Ankan:'EXECUTIVE',Sumit:'MANAGER',Debashis:'HR',Swapnil:'EMPLOYEE',Anamitra:'EMPLOYEE'}

async function main(){
 for(const m of [db.invitation,db.companyMember,db.task,db.activity,db.leaveRequest,db.risk,db.contract,db.revenue,db.project])await (m as any).deleteMany()
 const company=await db.company.upsert({where:{slug:'heimdall'},update:{name:'HeimDall Technologies'},create:{name:'HeimDall Technologies',slug:'heimdall'}})
 const u:any={},p:any={}
 for(const x of data.people){
  const f={name:x.name,role:ROLE[x.name],title:x.role,dept:x.dept,city:x.city,activeCompanyId:company.id}
  u[x.name]=await db.user.upsert({where:{email:EMAIL[x.name]},update:f,create:{...f,email:EMAIL[x.name],joinedAt:new Date(x.joined)}})
  await db.companyMember.upsert({
   where:{companyId_userId:{companyId:company.id,userId:u[x.name].id}},
   update:{role:ROLE[x.name],title:x.role,dept:x.dept},
   create:{companyId:company.id,userId:u[x.name].id,role:ROLE[x.name],title:x.role,dept:x.dept,joinedAt:new Date(x.joined)}
  })
 }
 for(const x of data.projects)p[x.name]=await db.project.create({data:{name:x.name,sub:x.sub,status:x.status,pct:x.pct,team:x.team,lead:x.lead,milestone:x.milestone,deadline:shift(x.deadline),companyId:company.id}})
 for(const t of data.tasks)await db.task.create({data:{title:t.title,desc:t.desc,priority:t.priority,due:shift(t.due),status:t.status.toUpperCase() as any,progress:t.progress,reason:(t as any).reason,projectId:p[t.project].id,assigneeId:u[t.assignee].id,companyId:company.id}})
 for(const a of data.activity)await db.activity.create({data:{who:a.who,what:a.what,target:a.target,at:new Date(now-a.min*60000),userId:u[a.who]?.id,companyId:company.id}})
 for(const l of data.leave)await db.leaveRequest.create({data:{userId:u[l.name].id,type:l.type,from:shift(l.from),to:shift(l.to),companyId:company.id}})
 for(const r of data.exec.risks)await db.risk.create({data:{level:r.level,title:r.title,detail:r.detail,dept:r.dept,next:r.next,companyId:company.id}})
 for(const c of data.exec.contracts)await db.contract.create({data:{name:c.name,due:shift(c.due),note:c.note,companyId:company.id}})
 for(const [i,r] of data.exec.revenue.entries())await db.revenue.create({data:{month:r.m,product:r.product,services:r.services,sales:r.sales,order:i,companyId:company.id}})
}
main().then(()=>db.$disconnect()).catch(e=>{console.error(e);process.exit(1)})
