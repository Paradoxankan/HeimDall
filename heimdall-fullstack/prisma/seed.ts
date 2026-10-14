import {PrismaClient} from '@prisma/client'

const db=new PrismaClient()

async function main(){
 for(const m of [
  db.activity,
  db.leaveRequest,
  db.task,
  db.project,
  db.risk,
  (db as any).obligation,
  db.contract,
  db.revenue,
  db.invitation,
  db.membership,
  db.organization
 ]){
  await (m as any).deleteMany()
 }

 let owner=await db.user.findFirst()
 if(!owner){
  owner=await db.user.create({
   data:{
    name:'HeimDall Admin',
    email:'admin@heimdall.internal',
    title:'Founder & Executive',
    city:'San Francisco'
   }
  })
 }

 const org=await db.organization.create({
  data:{
   name:'HeimDall Technologies',
   slug:'heimdall',
   createdById:owner.id,
   plan:'STARTER'
  }
 })

 await db.membership.create({
  data:{
   userId:owner.id,
   organizationId:org.id,
   role:'EXECUTIVE'
  }
 })

 const project=await db.project.create({
  data:{
   name:'Platform Core',
   sub:'Digital headquarters & workspace infrastructure',
   status:'On track',
   pct:45,
   team:4,
   lead:owner.name||'Executive Lead',
   milestone:'v1.0 Release',
   deadline:new Date(Date.now()+30*864e5),
   organizationId:org.id
  }
 })

 await db.task.create({
  data:{
   title:'Review organization onboarding flows',
   desc:'Ensure seamless onboarding for personal accounts joining organizations.',
   priority:'high',
   due:new Date(Date.now()+3*864e5),
   status:'PROGRESS',
   progress:60,
   organizationId:org.id,
   ownerId:owner.id,
   assigneeId:owner.id,
   projectId:project.id
  }
 })

 // Personal task (organizationId = null) for owner's personal workspace
 await db.task.create({
  data:{
   title:'Update personal profile headline and credentials',
   desc:'Personal workspace task not shared with any organization.',
   priority:'medium',
   due:new Date(Date.now()+7*864e5),
   status:'TODO',
   progress:0,
   organizationId:null,
   ownerId:owner.id
  }
 })

 await db.activity.create({
  data:{
   who:owner.name||'Admin',
   what:'created organization',
   target:org.name,
   userId:owner.id,
   organizationId:org.id
  }
 })

 await db.risk.create({
  data:{
   level:'Medium',
   title:'Multi-region data latency',
   detail:'Neon Postgres connection pooling across regions',
   dept:'Engineering',
   next:'Configure read replicas and edge caching',
   organizationId:org.id
  }
 })

 await db.contract.create({
  data:{
   name:'Cloud Infrastructure Agreement',
   party:'CloudHost Inc.',
   summary:'Annual cloud hosting and infrastructure services agreement with 99.95% uptime SLA, quarterly billing, and SOC2 compliance obligations.',
   due:new Date(Date.now()+14*864e5),
   note:'Annual renewal for core cloud hosting',
   organizationId:org.id,
   obligations:{
    create:[
     {
      text:'Pay Q4 cloud infrastructure invoice ($12,500)',
      owner:'us',
      kind:'payment',
      due:new Date(Date.now()+14*864e5),
      priority:'high'
     },
     {
      text:'Provide annual SOC2 Type II compliance audit report',
      owner:'counterparty',
      kind:'compliance',
      due:new Date(Date.now()+30*864e5),
      priority:'medium'
     },
     {
      text:'Deliver quarterly 99.95% uptime SLA performance review',
      owner:'counterparty',
      kind:'deliverable',
      due:new Date(Date.now()+45*864e5),
      priority:'low'
     },
     {
      text:'Submit 60-day renewal notice or cancellation for year 2',
      owner:'both',
      kind:'renewal',
      due:new Date(Date.now()+60*864e5),
      priority:'high'
     }
    ]
   }
  }
 })

 const months=['Jul','Aug','Sep']
 for(const [i,m] of months.entries()){
  await db.revenue.create({
   data:{
    month:m,
    product:45+i*10,
    services:15+i*5,
    sales:10+i*2,
    order:i,
    organizationId:org.id
   }
  })
 }

 console.log(`Demo seed completed successfully for organization: ${org.name} (${org.slug})`)
}

main()
 .then(()=>db.$disconnect())
 .catch(e=>{
  console.error(e)
  process.exit(1)
 })
