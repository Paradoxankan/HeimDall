'use client'
import {useState} from 'react'
import {useWs,first,days,fmt,due,ago} from '@/lib/store'
import {Card,Chip,Empty,Stat,Bar,Head} from '../ui'
import AIWidget from '../AIWidget'
import {ST,PR,Th,Updates,Projects} from './shared'
import {UserPlus} from 'lucide-react'

export function InviteMemberForm(){
 const {inviteMember,busy}=useWs()
 const [f,setF]=useState({email:'',role:'EMPLOYEE'})
 const [err,setErr]=useState<any>({})
 const [sent,setSent]=useState(false)

 const submit=async()=>{
  const e:any={}
  if(!f.email.trim()||!f.email.includes('@'))e.email='Enter a valid email address.'
  setErr(e)
  if(Object.keys(e).length)return

  const r=await inviteMember(f)
  if(r.error){
   setErr({form:r.error})
  }else{
   setF({email:'',role:'EMPLOYEE'})
   setErr({})
   setSent(true)
   setTimeout(()=>setSent(false),4000)
  }
 }

 return (
  <Card title="Invite team member" action={<Chip tone="accent">Role assignment</Chip>}>
   <div className="grid gap-3 sm:grid-cols-3">
    <label className="sm:col-span-2">
     Email address
     <input
      type="email"
      placeholder="colleague@example.com"
      className="field mt-1 w-full"
      value={f.email}
      onChange={e=>setF({...f,email:e.target.value})}
     />
     {err.email&&<p className="mt-1 text-xs text-bad">{err.email}</p>}
    </label>
    <label>
     Role
     <select
      className="field mt-1 w-full"
      value={f.role}
      onChange={e=>setF({...f,role:e.target.value})}
     >
      <option value="EMPLOYEE">Employee</option>
      <option value="MANAGER">Manager</option>
      <option value="HR">HR</option>
      <option value="EXECUTIVE">Executive</option>
     </select>
    </label>
   </div>
   {err.form&&<p className="mt-2 text-xs text-bad">{err.form}</p>}
   {sent&&<p className="mt-2 text-xs text-ok">Invitation sent successfully! They can accept upon sign in.</p>}
   <button
    onClick={submit}
    disabled={!!busy['invite-member']}
    className="mt-3 flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:text-[#07101f]"
   >
    <UserPlus size={15}/>
    {busy['invite-member']?'Sending invite...':'Send invite'}
   </button>
  </Card>
 )
}

export function HR(){
 const {data,me,decideLeave,workspace}=useWs()
 const [q,setQ]=useState('')
 const [dept,setDept]=useState('All')
 const leave:any[]=data?.leave||[]

 const depts=['All',...Array.from(new Set((data?.people||[]).map((p:any)=>p.dept)))] as string[]
 const rows=(data?.people||[]).filter((p:any)=>(dept==='All'||p.dept===dept)&&p.name.toLowerCase().includes(q.trim().toLowerCase()))

 return (
  <div className="fade">
   <Head
    title={`Good morning, ${first(me?.name)}`}
    sub={workspace?.isPersonal?'Personal Workspace':`${workspace?.activeCompany?.name} · ${leave.length} leave ${leave.length===1?'request needs':'requests need'} a decision.`}
   />

   <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
    <Stat label="Headcount" value={data?.people?.length||0}/>
    <Stat label="On leave today" value={(data?.people||[]).filter((p:any)=>p.status==='On leave').length}/>
    <Stat label="Pending requests" value={leave.length}/>
    <Stat label="Joining soon" value={data?.joiners?.length||0} note="Next 2 weeks"/>
   </div>

   <div className="grid gap-4 lg:grid-cols-3">
    <div className="space-y-4 lg:col-span-2">
     <Card
      title="Employee directory"
      action={
       <div className="flex gap-2">
        <input
         className="field w-40"
         placeholder="Search name..."
         value={q}
         onChange={e=>setQ(e.target.value)}
         aria-label="Search employees"
        />
        <select
         className="field"
         value={dept}
         onChange={e=>setDept(e.target.value)}
         aria-label="Department"
        >
         {depts.map(d=><option key={d}>{d}</option>)}
        </select>
       </div>
      }
     >
      {rows.length?(
       <div className="-m-4 overflow-x-auto">
        <table className="w-full">
         <thead>
          <tr className="border-b border-line">
           <Th c="Name"/><Th c="Department"/><Th c="Location"/><Th c="Joined"/><Th c="Status"/>
          </tr>
         </thead>
         <tbody>
          {rows.map((p:any)=>(
           <tr key={p.name} className="border-b border-line last:border-0">
            <td className="px-3 py-2.5">
             <p className="font-medium">{p.name}</p>
             <p className="text-xs text-mute">{p.role}</p>
            </td>
            <td className="px-3">{p.dept}</td>
            <td className="px-3">{p.city}</td>
            <td className="px-3">{fmt(p.joined)} {p.joined.slice(0,4)}</td>
            <td className="px-3">
             <Chip tone={p.status==='Active'?'ok':'warn'}>{p.status}</Chip>
            </td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      ):(
       <Empty dashed title="No employees found." hint="Try adjusting your search query or inviting new members."/>
      )}
     </Card>

     <InviteMemberForm/>
    </div>

    <div className="space-y-4">
     <Card title="Leave requests">
      {leave.length?(
       <ul className="space-y-3">
        {leave.map((l:any)=>(
         <li key={l.id}>
          <p className="font-medium">{l.name} <span className="font-normal text-mute">{l.type}</span></p>
          <p className="text-xs text-mute">{fmt(l.from)} to {fmt(l.to)}</p>
          <div className="mt-1.5 flex gap-2">
           <button onClick={()=>decideLeave(l.id,'APPROVED')} className="rounded bg-accent px-2.5 py-1 text-xs font-medium text-white dark:text-[#07101f]">
            Approve
           </button>
           <button onClick={()=>decideLeave(l.id,'DECLINED')} className="rounded border border-line px-2.5 py-1 text-xs">
            Decline
           </button>
          </div>
         </li>
        ))}
       </ul>
      ):(
       <Empty title="No pending requests" hint="New leave requests will appear here for approval."/>
      )}
     </Card>

     <Card title="Joining soon">
      {data?.joiners?.length?(
       <ul className="space-y-2">
        {data.joiners.map((j:any)=>(
         <li key={j.name} className="flex justify-between">
          <span>{j.name} <span className="text-mute">{j.role}</span></span>
          <span className="text-mute">{fmt(j.start)}</span>
         </li>
        ))}
       </ul>
      ):(
       <Empty title="No new joiners" hint="Upcoming start dates will be listed here."/>
      )}
     </Card>

     <AIWidget/>
    </div>
   </div>
  </div>
 )
}
