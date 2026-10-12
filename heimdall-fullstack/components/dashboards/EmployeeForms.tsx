'use client'
import {useState} from 'react'
import {useWs,fmt} from '@/lib/store'
import {Card,Chip,Empty} from '../ui'
const Err=({m}:{m?:string})=>m?<p role="alert" className="mt-1 text-xs text-bad">{m}</p>:null
export function NewTask(){
 const {data,createTask,busy}=useWs();const [f,setF]=useState({title:'',projectId:data.projects[0]?.id||'',priority:'medium',due:''}),[e,setE]=useState<any>({})
 const submit=async()=>{const x:any={};if(f.title.trim().length<3)x.title='Enter at least 3 characters.';if(!f.due)x.due='Pick a due date.';if(!f.projectId)x.projectId='Choose a project.';setE(x);if(Object.keys(x).length)return;const r=await createTask(f);if(r.error)setE({form:r.error});else setF({...f,title:'',due:''})}
 return <Card title="Add a task"><div className="grid gap-3 sm:grid-cols-2">
  <label className="sm:col-span-2">Title<input className="field mt-1 w-full" value={f.title} onChange={x=>setF({...f,title:x.target.value})} maxLength={120}/><Err m={e.title}/></label>
  <label>Project<select className="field mt-1 w-full" value={f.projectId} onChange={x=>setF({...f,projectId:x.target.value})}>{data.projects.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select><Err m={e.projectId}/></label>
  <label>Due date<input type="date" className="field mt-1 w-full" value={f.due} onChange={x=>setF({...f,due:x.target.value})}/><Err m={e.due}/></label>
  <label>Priority<select className="field mt-1 w-full" value={f.priority} onChange={x=>setF({...f,priority:x.target.value})}>{['high','medium','low'].map(p=><option key={p}>{p}</option>)}</select></label>
  <div className="flex items-end"><button onClick={submit} disabled={busy['new-task']} className="rounded-md bg-accent px-4 py-2 font-medium text-white disabled:opacity-60 dark:text-[#07101f]">{busy['new-task']?'Saving...':'Add task'}</button></div></div><Err m={e.form}/></Card>}
export function MyLeave(){
 const {data,requestLeave,cancelLeave,busy}=useWs();const [f,setF]=useState({type:'Annual leave',from:'',to:''}),[e,setE]=useState<any>({})
 const submit=async()=>{const x:any={};if(!f.from)x.from='Pick a start date.';if(!f.to)x.to='Pick an end date.';if(f.from&&f.to&&f.to<f.from)x.to='End date must be on or after the start.';setE(x);if(Object.keys(x).length)return;const r=await requestLeave(f);if(r.error)setE({form:r.error});else setF({...f,from:'',to:''})}
 const tone:any={PENDING:'warn',APPROVED:'ok',DECLINED:'bad'}
 return <Card title="My leave">{data.myLeave.length?<ul className="mb-4 space-y-2">{data.myLeave.map((l:any)=><li key={l.id} className="flex items-center justify-between gap-2"><span>{l.type}<span className="block text-xs text-mute">{fmt(l.from)} to {fmt(l.to)}</span></span><span className="flex items-center gap-2"><Chip tone={tone[l.status]}>{l.status.toLowerCase()}</Chip>{l.status==='PENDING'&&<button disabled={busy[l.id]} onClick={()=>cancelLeave(l.id)} className="text-xs text-mute hover:text-bad">Cancel</button>}</span></li>)}</ul>:<div className="mb-3"><Empty title="No leave requests" hint="Requests you submit will be listed here with their status."/></div>}
  <div className="grid grid-cols-2 gap-3"><label className="col-span-2">Type<select className="field mt-1 w-full" value={f.type} onChange={x=>setF({...f,type:x.target.value})}>{['Annual leave','Casual leave','Sick leave'].map(t=><option key={t}>{t}</option>)}</select></label>
  <label>From<input type="date" className="field mt-1 w-full" value={f.from} onChange={x=>setF({...f,from:x.target.value})}/><Err m={e.from}/></label><label>To<input type="date" className="field mt-1 w-full" value={f.to} onChange={x=>setF({...f,to:x.target.value})}/><Err m={e.to}/></label></div>
  <button onClick={submit} disabled={busy['new-leave']} className="mt-3 rounded-md bg-accent px-4 py-2 font-medium text-white disabled:opacity-60 dark:text-[#07101f]">{busy['new-leave']?'Sending...':'Request leave'}</button><Err m={e.form}/></Card>}
