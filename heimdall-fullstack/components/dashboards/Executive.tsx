'use client'
import {useState} from 'react'
import {useWs,first,days,fmt,due,ago} from '@/lib/store'
import {Card,Chip,Empty,Stat,Bar,Head} from '../ui'
import AIWidget from '../AIWidget'
import {ST,PR,Th,Updates,Projects} from './shared'
import {InviteMemberForm} from './HR'

export function Executive(){
 const {tasks,data,me,workspace}=useWs()
 const e=data?.exec||{score:0,compliance:100,summary:[],risks:[],contracts:[],revenue:[]}
 const r=e.revenue||[]
 const tot=(m:any)=>m?(m.product||0)+(m.services||0)+(m.sales||0):0
 const last=r.length>0?tot(r[r.length-1]):0
 const prev=r.length>1?tot(r[r.length-2]):last
 const mx=r.length>0?Math.max(...r.map(tot),1):1
 const pctChange=prev>0?((last-prev)/prev*100).toFixed(1):'0'

 const od=(tasks||[]).filter((t:any)=>t.status!=='done'&&days(t.due)<0)
 const tone=e.score>=7?'bad':e.score>=4?'warn':'ok'

 return (
  <div className="fade">
   <Head
    title={`Good morning, ${first(me?.name)}`}
    sub={`${workspace?.activeCompany?.name||'Company'} overview as of ${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}.`}
   />

   <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
    <Stat label="Team members" value={(data?.people||[]).length}/>
    <Stat label="Active projects" value={(data?.projects||[]).length}/>
    <Stat label="Open tasks" value={(tasks||[]).filter((t:any)=>t.status!=='done').length}/>
    <Stat label="Compliance" value={`${e.compliance}%`}/>
   </div>

   <div className="grid gap-4 lg:grid-cols-3">
    <div className="space-y-4 lg:col-span-2">
     <Card title="Weekly company summary" action={<Chip tone="accent">AI generated</Chip>}>
      {e.summary?.length?(
       <ul className="list-disc space-y-2 pl-5">
        {e.summary.map((s:string)=><li key={s}>{s}</li>)}
       </ul>
      ):(
       <Empty title="No summary generated yet" hint="HeimDall AI will generate weekly company summaries as work and contracts progress."/>
      )}
     </Card>

     <Projects/>

     <Card
      title="Company tasks"
      action={(tasks||[]).length>0?<Chip tone="accent">{(tasks||[]).length} total</Chip>:undefined}
     >
      {(tasks||[]).length?(
       <div className="-m-4 overflow-x-auto">
        <table className="w-full">
         <thead>
          <tr className="border-b border-line">
           <Th c="Task"/><Th c="Assignee"/><Th c="Priority"/><Th c="Due"/><Th c="Status"/>
          </tr>
         </thead>
         <tbody>
          {(tasks||[]).slice(0,5).map((t:any)=>{
           const [d,tone]=due(t.due)
           return (
            <tr key={t.id} className="border-b border-line last:border-0">
             <td className="px-3 py-2.5 font-medium">{t.title}</td>
             <td className="px-3 text-xs text-mute">{t.assignee}</td>
             <td className="px-3"><Chip tone={PR[t.priority]}>{t.priority}</Chip></td>
             <td className="px-3"><Chip tone={tone as string}>{d}</Chip></td>
             <td className="px-3"><Chip tone={ST[t.status]?.[1]||'mute'}>{ST[t.status]?.[0]||t.status}</Chip></td>
            </tr>
           )
          })}
         </tbody>
        </table>
       </div>
      ):(
       <Empty
        title="No tasks yet"
        hint="No company tasks have been created. Switch to Manager or Employee view to add tasks, or assign them to team members."
       />
      )}
     </Card>

     <Card title="Risks that need action">
      {e.risks?.length?(
       <ul className="divide-y divide-line">
        {e.risks.map((k:any)=>(
         <li key={k.title} className="py-3 first:pt-0 last:pb-0">
          <div className="flex items-center gap-2">
           <Chip tone={k.tone}>{k.level}</Chip>
           <span className="font-medium">{k.title}</span>
          </div>
          <p className="mt-1">{k.detail}</p>
          <p className="text-xs text-mute">{k.dept}. Next step: {k.next}</p>
         </li>
        ))}
       </ul>
      ):(
       <Empty title="No open risks" hint="Risks flagged by your teams or contracts will be listed here."/>
      )}
     </Card>

     <div className="grid gap-4 md:grid-cols-2">
      <Card title="Overdue items">
       {od.length?(
        <ul className="space-y-2">
         {od.map((t:any)=>(
          <li key={t.id}>
           {t.title}
           <span className="block text-xs text-bad">{-days(t.due)} days overdue, {t.assignee}</span>
          </li>
         ))}
        </ul>
       ):(
        <Empty title="Nothing overdue" hint="Late tasks across the company will appear here."/>
       )}
      </Card>

      <Card title="Contract alerts">
       {(data?.contracts || e.contracts)?.length?(
        <ul className="space-y-3">
         {(data?.contracts || e.contracts).map((c:any)=>{
          const nearest = c.obligations?.find((o:any)=>!o.taskId && o.due) || c.obligations?.[0]
          const [dText, dTone] = c.due ? due(c.due.slice(0,10)) : ['No deadline','mute']
          return (
           <li key={c.id || c.name} className="border-b border-line pb-2.5 last:border-0 last:pb-0">
            <div className="flex items-start justify-between gap-2">
             <div>
              <p className="font-medium text-ink">{c.name}</p>
              {c.party&&<p className="text-xs text-mute">Party: {c.party}</p>}
             </div>
             <Chip tone={dTone as string}>{dText}</Chip>
            </div>
            {nearest?(
             <p className="mt-1 text-xs text-mute">
              <span className="font-medium text-ink/80">Next:</span> {nearest.text}
              {nearest.due&&` (${fmt(nearest.due.slice(0,10))})`}
             </p>
            ):(
             c.note&&<p className="mt-1 text-xs text-mute">{c.note}</p>
            )}
           </li>
          )
         })}
        </ul>
       ):(
        <Empty title="No contract alerts" hint="Renewals, payment milestones, and flagged clauses will appear here."/>
       )}
      </Card>
     </div>

     <Card
      title="Team members"
      action={
       <Chip tone="mute">
        {(data?.people||[]).length} {(data?.people||[]).length===1?'member':'members'}
       </Chip>
      }
     >
      {(data?.people||[]).length>1?(
       <div className="-m-4 overflow-x-auto">
        <table className="w-full">
         <thead>
          <tr className="border-b border-line">
           <Th c="Name"/><Th c="Role"/><Th c="Department"/><Th c="Access"/><Th c="Joined"/>
          </tr>
         </thead>
         <tbody>
          {(data?.people||[]).map((p:any)=>(
           <tr key={p.name} className="border-b border-line last:border-0">
            <td className="px-3 py-2.5 font-medium">{p.name}</td>
            <td className="px-3 text-xs text-mute">{p.role}</td>
            <td className="px-3 text-xs text-mute">{p.dept}</td>
            <td className="px-3"><Chip tone={p.access==='EXECUTIVE'?'accent':'mute'}>{p.access}</Chip></td>
            <td className="px-3 text-xs text-mute">{fmt(p.joined)}</td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      ):(
       <Empty
        title="No team members yet"
        hint="You are currently the only member in this company. Invite colleagues using the form below to collaborate."
       />
      )}
     </Card>

     <InviteMemberForm/>
    </div>

    <div className="space-y-4">
     <Card title="Overall risk score">
      <svg viewBox="0 0 200 115" className="mx-auto w-56" role="img" aria-label={`Risk score ${e.score} out of 10`}>
       <path d="M20 100A80 80 0 0 1 180 100" pathLength="100" fill="none" stroke="var(--line)" strokeWidth="14" strokeLinecap="round"/>
       <path d="M20 100A80 80 0 0 1 180 100" pathLength="100" fill="none" stroke={`var(--${tone})`} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${e.score*10} 100`}/>
       <text x="100" y="92" textAnchor="middle" fontSize="30" fontWeight="600" fill="var(--ink)">{e.score}/10</text>
      </svg>
      <p className="text-center text-mute">{e.score>=7?'High risk':e.score>=4?'Moderate risk':'Low risk'}</p>
     </Card>

     <div className="grid grid-cols-2 gap-4">
      <Stat label={`Revenue (${r[r.length-1]?.m||'Current'})`} value={`$${last}k`} note={r.length>1?`+${pctChange}% vs prior month`:undefined}/>
      <Stat label="Compliance" value={`${e.compliance}%`}/>
     </div>

     <Card title="Revenue by business unit">
      {r.length>0?(
       <>
        <div className="flex h-40 items-end gap-5">
         {r.map((m:any)=>(
          <div key={m.m} className="flex h-full flex-1 flex-col justify-end text-center">
           <div className="flex flex-col-reverse overflow-hidden rounded-t" style={{height:`${tot(m)/mx*85}%`}}>
            <div className="bg-accent" style={{flex:m.product||1}}/>
            <div className="bg-accent/60" style={{flex:m.services||1}}/>
            <div className="bg-accent/30" style={{flex:m.sales||1}}/>
           </div>
           <span className="mt-2 text-xs text-mute">{m.m}</span>
          </div>
         ))}
        </div>
        <p className="mt-3 flex gap-4 text-xs text-mute">
         <span><i className="mr-1 inline-block size-2 bg-accent"/>Product</span>
         <span><i className="mr-1 inline-block size-2 bg-accent/60"/>Services</span>
         <span><i className="mr-1 inline-block size-2 bg-accent/30"/>Sales</span>
        </p>
       </>
      ):(
       <Empty title="No revenue data" hint="Financial records recorded by your finance team will appear here."/>
      )}
     </Card>

     <Updates/>

     <AIWidget/>
    </div>
   </div>
  </div>
 )
}
