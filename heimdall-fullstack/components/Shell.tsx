'use client'
import {useState,ReactNode} from 'react'
import {useRouter} from 'next/navigation'
import {Sun,Moon,Menu,Settings,LogOut,Building,Plus,Check,X,Mail,Loader2,AlertCircle} from 'lucide-react'
import {signOut} from 'next-auth/react'
import {useWs,ROLES,ALLOWED,VIEW_NAMES} from '@/lib/store'
import {Empty,Chip,Card} from './ui'
import {PeopleView} from './PeopleView'
import {ContractsView} from './Contracts'

const NAV:any={
 employee:['Overview','Tasks','Documents','Communication','Reports','Updates'],
 manager:['Overview','People','Projects','Contracts','Communication','Reports','Updates'],
 hr:['Overview','People','Communication','Reports','Updates'],
 executive:['Overview','People','Department','Projects','Contracts','Communication','Reports','Updates','HeimDall AI']
}

export default function Shell({children}:{children:ReactNode}){
 const {
  role,
  setRole,
  theme,
  toggleTheme,
  me,
  workspace,
  switchWorkspace,
  leaveCompany,
  createCompany,
  acceptInvitation,
  declineInvitation,
  reload,
  busy,
  notice,
  setNotice
 }=useWs()

 const router=useRouter()
 const [open,setOpen]=useState(false)
 const [view,setView]=useState('Overview')
 const [showCreateModal,setShowCreateModal]=useState(false)
 const [newCo,setNewCo]=useState({name:'',slug:'',title:''})
 const [formErr,setFormErr]=useState<any>({})
 const [switching,setSwitching]=useState(false)
 const [isLeaving,setIsLeaving]=useState(false)
 const [leaveErr,setLeaveErr]=useState<string|null>(null)

 const out=()=>signOut({callbackUrl:'/'})

 const handleCreate=async()=>{
  const e:any={}
  const trimmedName=newCo.name.trim()
  if(trimmedName.length<3||trimmedName.length>60)e.name='Company name must be between 3 and 60 characters.'
  setFormErr(e)
  if(Object.keys(e).length)return

  const slug=newCo.slug.trim()||trimmedName.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
  const res=await createCompany({name:trimmedName,slug})
  if(res.error){
   setFormErr({form:res.error})
  }else{
   setNewCo({name:'',slug:'',title:''})
   setShowCreateModal(false)
   await reload()
   router.push('/workspace')
  }
 }

 const activeCompanyId=workspace?.isPersonal?'personal':workspace?.activeCompany?.id||'personal'

 const handleWorkspaceChange=async(val:string)=>{
  if(val==='__create__'){
   router.push('/create-company')
   return
  }
  setSwitching(true)
  try{
   if(val==='personal'){
    await switchWorkspace(null)
    await reload()
    router.push('/home')
   }else{
    await switchWorkspace(val)
    await reload()
    if(window.location.pathname.startsWith('/home')){
     router.push('/workspace')
    }
   }
  }catch{
   // Handled gracefully
  }finally{
   setSwitching(false)
  }
 }

 const handleLeaveActiveCompany=async()=>{
  if(!window.confirm(`Are you sure you want to leave ${workspace?.activeCompany?.name||'this organization'}?`)){
   return
  }
  setIsLeaving(true)
  setLeaveErr(null)
  try{
   const res=await leaveCompany()
   if(res?.error){
    setLeaveErr(res.error)
    setNotice(res.error)
   }else{
    await reload()
    if(workspace?.companies?.length<=1){
     router.push('/home')
    }else{
     router.push('/workspace')
    }
   }
  }catch{
   setLeaveErr('Network error. Please try again.')
  }finally{
   setIsLeaving(false)
  }
 }

 const currentNav=NAV[role]||NAV.employee

 const nav=(
  <>
   <div className="flex h-16 items-center justify-between px-5">
    <img src="/logo-light.png" alt="HeimDall" className="h-9"/>
   </div>

   {/* Workspace Switcher in sidebar */}
   <div className="px-3 pb-3">
    <label htmlFor="sidebar-workspace-switcher" className="mb-1 block text-xs font-medium text-[#7F8CA6]">WORKSPACE</label>
    <div className="relative">
     <select
      id="sidebar-workspace-switcher"
      aria-label="Workspace switcher"
      value={activeCompanyId}
      disabled={switching}
      onChange={e=>handleWorkspaceChange(e.target.value)}
      className="w-full rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-[#B9C4D8] outline-none hover:bg-white/10 focus:border-accent disabled:opacity-60"
     >
      <option value="personal">Personal space</option>
      {workspace?.companies?.map((c:any)=>(
       <option key={c.id} value={c.id}>
        {c.name}: {ROLES[c.role?.toLowerCase()]||c.role}
       </option>
      ))}
      <option value="__create__">Create a company</option>
     </select>
    </div>
   </div>

   <nav className="flex-1 space-y-0.5 px-3 py-2">
    {currentNav.map((n:string)=>(
     <button
      key={n}
      onClick={()=>{setView(n);setOpen(false)}}
      className={`block w-full rounded-md px-3 py-2 text-left text-[#B9C4D8] transition-colors hover:bg-white/5 hover:text-white ${view===n?'bg-white/10 !text-white':''}`}
     >
      {n}
     </button>
    ))}
   </nav>

   <div className="space-y-0.5 border-t border-white/10 px-3 py-3 text-[#B9C4D8]">
    <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 hover:bg-white/5 hover:text-white" onClick={()=>setView('Settings')}>
     <Settings size={16}/>Settings
    </button>
    <button onClick={out} className="flex w-full items-center gap-2 rounded-md px-3 py-2 hover:bg-white/5 hover:text-white">
     <LogOut size={16}/>Sign out
    </button>
   </div>
  </>
 )

 return (
  <div className="min-h-screen md:pl-60">
   <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-[var(--side)] md:flex">
    {nav}
   </aside>

   {open&&(
    <div className="fixed inset-0 z-40 md:hidden">
     <div className="absolute inset-0 bg-black/50" onClick={()=>setOpen(false)}/>
     <aside className="fade absolute inset-y-0 left-0 flex w-64 flex-col bg-[var(--side)]">
      {nav}
     </aside>
    </div>
   )}

   <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur">
    <button className="md:hidden" aria-label="Open menu" onClick={()=>setOpen(true)}>
     <Menu size={20}/>
    </button>

    <div className="flex items-center gap-2 min-w-0">
     <Building size={16} className="text-accent shrink-0 hidden sm:block"/>
     <span className="font-semibold text-ink truncate text-sm">
      {workspace?.isPersonal?'Personal Workspace':(workspace?.activeCompany?.name||'Organization')}
     </span>
     <span className="text-mute hidden sm:inline">/</span>
     <span className="text-xs text-mute hidden sm:inline capitalize">
      {workspace?.isPersonal?'Individual':(VIEW_NAMES[role]||`${ROLES[role]||role} View`)}
     </span>
    </div>

    {/* Top bar Company Switcher Dropdown */}
    <div className="ml-auto flex items-center gap-2">
     <div className="relative flex items-center gap-1.5">
      <select
       id="topbar-company-switcher"
       aria-label="Company switcher"
       value={activeCompanyId}
       disabled={switching}
       onChange={e=>handleWorkspaceChange(e.target.value)}
       className="field py-1 text-xs font-medium cursor-pointer"
      >
       <option value="personal">Personal space</option>
       {workspace?.companies?.map((c:any)=>(
        <option key={c.id} value={c.id}>
         {c.name}: {ROLES[c.role?.toLowerCase()]||c.role}
        </option>
       ))}
       <option value="__create__">Create a company</option>
      </select>
      {switching&&(
       <span className="flex items-center gap-1 text-[11px] text-mute animate-pulse">
        <Loader2 size={13} className="animate-spin text-accent"/>
        <span className="hidden sm:inline">Switching...</span>
       </span>
      )}
     </div>

     {/* Allowed views switcher within current company */}
     {!workspace?.isPersonal&&ALLOWED[me?.role]&&(
      ALLOWED[me.role].length>1?(
       <div className="flex items-center gap-1.5">
        <label htmlFor="view-switcher" className="hidden text-xs text-mute lg:inline">
         View:
        </label>
        <select
         id="view-switcher"
         aria-label="Switch dashboard view"
         className="field py-1 text-xs"
         value={role}
         onChange={e=>setRole(e.target.value)}
        >
         {ALLOWED[me.role].map((k:string)=>(
          <option key={k} value={k}>
           {VIEW_NAMES[k]||ROLES[k]}
          </option>
         ))}
        </select>
       </div>
      ):(
       <div className="flex items-center">
        <Chip tone="mute">
         {VIEW_NAMES[ALLOWED[me.role][0]]||ROLES[me.role.toLowerCase()]||'Employee View'}
        </Chip>
       </div>
      )
     )}

     <button onClick={toggleTheme} aria-label="Toggle theme" className="rounded-md border border-line p-2 hover:bg-surface">
      {theme==='dark'?<Sun size={16}/>:<Moon size={16}/>}
     </button>

     <span
      className="grid size-8 place-items-center rounded-full bg-accent text-xs font-semibold text-white dark:text-[#07101f]"
      title={me?.name||me?.email||'?'}
     >
      {(me?.name||me?.email||'?').split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()}
     </span>
    </div>
   </header>

   {/* Pending Invitations Banner */}
   {workspace?.invitations?.length>0&&(
    <div className="mx-4 mt-3 space-y-2 md:mx-6">
     {workspace.invitations.map((inv:any)=>(
      <div
       key={inv.id}
       className="fade flex flex-wrap items-center justify-between gap-3 rounded-md border border-accent/30 bg-accent/10 px-4 py-3 text-sm"
      >
       <div className="flex items-center gap-2.5">
        <Mail size={18} className="text-accent shrink-0"/>
        <span>
         You have been invited to join <b>{inv.companyName}</b> as <b>{ROLES[inv.role.toLowerCase()]||inv.role}</b> by {inv.invitedBy}.
        </span>
       </div>
       <div className="flex items-center gap-2">
        <button
         onClick={()=>acceptInvitation(inv.token)}
         disabled={!!busy['accept-inv-'+inv.token]}
         className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:text-[#07101f]"
        >
         <Check size={14}/>
         {busy['accept-inv-'+inv.token]?'Joining...':'Accept & Join'}
        </button>
        <button
         onClick={()=>declineInvitation(inv.token)}
         disabled={!!busy['decline-inv-'+inv.token]}
         className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-mute transition-colors hover:text-bad disabled:opacity-50"
        >
         <X size={14}/>
         {busy['decline-inv-'+inv.token]?'Declining...':'Decline'}
        </button>
       </div>
      </div>
     ))}
    </div>
   )}

   {notice&&(
    <p role="alert" className="mx-4 mt-3 rounded-md border border-bad/40 bg-bad/10 px-3 py-2 text-bad md:mx-6">
     {notice}
    </p>
   )}

   <main className="mx-auto max-w-6xl p-4 md:p-6">
    {view==='Overview'?children:view==='People'?(
     <PeopleView/>
    ):view==='Contracts'?(
     <ContractsView/>
    ):view==='Settings'?(
     <div className="fade space-y-6">
      <Card title="Organization Settings">
       <div className="space-y-4">
        <div>
         <h4 className="text-sm font-semibold text-ink">{workspace?.activeCompany?.name||'Personal Workspace'}</h4>
         <p className="text-xs text-mute">
          Handle: {workspace?.activeCompany?.slug||'personal'} · Your role: {workspace?.isPersonal?'Individual':(ROLES[role]||role)}
         </p>
        </div>

        {!workspace?.isPersonal&&workspace?.activeCompany&&(
         <div className="border-t border-line pt-4">
          <h5 className="text-xs font-medium text-bad">Danger Zone</h5>
          <p className="mt-1 text-xs text-mute">
           Leave this organization. Your membership will be removed while preserving company projects and tasks.
          </p>

          {leaveErr&&(
           <div className="mt-2 flex items-center gap-2 rounded-md border border-bad/40 bg-bad/10 p-2.5 text-xs text-bad">
            <AlertCircle size={14} className="shrink-0"/>
            <span>{leaveErr}</span>
           </div>
          )}

          <div className="mt-3">
           <button
            onClick={handleLeaveActiveCompany}
            disabled={isLeaving}
            className="flex items-center gap-1.5 rounded-md border border-bad/40 bg-bad/10 px-3 py-1.5 text-xs font-medium text-bad hover:bg-bad hover:text-white transition-colors disabled:opacity-60"
           >
            <LogOut size={14}/>
            <span>{isLeaving?'Leaving...':'Leave this organization'}</span>
           </button>
          </div>
         </div>
        )}
       </div>
      </Card>
     </div>
    ):(
     <Empty dashed title={`${view} isn't part of this release`} hint="This section is planned for the next milestone. Your Overview is fully working."/>
    )}
   </main>

   {/* Create Company Modal */}
   {showCreateModal&&(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
     <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={()=>setShowCreateModal(false)}/>
     <div className="fade relative w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
       <div className="flex items-center gap-2">
        <Building size={20} className="text-accent"/>
        <h3 className="text-lg font-semibold">Create an Organization</h3>
       </div>
       <button onClick={()=>setShowCreateModal(false)} className="text-mute hover:text-ink">
        <X size={18}/>
       </button>
      </div>

      <p className="mb-4 text-xs text-mute">
       Set up a digital home for your company. You will be assigned as the Executive/Owner and can invite team members.
      </p>

      <div className="space-y-3">
       <label className="block text-xs font-medium">
        Company Name <span className="text-bad">*</span>
        <input
         className="field mt-1 w-full text-sm"
         placeholder="e.g. Acme Corp"
         value={newCo.name}
         onChange={e=>setNewCo({...newCo,name:e.target.value})}
         maxLength={60}
        />
        {formErr.name&&<p className="mt-1 text-xs text-bad">{formErr.name}</p>}
       </label>

       <label className="block text-xs font-medium">
        Handle / Slug (optional)
        <input
         className="field mt-1 w-full text-sm"
         placeholder="e.g. acme-corp"
         value={newCo.slug}
         onChange={e=>setNewCo({...newCo,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'')})}
         maxLength={40}
        />
        <span className="mt-0.5 block text-[11px] text-mute">Used for organization URLs and references.</span>
       </label>

       <label className="block text-xs font-medium">
        Your Title in Company
        <input
         className="field mt-1 w-full text-sm"
         placeholder="e.g. Founder & CEO"
         value={newCo.title}
         onChange={e=>setNewCo({...newCo,title:e.target.value})}
         maxLength={60}
        />
       </label>

       {formErr.form&&<p className="text-xs text-bad">{formErr.form}</p>}
      </div>

      <div className="mt-6 flex justify-end gap-2">
       <button
        onClick={()=>setShowCreateModal(false)}
        className="rounded-md border border-line px-4 py-2 text-xs font-medium text-mute hover:bg-white/5"
       >
        Cancel
       </button>
       <button
        onClick={handleCreate}
        disabled={!!busy['create-co']}
        className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:text-[#07101f]"
       >
        {busy['create-co']?'Creating...':'Create Company'}
       </button>
      </div>
     </div>
    </div>
   )}
  </div>
 )
}
