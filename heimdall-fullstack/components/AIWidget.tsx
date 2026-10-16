'use client'
import {useState} from 'react'
import {useWs,days,fmt} from '@/lib/store'
import {Card} from './ui'

export default function AIWidget(){
 const {tasks,data}=useWs()
 const [msgs,setMsgs]=useState<any[]>([])
 const [q,setQ]=useState('')
 const [busy,setBusy]=useState(false)

 const contracts = data?.contracts || data?.exec?.contracts || []
 const obligations = contracts.flatMap((c:any)=>(c.obligations||[]).map((o:any)=>({...o,contractName:c.name,party:c.party})))

 const fallbackAnswer=(s:string)=>{
  s=s.toLowerCase()
  const open=(tasks||[]).filter((t:any)=>t.status!=='done')
  const list=(a:any[])=>a.map(t=>`${t.title} (${t.assignee}, ${fmt(t.due)})`).join('; ')

  // Contract specific questions
  if(/contract.*(obligation|due|month)|obligation.*due/.test(s)){
   const thisMonth = obligations.filter((o:any)=>o.due && days(o.due)>=0 && days(o.due)<=31)
   if(!thisMonth.length) return 'No contract obligations are due this month.'
   return `Obligations due this month: ${thisMonth.map((o:any)=>`"${o.text}" under ${o.contractName} (${fmt(o.due)})`).join('; ')}.`
  }

  if(/contract.*risk|risk.*contract|most risk/.test(s)){
   const highPri = obligations.filter((o:any)=>o.priority==='high')
   if(highPri.length){
    return `High-risk contract clauses: ${highPri.map((o:any)=>`"${o.text}" in ${o.contractName}`).join('; ')}.`
   }
   if(contracts.length){
    return `Active contracts: ${contracts.map((c:any)=>c.name).join(', ')}. No critical contractual risks are flagged.`
   }
   return 'No contracts are currently flagged with high risk.'
  }

  if(/what contract|list contract|summarize contract/.test(s)){
   if(!contracts.length) return 'There are no contracts recorded in this organization yet.'
   return `We have ${contracts.length} active contract${contracts.length>1?'s':''}: ${contracts.map((c:any)=>`${c.name}${c.party?` with ${c.party}`:''}`).join('; ')}.`
  }

  if(/obligation/.test(s)){
   if(!obligations.length) return 'No contract obligations are tracked yet.'
   return `Tracked obligations (${obligations.length}): ${obligations.slice(0,3).map((o:any)=>`"${o.text}" (${o.contractName})`).join('; ')}${obligations.length>3?` and ${obligations.length-3} more`:''}.`
  }

  // General task and project questions
  if(/overdue|late/.test(s)){
   const a=open.filter((t:any)=>days(t.due)<0)
   return a.length?`Overdue: ${list(a)}.`:'Nothing is overdue right now.'
  }
  if(/block/.test(s)){
   const a=(tasks||[]).filter((t:any)=>t.status==='blocked')
   return a.length?`Blocked: ${a.map((t:any)=>`${t.title}.${t.reason||''}`).join('; ')}.`:'No tasks are blocked.'
  }
  if(/project/.test(s)){
   const p = data?.projects || []
   return p.length?p.map((x:any)=>`${x.name} is ${x.status.toLowerCase()} at ${x.pct}%`).join('; ')+'.':'No active projects.'
  }
  if(/due|week|deadline/.test(s)){
   const a=open.filter((t:any)=>days(t.due)>=0&&days(t.due)<=7)
   return a.length?`Due in the next 7 days: ${list(a)}.`:'Nothing is due in the next 7 days.'
  }

  return 'I can answer about contracts, obligations, tasks, and projects in your workspace. Try "what contract obligations are due this month?", "which contract has the most risk?", or "what is overdue?"'
 }

 const send=async()=>{
  const s=q.trim()
  if(!s||busy)return
  setMsgs(m=>[...m,{r:'u',t:s}])
  setQ('')
  setBusy(true)

  try{
   const res = await fetch('/api/ai/chat',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({message:s})
   })
   const json = await res.json().catch(()=>null)
   if(json?.answer){
    setMsgs(m=>[...m,{r:'a',t:json.answer}])
    setBusy(false)
    return
   }
   if(json?.debugError){
    console.warn('HeimDall AI Debug:', json.debugError)
    setMsgs(m=>[...m,{r:'a',t:`[AI Config Warning: ${json.debugError}] — Fallback: ${fallbackAnswer(s)}`}])
    setBusy(false)
    return
   }
  }catch(err){
   console.error(err)
  }

  setTimeout(()=>{
   setMsgs(m=>[...m,{r:'a',t:fallbackAnswer(s)}])
   setBusy(false)
  },800)
 }

 return (
  <Card title="HeimDall AI">
   <div aria-live="polite" className="mb-3 max-h-56 space-y-2 overflow-y-auto">
    {!msgs.length&&!busy&&(
     <p className="text-mute text-xs">
      Ask about contracts, obligations, deadlines, or projects in your workspace.
     </p>
    )}
    {msgs.map((m,i)=>(
     <p key={i} className={m.r==='u'?'ml-8 rounded-md bg-accent/10 px-3 py-2 text-xs leading-relaxed':'mr-8 rounded-md border border-line px-3 py-2 text-xs leading-relaxed'}>
      {m.t}
     </p>
    ))}
    {busy&&(
     <div className="mr-8 animate-pulse space-y-2 rounded-md border border-line px-3 py-3" aria-label="HeimDall AI is thinking">
      <div className="h-2.5 w-4/5 rounded bg-line"/>
      <div className="h-2.5 w-3/5 rounded bg-line"/>
     </div>
    )}
   </div>
   <div className="flex gap-2">
    <input
     className="field min-w-0 flex-1 text-xs"
     placeholder="Ask about contracts or tasks..."
     value={q}
     onChange={e=>setQ(e.target.value)}
     onKeyDown={e=>e.key==='Enter'&&send()}
     aria-label="Ask HeimDall AI"
    />
    <button
     onClick={send}
     disabled={busy}
     className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 dark:text-[#07101f]"
    >
     Ask
    </button>
   </div>
  </Card>
 )
}