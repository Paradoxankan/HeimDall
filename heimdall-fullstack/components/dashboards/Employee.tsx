'use client'
import {useState} from 'react'
import {useWs,first,days,fmt,due,ago} from '@/lib/store'
import {Card,Chip,Empty,Stat,Bar,Head} from '../ui'
import AIWidget from '../AIWidget'
import {ST,PR,Th,Updates,Projects} from './shared'
import {NewTask,MyLeave} from './EmployeeForms'
export function Employee(){
 const {tasks,setStatus,deleteTask,busy,me}=useWs();const mine=tasks.filter((t:any)=>t.assigneeId===me.id)
 const pending=mine.filter((t:any)=>t.status!=='done').sort((a:any,b:any)=>a.due.localeCompare(b.due));const ongoing=mine.filter((t:any)=>t.status==='progress')
 const soon=pending.filter((t:any)=>days(t.due)<=7).length
 return <div className="fade"><Head title={`Good morning, ${first(me.name)}`} sub={soon?`${soon} of your tasks are due within a week.`:'You have nothing due in the next week.'}/>
 <div className="grid gap-4 lg:grid-cols-3"><div className="space-y-4 lg:col-span-2">
  <Card title="Pending tasks">{pending.length?<div className="-m-4 overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-line"><Th c="Task"/><Th c="Priority"/><Th c="Due"/><Th c="Status"/></tr></thead><tbody>{pending.map((t:any)=>{const [d,tone]=due(t.due);return <tr key={t.id} className="border-b border-line last:border-0"><td className="px-3 py-2.5"><p className="font-medium">{t.title}</p><p className="text-xs text-mute">{t.project}{t.reason&&` · ${t.reason}`}</p></td><td className="px-3"><Chip tone={PR[t.priority]}>{t.priority}</Chip></td><td className="px-3"><Chip tone={tone as string}>{d}</Chip></td><td className="px-3"><select aria-label={`Status of ${t.title}`} className="field py-1" disabled={!!busy[t.id]} value={t.status} onChange={e=>setStatus(t.id,e.target.value)}>{Object.keys(ST).map(k=><option key={k} value={k}>{ST[k][0]}</option>)}</select><button onClick={()=>deleteTask(t.id)} disabled={!!busy[t.id]} className="ml-2 text-xs text-mute hover:text-bad" aria-label={`Delete ${t.title}`}>Delete</button></td></tr>})}</tbody></table></div>:<Empty title="You're all caught up" hint="Completed tasks are cleared from this list. New assignments will appear here."/>}</Card>
  <Card title="Ongoing tasks">{ongoing.length?<ul className="space-y-4">{ongoing.map((t:any)=><li key={t.id}><div className="mb-1.5 flex justify-between gap-3"><span className="font-medium">{t.title} <span className="font-normal text-mute">{t.project}</span></span><span className="text-mute">{t.progress}%</span></div><p className="mb-1.5 text-xs text-mute">{t.desc}</p><Bar pct={t.progress}/></li>)}</ul>:<Empty title="Nothing in progress" hint="Set a task to In progress and it will show up here with its progress."/>}</Card><NewTask/></div>
 <div className="space-y-4"><Updates/><MyLeave/><Projects/><AIWidget/></div></div></div>}

