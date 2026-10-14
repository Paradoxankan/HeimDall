'use client'
import {useState,useEffect,useCallback} from 'react'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import {signOut} from 'next-auth/react'
import {
 Building,
 User,
 Check,
 X,
 Mail,
 MapPin,
 Calendar,
 Pencil,
 Plus,
 Trash2,
 LogOut,
 Sun,
 Moon,
 Sparkles,
 ArrowRight,
 Bot
} from 'lucide-react'
import {useWs,due,fmt,ROLES} from '@/lib/store'
import {Card,Chip,Empty} from '@/components/ui'

const PR_TONE:any={high:'warn',medium:'accent',low:'mute'}
const ST_LABELS:any={todo:'To do',progress:'In progress',blocked:'Blocked',done:'Completed'}

export default function HomePage(){
 const {theme,toggleTheme,reload}=useWs()
 const router=useRouter()

 const [loading,setLoading]=useState(true)
 const [userData,setUserData]=useState<any>(null)
 const [tasks,setTasks]=useState<any[]>([])
 const [invitations,setInvitations]=useState<any[]>([])
 const [membership,setMembership]=useState<any>(null)
 const [memberships,setMemberships]=useState<any[]>([])
 const [isSwitching,setIsSwitching]=useState(false)

 // Profile edit state
 const [isEditingProfile,setIsEditingProfile]=useState(false)
 const [profileForm,setProfileForm]=useState({name:'',title:'',city:''})
 const [profileErr,setProfileErr]=useState<any>({})
 const [isSavingProfile,setIsSavingProfile]=useState(false)

 // New Task state
 const [newTaskForm,setNewTaskForm]=useState({title:'',priority:'medium',due:''})
 const [taskErr,setTaskErr]=useState<any>({})
 const [isAddingTask,setIsAddingTask]=useState(false)
 const [taskBusy,setTaskBusy]=useState<Record<string,boolean>>({})

 // Create Company state
 const [createCoForm,setCreateCoForm]=useState({name:'',slug:''})
 const [createCoErr,setCreateCoErr]=useState<any>({})
 const [isCreatingCo,setIsCreatingCo]=useState(false)

 // Invitation action loading state
 const [invBusy,setInvBusy]=useState<Record<string,boolean>>({})

 // Personal AI state
 const [aiQ,setAiQ]=useState('')
 const [aiMsgs,setAiMsgs]=useState<any[]>([])
 const [aiBusy,setAiBusy]=useState(false)

 const loadMe=useCallback(async()=>{
  try{
   const [rMe,rTasks]=await Promise.all([
    fetch('/api/me',{cache:'no-store'}),
    fetch('/api/me/tasks',{cache:'no-store'})
   ])

   if(!rMe.ok){
    router.replace('/')
    return
   }

   const jMe=await rMe.json()
   const jTasks=rTasks.ok?await rTasks.json():[]

   setUserData(jMe.user)
   setMembership(jMe.membership)
   setMemberships(jMe.memberships||[])
   setInvitations(jMe.invitations||[])
   setTasks(jTasks||[])
   setProfileForm({
    name:jMe.user.name||'',
    title:jMe.user.title||'',
    city:jMe.user.city||''
   })
  }catch{
   router.replace('/')
  }finally{
   setLoading(false)
  }
 },[router])

 useEffect(()=>{
  loadMe()
 },[loadMe])

 const handleSaveProfile=async()=>{
  const e:any={}
  if(profileForm.name.trim().length<2)e.name='Name must be at least 2 characters.'
  setProfileErr(e)
  if(Object.keys(e).length)return

  setIsSavingProfile(true)
  try{
   const r=await fetch('/api/me',{
    method:'PATCH',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(profileForm)
   })
   const j=await r.json()
   if(!r.ok){
    setProfileErr({form:j.error||'Failed to update profile.'})
   }else{
    setUserData(j)
    setIsEditingProfile(false)
    setProfileErr({})
   }
  }catch{
   setProfileErr({form:'Network error. Please try again.'})
  }finally{
   setIsSavingProfile(false)
  }
 }

 const handleSwitchCompany=async(val:string)=>{
  if(val==='__create__'){
   router.push('/create-company')
   return
  }
  if(val==='personal')return
  setIsSwitching(true)
  try{
   const r=await fetch('/api/orgs/switch',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({organizationId:val})
   })
   if(r.ok){
    await reload()
    router.push('/workspace')
   }
  }catch{
   // handled
  }finally{
   setIsSwitching(false)
  }
 }

 const handleAddTask=async()=>{
  const e:any={}
  if(newTaskForm.title.trim().length<3)e.title='Task title must be at least 3 characters.'
  if(!newTaskForm.due)e.due='Select a due date.'
  setTaskErr(e)
  if(Object.keys(e).length)return

  setIsAddingTask(true)
  try{
   const r=await fetch('/api/me/tasks',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(newTaskForm)
   })
   const j=await r.json()
   if(!r.ok){
    setTaskErr({form:j.error||'Failed to create task.'})
   }else{
    setTasks(prev=>[...prev,j])
    setNewTaskForm({title:'',priority:'medium',due:''})
    setTaskErr({})
   }
  }catch{
   setTaskErr({form:'Network error. Please try again.'})
  }finally{
   setIsAddingTask(false)
  }
 }

 const handleUpdateTaskStatus=async(id:string,status:string)=>{
  setTaskBusy(b=>({...b,[id]:true}))
  try{
   const r=await fetch(`/api/me/tasks/${id}`,{
    method:'PATCH',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({status})
   })
   const j=await r.json()
   if(r.ok){
    setTasks(prev=>prev.map(t=>t.id===id?j:t))
   }
  }finally{
   setTaskBusy(b=>({...b,[id]:false}))
  }
 }

 const handleDeleteTask=async(id:string)=>{
  setTaskBusy(b=>({...b,[id]:true}))
  try{
   const r=await fetch(`/api/me/tasks/${id}`,{method:'DELETE'})
   if(r.ok){
    setTasks(prev=>prev.filter(t=>t.id!==id))
   }
  }finally{
   setTaskBusy(b=>({...b,[id]:false}))
  }
 }

 const handleCreateCompany=async()=>{
  const e:any={}
  const trimmedName=createCoForm.name.trim()
  if(trimmedName.length<3||trimmedName.length>60)e.name='Company name must be between 3 and 60 characters.'
  setCreateCoErr(e)
  if(Object.keys(e).length)return

  const slug=createCoForm.slug.trim()||trimmedName.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')

  setIsCreatingCo(true)
  try{
   const r=await fetch('/api/orgs',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name:trimmedName,slug})
   })
   const j=await r.json()
   if(!r.ok){
    setCreateCoErr({form:j.error||'Failed to create organization.'})
   }else{
    await reload()
    router.push('/workspace')
   }
  }catch{
   setCreateCoErr({form:'Network error. Please try again.'})
  }finally{
   setIsCreatingCo(false)
  }
 }

 const handleAcceptInvite=async(token:string)=>{
  setInvBusy(b=>({...b,[token]:true}))
  try{
   const r=await fetch(`/api/invitations/${token}/accept`,{method:'POST'})
   const j=await r.json()
   if(r.ok){
    await reload()
    router.push('/workspace')
   }
  }finally{
   setInvBusy(b=>({...b,[token]:false}))
  }
 }

 const handleDeclineInvite=async(token:string)=>{
  setInvBusy(b=>({...b,[token]:true}))
  try{
   const r=await fetch(`/api/invitations/${token}/decline`,{method:'POST'})
   if(r.ok){
    setInvitations(prev=>prev.filter(i=>i.token!==token))
   }
  }finally{
   setInvBusy(b=>({...b,[token]:false}))
  }
 }

 const handleAskAi=()=>{
  const q=aiQ.trim()
  if(!q||aiBusy)return

  setAiMsgs(m=>[...m,{r:'u',t:q}])
  setAiQ('')
  setAiBusy(true)

  setTimeout(()=>{
   let answer='I can answer from your personal tasks and priorities.'
   const low=q.toLowerCase()
   const open=tasks.filter(t=>t.status!=='done')

   if(/due|week|deadline/.test(low)){
    const list=open.map(t=>`"${t.title}" (due ${t.due})`).join(', ')
    answer=list?`You have open tasks: ${list}.`:'You have no pending tasks.'
   }else if(/overdue|late/.test(low)){
    answer='No personal tasks are currently flagged overdue.'
   }else if(/block/.test(low)){
    const bl=tasks.filter(t=>t.status==='blocked')
    answer=bl.length?`You have ${bl.length} blocked task: ${bl.map(t=>t.title).join(', ')}.`:'None of your personal tasks are blocked.'
   }else{
    answer=`You have ${open.length} active personal task${open.length===1?'':'s'} on your list.`
   }

   setAiMsgs(m=>[...m,{r:'a',t:answer}])
   setAiBusy(false)
  },1500)
 }

 if(loading||!userData){
  return (
   <div className="grid min-h-screen place-items-center">
    <div className="h-2.5 w-32 animate-pulse rounded bg-line"/>
   </div>
  )
 }

 return (
  <div className="min-h-screen bg-bg">
   {/* Header */}
   <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-bg/90 px-4 backdrop-blur md:px-8">
    <div className="flex items-center gap-3">
     <img src="/logo-light.png" alt="HeimDall" className="h-8"/>
     <span className="hidden text-xs text-mute sm:inline">/</span>
     <span className="hidden text-xs font-medium text-mute sm:inline">Personal Workspace</span>
    </div>

    <div className="flex items-center gap-3">
     <div className="relative flex items-center gap-1.5">
      <select
       id="home-company-switcher"
       aria-label="Company switcher"
       value="personal"
       disabled={isSwitching}
       onChange={e=>handleSwitchCompany(e.target.value)}
       className="field py-1 text-xs font-medium cursor-pointer"
      >
       <option value="personal">Personal space</option>
       {memberships.map((m:any)=>(
        <option key={m.organizationId} value={m.organizationId}>
         {m.organizationName}: {ROLES[m.role?.toLowerCase()]||m.role}
        </option>
       ))}
       <option value="__create__">Create a company</option>
      </select>
      {isSwitching&&(
       <span className="flex items-center gap-1 text-[11px] text-mute animate-pulse">
        <span className="size-2 rounded-full bg-accent animate-ping"/>
        <span className="hidden sm:inline">Switching...</span>
       </span>
      )}
     </div>

     {membership&&(
      <button
       onClick={()=>router.push('/workspace')}
       className="hidden sm:flex items-center gap-1.5 rounded-md bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20"
      >
       <Building size={14}/>
       <span>Go to {membership.organizationName}</span>
       <ArrowRight size={13}/>
      </button>
     )}

     <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="rounded-md border border-line p-2 hover:bg-surface"
     >
      {theme==='dark'?<Sun size={15}/>:<Moon size={15}/>}
     </button>

     <button
      onClick={()=>signOut({callbackUrl:'/'})}
      className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs text-mute hover:bg-surface hover:text-bad"
     >
      <LogOut size={14}/>
      <span className="hidden sm:inline">Sign out</span>
     </button>
    </div>
   </header>

   <main className="mx-auto max-w-6xl p-4 md:p-8">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
     <div>
      <h1 className="text-2xl font-semibold tracking-tight">Personal Workspace</h1>
      <p className="mt-0.5 text-xs text-mute">
       Your personal digital headquarters. Manage individual work or connect to an organization.
      </p>
     </div>
    </div>

    <div className="grid gap-6 lg:grid-cols-3">
     {/* Left Column: Profile Card + Personal Tasks + Personal AI */}
     <div className="space-y-6 lg:col-span-2">
      {/* 1. Profile Card */}
      <Card
       title="Personal Profile"
       action={
        !isEditingProfile&&(
         <button
          onClick={()=>setIsEditingProfile(true)}
          className="flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-xs text-mute hover:bg-surface hover:text-ink"
         >
          <Pencil size={12}/>
          <span>Edit</span>
         </button>
        )
       }
      >
       {!isEditingProfile?(
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
         <div className="grid size-16 shrink-0 place-items-center rounded-full bg-accent text-xl font-bold text-white dark:text-[#07101f]">
          {(userData.name||userData.email||'?').slice(0,2).toUpperCase()}
         </div>

         <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
           <h2 className="text-lg font-semibold">{userData.name}</h2>
           {memberships.length>0?(
            memberships.map((m:any)=>(
             <Chip key={m.organizationId} tone="accent">
              {m.organizationName} · {m.role}
             </Chip>
            ))
           ):membership&&(
            <Chip tone="accent">
             {membership.organizationName} · {membership.role}
            </Chip>
           )}
          </div>
          <p className="text-sm text-mute">{userData.title||'No headline set yet'}</p>
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-mute">
           <span className="flex items-center gap-1">
            <Mail size={13}/>
            {userData.email}
           </span>
           {userData.city&&(
            <span className="flex items-center gap-1">
             <MapPin size={13}/>
             {userData.city}
            </span>
           )}
           <span className="flex items-center gap-1">
            <Calendar size={13}/>
            Joined {new Date(userData.joinedAt).toLocaleDateString('en-GB',{month:'short',year:'numeric'})}
           </span>
          </div>
         </div>
        </div>
       ):(
        <div className="space-y-3">
         <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium">
           Full Name <span className="text-bad">*</span>
           <input
            className="field mt-1 w-full text-sm"
            value={profileForm.name}
            onChange={e=>setProfileForm({...profileForm,name:e.target.value})}
            maxLength={60}
           />
           {profileErr.name&&<p className="mt-1 text-xs text-bad">{profileErr.name}</p>}
          </label>

          <label className="text-xs font-medium">
           City / Location
           <input
            className="field mt-1 w-full text-sm"
            placeholder="e.g. San Francisco, CA"
            value={profileForm.city}
            onChange={e=>setProfileForm({...profileForm,city:e.target.value})}
            maxLength={60}
           />
          </label>
         </div>

         <label className="block text-xs font-medium">
          Professional Headline
          <input
           className="field mt-1 w-full text-sm"
           placeholder="e.g. Senior Software Architect / Product Strategist"
           value={profileForm.title}
           onChange={e=>setProfileForm({...profileForm,title:e.target.value})}
           maxLength={100}
          />
         </label>

         {profileErr.form&&<p className="text-xs text-bad">{profileErr.form}</p>}

         <div className="flex justify-end gap-2 pt-2">
          <button
           onClick={()=>{
            setIsEditingProfile(false)
            setProfileErr({})
           }}
           className="rounded-md border border-line px-3 py-1.5 text-xs text-mute hover:bg-surface"
          >
           Cancel
          </button>
          <button
           onClick={handleSaveProfile}
           disabled={isSavingProfile}
           className="rounded-md bg-accent px-4 py-1.5 text-xs font-medium text-white disabled:opacity-60 dark:text-[#07101f]"
          >
           {isSavingProfile?'Saving...':'Save changes'}
          </button>
         </div>
        </div>
       )}
      </Card>

      {/* 2. Personal Task List */}
      <Card title="Personal Tasks">
       {/* Add Personal Task Form */}
       <div className="mb-4 rounded-md border border-line bg-bg/50 p-3">
        <p className="mb-2 text-xs font-medium text-mute">Add a new personal task</p>
        <div className="grid gap-2 sm:grid-cols-4">
         <div className="sm:col-span-2">
          <input
           className="field w-full text-sm"
           placeholder="What do you need to do?"
           value={newTaskForm.title}
           onChange={e=>setNewTaskForm({...newTaskForm,title:e.target.value})}
           maxLength={120}
          />
          {taskErr.title&&<p className="mt-1 text-xs text-bad">{taskErr.title}</p>}
         </div>

         <div>
          <input
           type="date"
           className="field w-full text-sm"
           value={newTaskForm.due}
           onChange={e=>setNewTaskForm({...newTaskForm,due:e.target.value})}
          />
          {taskErr.due&&<p className="mt-1 text-xs text-bad">{taskErr.due}</p>}
         </div>

         <div className="flex gap-2">
          <select
           className="field w-full text-sm"
           value={newTaskForm.priority}
           onChange={e=>setNewTaskForm({...newTaskForm,priority:e.target.value})}
          >
           <option value="high">High</option>
           <option value="medium">Medium</option>
           <option value="low">Low</option>
          </select>
          <button
           onClick={handleAddTask}
           disabled={isAddingTask}
           className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60 dark:text-[#07101f]"
          >
           {isAddingTask?'Adding...':<Plus size={16}/>}
          </button>
         </div>
        </div>
        {taskErr.form&&<p className="mt-1 text-xs text-bad">{taskErr.form}</p>}
       </div>

       {/* Task List */}
       {tasks.length>0?(
        <div className="-m-4 overflow-x-auto">
         <table className="w-full">
          <thead>
           <tr className="border-b border-line text-left text-xs font-medium text-mute">
            <th className="px-4 py-2.5">Task</th>
            <th className="px-3 py-2.5">Priority</th>
            <th className="px-3 py-2.5">Due</th>
            <th className="px-3 py-2.5">Status</th>
            <th className="px-3 py-2.5"></th>
           </tr>
          </thead>
          <tbody>
           {tasks.map(t=>{
            const [dText,dTone]=due(t.due)
            return (
             <tr key={t.id} className="border-b border-line last:border-0">
              <td className="px-4 py-3">
               <p className={`font-medium ${t.status==='done'?'line-through text-mute':''}`}>{t.title}</p>
               {t.desc&&<p className="text-xs text-mute">{t.desc}</p>}
              </td>
              <td className="px-3 py-3">
               <Chip tone={PR_TONE[t.priority]}>{t.priority}</Chip>
              </td>
              <td className="px-3 py-3">
               <Chip tone={dTone as string}>{dText}</Chip>
              </td>
              <td className="px-3 py-3">
               <select
                aria-label={`Status of ${t.title}`}
                className="field py-1 text-xs"
                value={t.status}
                disabled={!!taskBusy[t.id]}
                onChange={e=>handleUpdateTaskStatus(t.id,e.target.value)}
               >
                {Object.keys(ST_LABELS).map(k=>(
                 <option key={k} value={k}>{ST_LABELS[k]}</option>
                ))}
               </select>
              </td>
              <td className="px-3 py-3 text-right">
               <button
                onClick={()=>handleDeleteTask(t.id)}
                disabled={!!taskBusy[t.id]}
                className="text-mute hover:text-bad disabled:opacity-50"
                aria-label={`Delete task ${t.title}`}
               >
                <Trash2 size={14}/>
               </button>
              </td>
             </tr>
            )
           })}
          </tbody>
         </table>
        </div>
       ):(
        <Empty
         dashed
         title="No personal tasks yet"
         hint="Create tasks above to track your independent priorities, notes, and milestones."
        />
       )}
      </Card>

      {/* 3. Small Personal AI Card */}
      <Card
       title="Personal AI Assistant"
       action={<Chip tone="accent">Free Plan · 10 queries/mo</Chip>}
      >
       <div className="mb-3 max-h-48 space-y-2 overflow-y-auto" aria-live="polite">
        {!aiMsgs.length&&!aiBusy&&(
         <p className="text-xs text-mute">
          Personal AI answers from your personal tasks and upcoming deadlines. Try asking "What tasks are due this week?"
         </p>
        )}
        {aiMsgs.map((m,i)=>(
         <div
          key={i}
          className={`rounded-md px-3 py-2 text-xs ${
           m.r==='u'?'ml-8 bg-accent/10 text-ink':'mr-8 border border-line bg-surface'
          }`}
         >
          {m.t}
         </div>
        ))}
        {aiBusy&&(
         <div className="mr-8 animate-pulse space-y-1.5 rounded-md border border-line p-2.5">
          <div className="h-2 w-3/4 rounded bg-line"/>
          <div className="h-2 w-1/2 rounded bg-line"/>
         </div>
        )}
       </div>

       <div className="flex gap-2">
        <input
         className="field min-w-0 flex-1 text-xs"
         placeholder="Ask Personal AI about your tasks..."
         value={aiQ}
         onChange={e=>setAiQ(e.target.value)}
         onKeyDown={e=>e.key==='Enter'&&handleAskAi()}
        />
        <button
         onClick={handleAskAi}
         disabled={aiBusy}
         className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-white disabled:opacity-50 dark:text-[#07101f]"
        >
         Ask
        </button>
       </div>
      </Card>
     </div>

     {/* Right Column: Two Clear Options (Create Company & Invitations) */}
     <div className="space-y-6">
      {/* Option 1: Create a Company */}
      <Card title="Create a Company">
       <div className="space-y-3">
        <div className="flex items-start gap-3">
         <div className="grid size-9 shrink-0 place-items-center rounded-md bg-accent/10 text-accent">
          <Building size={18}/>
         </div>
         <p className="text-xs text-mute">
          Establish a digital home for your company. You will be set as Executive and can invite members, run projects, and view organization metrics.
         </p>
        </div>

        <label className="block text-xs font-medium">
         Company Name <span className="text-bad">*</span>
         <input
          className="field mt-1 w-full text-sm"
          placeholder="e.g. Acme Corp"
          value={createCoForm.name}
          onChange={e=>setCreateCoForm({...createCoForm,name:e.target.value})}
          maxLength={60}
         />
         {createCoErr.name&&<p className="mt-1 text-xs text-bad">{createCoErr.name}</p>}
        </label>

        <label className="block text-xs font-medium">
         Organization Handle (optional)
         <input
          className="field mt-1 w-full text-sm"
          placeholder="e.g. acme-corp"
          value={createCoForm.slug}
          onChange={e=>setCreateCoForm({...createCoForm,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'')})}
          maxLength={40}
         />
        </label>

        {createCoErr.form&&<p className="text-xs text-bad">{createCoErr.form}</p>}

        <div className="flex flex-col gap-2 pt-1">
         <button
          onClick={handleCreateCompany}
          disabled={isCreatingCo}
          className="w-full rounded-md bg-accent py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:text-[#07101f]"
         >
          {isCreatingCo?'Creating organization...':'Create Company'}
         </button>
         <Link
          href="/create-company"
          className="flex items-center justify-center gap-1 py-1 text-xs text-mute hover:text-ink"
         >
          <span>Or open dedicated setup page</span>
          <ArrowRight size={12}/>
         </Link>
        </div>
       </div>
      </Card>

      {/* Option 2: Invitations Panel */}
      <Card
       title="Invitations"
       action={
        invitations.length>0&&(
         <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
          {invitations.length} pending
         </span>
        )
       }
      >
       {invitations.length>0?(
        <div className="space-y-3">
         {invitations.map(inv=>(
          <div
           key={inv.id}
           className="rounded-md border border-line bg-surface p-3 text-xs"
          >
           <div className="mb-1.5 flex items-start justify-between">
            <div>
             <p className="font-semibold">{inv.organizationName}</p>
             <p className="text-mute">
              Role: <span className="font-medium text-ink">{inv.role}</span>
             </p>
            </div>
            <Chip tone="warn">Invited</Chip>
           </div>

           <p className="mb-3 text-[11px] text-mute">
            Invited by {inv.invitedBy}.
           </p>

           <div className="flex gap-2">
            <button
             onClick={()=>handleAcceptInvite(inv.token)}
             disabled={!!invBusy[inv.token]}
             className="flex flex-1 items-center justify-center gap-1 rounded-md bg-accent py-1.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:text-[#07101f]"
            >
             <Check size={13}/>
             {invBusy[inv.token]?'Joining...':'Accept'}
            </button>
            <button
             onClick={()=>handleDeclineInvite(inv.token)}
             disabled={!!invBusy[inv.token]}
             className="flex flex-1 items-center justify-center gap-1 rounded-md border border-line py-1.5 text-mute hover:text-bad disabled:opacity-50"
            >
             <X size={13}/>
             {invBusy[inv.token]?'Declining...':'Decline'}
            </button>
           </div>
          </div>
         ))}
        </div>
       ):(
        <Empty
         title="No pending invitations"
         hint="Invitations sent to your email by other companies will show up here."
        />
       )}
      </Card>
     </div>
    </div>
   </main>
  </div>
 )
}

