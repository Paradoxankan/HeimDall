'use client'
import {useState} from 'react'
import {useWs,first,days,fmt,due,ago} from '@/lib/store'
import {Card,Chip,Empty,Stat,Bar,Head} from '../ui'
import AIWidget from '../AIWidget'
import {ST,PR,Th,Updates,Projects} from './shared'

export function Manager(){
 const {tasks,data,me,workspace}=useWs()
 const [win,setWin]=useState(7)

 const projects=data?.projects||[]
 const people=data?.people||[]
 const taskList=tasks||[]

 const counts=Object.keys(ST).map(k=>({k,n:taskList.filter((t:any)=>t.status===k).length}))
 const max=Math.max(...counts.map(c=>c.n),1)
 const crit=taskList.filter((t:any)=>t.status!=='done'&&days(t.due)<=win).sort((a:any,b:any)=>a.due.localeCompare(b.due))
 const team=people.filter((p:any)=>p.access==='EMPLOYEE').map((p:any)=>({
  n:p.name,
  r:p.role,
  a:taskList.filter((t:any)=>t.assignee===p.name&&t.status!=='done').length
 }))

 return (
  <div className="fade">
   <Head
    title={`Good morning, ${first(me?.name)}`}
    sub={`${workspace?.activeCompany?.name||'Workspace'} · ${taskList.filter((t:any)=>t.status!=='done').length} open tasks across ${projects.length} projects.`}
   />

   <div className="grid gap-4 lg:grid-cols-3">
    <div className="space-y-4 lg:col-span-2">
     <Card title="Workload by status">
      <div className="flex h-44 items-end gap-6 px-2">
       {counts.map(c=>(
        <div key={c.k} className="flex h-full flex-1 flex-col justify-end text-center">
         <span className="mb-1 font-semibold">{c.n}</span>
         <div
          className="rounded-t"
          style={{height:`${c.n/max*80}%`,minHeight:c.n?4:2,background:`var(--${ST[c.k][1]})`,transition:'height .4s ease'}}
         />
         <span className="mt-2 text-xs text-mute">{ST[c.k][0]}</span>
        </div>
       ))}
      </div>
     </Card>

     <Card title="Active projects">
      {projects.length?(
       <div className="-m-4 overflow-x-auto">
        <table className="w-full">
         <thead>
          <tr className="border-b border-line">
           <Th c="Project"/><Th c="Progress"/><Th c="Status"/><Th c="Lead"/><Th c="Deadline"/>
          </tr>
         </thead>
         <tbody>
          {projects.map((p:any)=>(
           <tr key={p.name} className="border-b border-line last:border-0">
            <td className="px-3 py-2.5 font-medium">{p.name}</td>
            <td className="w-40 px-3"><Bar pct={p.pct} tone={p.tone}/></td>
            <td className="px-3"><Chip tone={p.tone}>{p.status}</Chip></td>
            <td className="px-3">{p.lead}</td>
            <td className="px-3">{fmt(p.deadline)}</td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      ):(
       <Empty title="No active projects" hint="Team projects will be tracked here."/>
      )}
     </Card>

     <Updates/>
    </div>

    <div className="space-y-4">
     <Card
      title="Critical deadlines"
      action={
       <div className="flex gap-1">
        {[[7,'This week'],[31,'This month']].map(([w,l]:any)=>(
         <button
          key={w}
          onClick={()=>setWin(w)}
          className={`rounded px-2 py-1 text-xs ${win===w?'bg-accent text-white dark:text-[#07101f]':'text-mute hover:text-ink'}`}
         >
          {l}
         </button>
        ))}
       </div>
      }
     >
      {crit.length?(
       <ul className="space-y-3">
        {crit.map((t:any)=>{
         const [d,tone]=due(t.due)
         return (
          <li key={t.id} className="flex justify-between gap-3">
           <span>{t.title}<span className="block text-xs text-mute">{t.assignee}, {t.project}</span></span>
           <Chip tone={tone as string}>{d}</Chip>
          </li>
         )
        })}
       </ul>
      ):(
       <Empty title="Nothing due" hint={`No open tasks are due ${win===7?'this week':'this month'}.`}/>
      )}
     </Card>

     <Card title="Your team">
      {team.length?(
       <table className="w-full">
        <thead>
         <tr><Th c="Employee"/><Th c="Open tasks"/></tr>
        </thead>
        <tbody>
         {team.map(m=>(
          <tr key={m.n} className="border-t border-line">
           <td className="px-3 py-2">
            <p className="font-medium">{m.n}</p>
            <p className="text-xs text-mute">{m.r}</p>
           </td>
           <td className="px-3">{m.a}</td>
          </tr>
         ))}
        </tbody>
       </table>
      ):(
       <Empty title="No team members assigned" hint="Employees assigned to your department will appear here."/>
      )}
     </Card>

     <AIWidget/>
    </div>
   </div>
  </div>
 )
}
