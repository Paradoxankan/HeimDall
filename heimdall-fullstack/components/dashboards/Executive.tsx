'use client'
import {useState} from 'react'
import {useWs,first,days,fmt,due,ago} from '@/lib/store'
import {Card,Chip,Empty,Stat,Bar,Head} from '../ui'
import AIWidget from '../AIWidget'
import {ST,PR,Th,Updates,Projects} from './shared'
export function Executive(){
 const {tasks,data,me}=useWs();const e=data.exec,r=e.revenue,tot=(m:any)=>m.product+m.services+m.sales,last=tot(r[2]),prev=tot(r[1]),mx=Math.max(...r.map(tot))
 const od=tasks.filter((t:any)=>t.status!=='done'&&days(t.due)<0);const tone=e.score>=7?'bad':e.score>=4?'warn':'ok'
 return <div className="fade"><Head title={`Good morning, ${first(me.name)}`} sub={`Company overview as of ${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}.`}/>
 <div className="grid gap-4 lg:grid-cols-3"><div className="space-y-4 lg:col-span-2">
  <Card title="Weekly company summary" action={<Chip tone="accent">AI generated</Chip>}><ul className="list-disc space-y-2 pl-5">{e.summary.map((s:string)=><li key={s}>{s}</li>)}</ul></Card>
  <Card title="Risks that need action">{e.risks.length?<ul className="divide-y divide-line">{e.risks.map((k:any)=><li key={k.title} className="py-3 first:pt-0 last:pb-0"><div className="flex items-center gap-2"><Chip tone={k.tone}>{k.level}</Chip><span className="font-medium">{k.title}</span></div><p className="mt-1">{k.detail}</p><p className="text-xs text-mute">{k.dept}. Next step: {k.next}</p></li>)}</ul>:<Empty title="No open risks" hint="Risks flagged by your teams or contracts will be listed here."/>}</Card>
  <div className="grid gap-4 md:grid-cols-2">
   <Card title="Overdue items">{od.length?<ul className="space-y-2">{od.map((t:any)=><li key={t.id}>{t.title}<span className="block text-xs text-bad">{-days(t.due)} days overdue, {t.assignee}</span></li>)}</ul>:<Empty title="Nothing overdue" hint="Late tasks across the company will appear here."/>}</Card>
   <Card title="Contract alerts">{e.contracts.length?<ul className="space-y-2">{e.contracts.map((c:any)=><li key={c.name}><p className="font-medium">{c.name}</p><p className="text-xs text-mute">{c.note}. Due in {days(c.due)} days.</p></li>)}</ul>:<Empty title="No contract alerts" hint="Renewals and flagged clauses will appear here."/>}</Card></div></div>
 <div className="space-y-4">
  <Card title="Overall risk score"><svg viewBox="0 0 200 115" className="mx-auto w-56" role="img" aria-label={`Risk score ${e.score} out of 10`}><path d="M20 100A80 80 0 0 1 180 100" pathLength="100" fill="none" stroke="var(--line)" strokeWidth="14" strokeLinecap="round"/><path d="M20 100A80 80 0 0 1 180 100" pathLength="100" fill="none" stroke={`var(--${tone})`} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${e.score*10} 100`}/><text x="100" y="92" textAnchor="middle" fontSize="30" fontWeight="600" fill="var(--ink)">{e.score}/10</text></svg><p className="text-center text-mute">Moderate risk</p></Card>
  <div className="grid grid-cols-2 gap-4"><Stat label="Revenue (Sep)" value={`$${last}k`} note={`+${((last-prev)/prev*100).toFixed(1)}% vs Aug`}/><Stat label="Compliance" value={`${e.compliance}%`}/></div>
  <Card title="Revenue by business unit"><div className="flex h-40 items-end gap-5">{r.map((m:any)=><div key={m.m} className="flex h-full flex-1 flex-col justify-end text-center"><div className="flex flex-col-reverse overflow-hidden rounded-t" style={{height:`${tot(m)/mx*85}%`}}><div className="bg-accent" style={{flex:m.product}}/><div className="bg-accent/60" style={{flex:m.services}}/><div className="bg-accent/30" style={{flex:m.sales}}/></div><span className="mt-2 text-xs text-mute">{m.m}</span></div>)}</div>
  <p className="mt-3 flex gap-4 text-xs text-mute"><span><i className="mr-1 inline-block size-2 bg-accent"/>Product</span><span><i className="mr-1 inline-block size-2 bg-accent/60"/>Services</span><span><i className="mr-1 inline-block size-2 bg-accent/30"/>Sales</span></p></Card>
  <AIWidget/></div></div></div>}
