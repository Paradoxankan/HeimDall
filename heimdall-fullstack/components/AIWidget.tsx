'use client'
import {useState} from 'react'
import {useWs,days,fmt} from '@/lib/store'
import {Card} from './ui'
export default function AIWidget(){
 const {tasks,data}=useWs(); const [msgs,setMsgs]=useState<any[]>([]),[q,setQ]=useState(''),[busy,setBusy]=useState(false)
 const answer=(s:string)=>{s=s.toLowerCase();const open=tasks.filter((t:any)=>t.status!=='done')
  const list=(a:any[])=>a.map(t=>`${t.title} (${t.assignee}, ${fmt(t.due)})`).join('; ')
  if(/overdue|late/.test(s)){const a=open.filter((t:any)=>days(t.due)<0);return a.length?`Overdue: ${list(a)}.`:'Nothing is overdue right now.'}
  if(/block/.test(s)){const a=tasks.filter((t:any)=>t.status==='blocked');return a.length?`Blocked: ${a.map((t:any)=>`${t.title}. ${t.reason}`).join('; ')}.`:'No tasks are blocked.'}
  if(/project/.test(s))return data.projects.map((p:any)=>`${p.name} is ${p.status.toLowerCase()} at ${p.pct}%`).join('; ')+'.'
  if(/due|week|deadline/.test(s)){const a=open.filter((t:any)=>days(t.due)>=0&&days(t.due)<=7);return a.length?`Due in the next 7 days: ${list(a)}.`:'Nothing is due in the next 7 days.'}
  return 'I can answer from this workspace\'s tasks and projects. Try "what is overdue?", "what is blocked?" or "how are the projects doing?"'}
 const send=()=>{const s=q.trim();if(!s||busy)return;setMsgs(m=>[...m,{r:'u',t:s}]);setQ('');setBusy(true);setTimeout(()=>{setMsgs(m=>[...m,{r:'a',t:answer(s)}]);setBusy(false)},2000)}
 return <Card title="HeimDall AI"><div aria-live="polite" className="mb-3 max-h-56 space-y-2 overflow-y-auto">
  {!msgs.length&&!busy&&<p className="text-mute">Ask about tasks, deadlines or projects in your workspace.</p>}
  {msgs.map((m,i)=><p key={i} className={m.r==='u'?'ml-8 rounded-md bg-accent/10 px-3 py-2':'mr-8 rounded-md border border-line px-3 py-2'}>{m.t}</p>)}
  {busy&&<div className="mr-8 animate-pulse space-y-2 rounded-md border border-line px-3 py-3" aria-label="HeimDall AI is thinking"><div className="h-2.5 w-4/5 rounded bg-line"/><div className="h-2.5 w-3/5 rounded bg-line"/></div>}</div>
  <div className="flex gap-2"><input className="field min-w-0 flex-1" placeholder="Ask AI..." value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}/><button onClick={send} disabled={busy} className="rounded-md bg-accent px-3 font-medium text-white disabled:opacity-50 dark:text-[#07101f]">Ask</button></div></Card>}
