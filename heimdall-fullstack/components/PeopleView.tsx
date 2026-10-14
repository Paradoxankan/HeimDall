'use client'
import {useState,useEffect,useCallback} from 'react'
import {useWs,fmt,days} from '@/lib/store'
import {can} from '@/lib/permissions'
import {Card,Chip,Empty,Head} from './ui'
import {UserPlus,Mail,Trash2,Copy,Check,Search,Users,Clock,Shield,AlertCircle,LogOut} from 'lucide-react'
import {Role} from '@prisma/client'

const ROLES_DISPLAY:Record<string,string>={
 EXECUTIVE:'Executive',
 HR:'HR',
 MANAGER:'Manager',
 EMPLOYEE:'Employee'
}

const ROLE_TONES:Record<string,string>={
 EXECUTIVE:'accent',
 HR:'ok',
 MANAGER:'warn',
 EMPLOYEE:'mute'
}

const ALL_INVITABLE_ROLES:Role[]=['HR','MANAGER','EMPLOYEE']

export function PeopleView(){
 const {me,workspace,leaveCompany,reload}=useWs()

 const [members,setMembers]=useState<any[]>([])
 const [invitations,setInvitations]=useState<any[]>([])
 const [loading,setLoading]=useState(true)
 const [q,setQ]=useState('')
 const [roleFilter,setRoleFilter]=useState('ALL')

 // Leave company state
 const [confirmLeave,setConfirmLeave]=useState(false)
 const [isLeaving,setIsLeaving]=useState(false)
 const [leaveErr,setLeaveErr]=useState<string|null>(null)

 // Add person form state
 const callerRole=me?.role as Role|undefined
 const allowedRoles=ALL_INVITABLE_ROLES.filter(r=>can(callerRole,'member.invite',r))

 const [email,setEmail]=useState('')
 const [selectedRole,setSelectedRole]=useState<Role>(allowedRoles[0]||'EMPLOYEE')
 const [isInviting,setIsInviting]=useState(false)
 const [inviteErr,setInviteErr]=useState<Record<string,string>>({})
 const [inviteSuccess,setInviteSuccess]=useState<{email:string,role:string,link?:string}|null>(null)
 const [copied,setCopied]=useState(false)

 // Row action busy states
 const [busyAction,setBusyAction]=useState<Record<string,boolean>>({})
 const [confirmRemoveId,setConfirmRemoveId]=useState<string|null>(null)

 const loadData=useCallback(async()=>{
  try{
   const r=await fetch('/api/orgs/members',{cache:'no-store'})
   if(r.ok){
    const j=await r.json()
    setMembers(j.members||[])
    setInvitations(j.invitations||[])
   }
  }catch{
   // handled gracefully
  }finally{
   setLoading(false)
  }
 },[])

 useEffect(()=>{
  loadData()
 },[loadData])

 useEffect(()=>{
  if(allowedRoles.length>0&&!allowedRoles.includes(selectedRole)){
   setSelectedRole(allowedRoles[0])
  }
 },[allowedRoles,selectedRole])

 const handleInvite=async(e:React.FormEvent)=>{
  e.preventDefault()
  const errors:Record<string,string>={}
  const trimmedEmail=email.trim().toLowerCase()

  if(!trimmedEmail||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)){
   errors.email='Enter a valid email address.'
  }

  if(!allowedRoles.includes(selectedRole)){
   errors.role='You do not have permission to invite this role.'
  }

  setInviteErr(errors)
  if(Object.keys(errors).length>0)return

  setIsInviting(true)
  setInviteSuccess(null)
  setCopied(false)

  try{
   const r=await fetch('/api/orgs/members/invite',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:trimmedEmail,role:selectedRole})
   })
   const j=await r.json()

   if(!r.ok){
    setInviteErr({form:j.error||'Failed to send invitation.'})
   }else{
    setEmail('')
    setInviteErr({})
    const inviteUrl=typeof window!=='undefined'
     ? `${window.location.origin}/home`
     : ''
    setInviteSuccess({
     email:trimmedEmail,
     role:selectedRole,
     link:inviteUrl
    })
    await loadData()
   }
  }catch{
   setInviteErr({form:'Network error. Please try again.'})
  }finally{
   setIsInviting(false)
  }
 }

 const handleRevoke=async(invId:string)=>{
  setBusyAction(b=>({...b,[invId]:true}))
  try{
   const r=await fetch(`/api/invitations/${invId}/revoke`,{method:'POST'})
   if(r.ok){
    setInvitations(prev=>prev.filter(i=>i.id!==invId&&i.token!==invId))
   }
  }finally{
   setBusyAction(b=>({...b,[invId]:false}))
  }
 }

 const handleRemoveMember=async(memId:string)=>{
  setBusyAction(b=>({...b,[memId]:true}))
  try{
   const r=await fetch(`/api/orgs/members/${memId}`,{method:'DELETE'})
   if(r.ok){
    setMembers(prev=>prev.filter(m=>m.id!==memId&&m.userId!==memId))
    setConfirmRemoveId(null)
   }
  }finally{
   setBusyAction(b=>({...b,[memId]:false}))
  }
 }

 const handleCopyLink=()=>{
  if(!inviteSuccess?.link)return
  navigator.clipboard.writeText(inviteSuccess.link)
  setCopied(true)
  setTimeout(()=>setCopied(false),3000)
 }

 const handleLeave=async()=>{
  setIsLeaving(true)
  setLeaveErr(null)
  try{
   const res=await leaveCompany()
   if(res?.error){
    setLeaveErr(res.error)
   }else{
    await reload()
    if(workspace?.companies?.length<=1){
     window.location.href='/home'
    }else{
     window.location.reload()
    }
   }
  }catch{
   setLeaveErr('Network error. Please try again.')
  }finally{
   setIsLeaving(false)
  }
 }

 const filteredMembers=members.filter(m=>{
  const matchesRole=roleFilter==='ALL'||m.role===roleFilter
  const query=q.trim().toLowerCase()
  const matchesQuery=!query||(
   (m.name&&m.name.toLowerCase().includes(query))||
   (m.email&&m.email.toLowerCase().includes(query))||
   (m.title&&m.title.toLowerCase().includes(query))||
   (m.city&&m.city.toLowerCase().includes(query))
  )
  return matchesRole&&matchesQuery
 })

 const canInviteAny=allowedRoles.length>0

 return (
  <div className="fade space-y-6">
   <Head
    title="People & Team"
    sub={`Manage organization members, assign roles, and track invitations for ${workspace?.activeCompany?.name||'your organization'}.`}
   />

   <div className="grid gap-6 lg:grid-cols-3">
    {/* Left 2 Cols: Members & Pending Invitations */}
    <div className="space-y-6 lg:col-span-2">
     {/* Team Directory Card */}
     <Card
      title="Team Directory"
      action={
       <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-md border border-line bg-surface px-2.5 py-1">
         <Search size={13} className="mr-1.5 text-mute"/>
         <input
          className="w-28 bg-transparent text-xs outline-none sm:w-36"
          placeholder="Search people..."
          value={q}
          onChange={e=>setQ(e.target.value)}
          aria-label="Search people"
         />
        </div>
        <select
         className="field py-1 text-xs"
         value={roleFilter}
         onChange={e=>setRoleFilter(e.target.value)}
         aria-label="Filter by role"
        >
         <option value="ALL">All roles</option>
         <option value="EXECUTIVE">Executive</option>
         <option value="HR">HR</option>
         <option value="MANAGER">Manager</option>
         <option value="EMPLOYEE">Employee</option>
        </select>
       </div>
      }
     >
      {leaveErr&&(
       <div className="mb-4 flex items-center gap-2 rounded-md border border-bad/40 bg-bad/10 p-3 text-xs text-bad">
        <AlertCircle size={15} className="shrink-0"/>
        <span>{leaveErr}</span>
       </div>
      )}
      {loading?(
       <div className="space-y-3 py-6">
        <div className="h-4 w-3/4 animate-pulse rounded bg-line"/>
        <div className="h-4 w-1/2 animate-pulse rounded bg-line"/>
       </div>
      ):filteredMembers.length>0?(
       <div className="-m-4 overflow-x-auto">
        <table className="w-full">
         <thead>
          <tr className="border-b border-line text-left text-xs font-medium text-mute">
           <th className="px-4 py-2.5">Member</th>
           <th className="px-3 py-2.5">Role</th>
           <th className="px-3 py-2.5">Location</th>
           <th className="px-3 py-2.5">Joined</th>
           <th className="px-3 py-2.5 text-right">Actions</th>
          </tr>
         </thead>
         <tbody>
          {filteredMembers.map(m=>{
           const canRemove=
            can(callerRole,'member.remove',m.role)&&
            m.userId!==me?.id&&
            !m.isCreator

           return (
            <tr key={m.id} className="border-b border-line last:border-0">
             <td className="px-4 py-3">
              <div className="flex items-center gap-3">
               <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
                {(m.name||m.email||'?').slice(0,2).toUpperCase()}
               </span>
               <div className="min-w-0">
                <p className="font-medium text-ink">
                 {m.name} {m.userId===me?.id&&<span className="text-xs text-mute">(You)</span>}
                </p>
                <p className="truncate text-xs text-mute">{m.title||m.email}</p>
               </div>
              </div>
             </td>
             <td className="px-3 py-3">
              <Chip tone={ROLE_TONES[m.role]||'mute'}>
               {ROLES_DISPLAY[m.role]||m.role}
              </Chip>
             </td>
             <td className="px-3 py-3 text-xs text-mute">
              {m.city||'—'}
             </td>
             <td className="px-3 py-3 text-xs text-mute">
              {new Date(m.joinedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
             </td>
             <td className="px-3 py-3 text-right">
              {canRemove?(
               confirmRemoveId===m.id?(
                <div className="flex items-center justify-end gap-1.5">
                 <button
                  onClick={()=>handleRemoveMember(m.id)}
                  disabled={!!busyAction[m.id]}
                  className="rounded bg-bad px-2 py-1 text-[11px] font-medium text-white hover:opacity-90 disabled:opacity-50"
                 >
                  {busyAction[m.id]?'Removing...':'Confirm'}
                 </button>
                 <button
                  onClick={()=>setConfirmRemoveId(null)}
                  className="rounded border border-line px-2 py-1 text-[11px] text-mute hover:bg-surface"
                 >
                  Cancel
                 </button>
                </div>
               ):(
                <button
                 onClick={()=>setConfirmRemoveId(m.id)}
                 className="inline-flex items-center gap-1 text-xs text-mute hover:text-bad"
                 aria-label={`Remove ${m.name}`}
                >
                 <Trash2 size={13}/>
                 <span>Remove</span>
                </button>
               )
              ):(
               m.isCreator?(
                <span className="text-[11px] text-mute">Owner</span>
               ):m.userId===me?.id?(
                confirmLeave?(
                 <div className="flex items-center justify-end gap-1.5">
                  <button
                   onClick={handleLeave}
                   disabled={isLeaving}
                   className="rounded bg-bad px-2 py-0.5 text-[11px] text-white disabled:opacity-60"
                  >
                   {isLeaving?'Leaving...':'Confirm'}
                  </button>
                  <button
                   onClick={()=>setConfirmLeave(false)}
                   className="rounded border border-line px-2 py-0.5 text-[11px] text-mute hover:bg-surface"
                  >
                   Cancel
                  </button>
                 </div>
                ):(
                 <button
                  onClick={()=>setConfirmLeave(true)}
                  className="inline-flex items-center gap-1 text-xs text-mute hover:text-bad"
                  title="Leave this organization"
                 >
                  <LogOut size={13}/>
                  <span>Leave</span>
                 </button>
                )
               ):(
                <span className="text-[11px] text-mute">—</span>
               )
              )}
             </td>
            </tr>
           )
          })}
         </tbody>
        </table>
       </div>
      ):(
       <Empty
        title="No members match"
        hint="No team members match your current filter or search criteria."
       />
      )}
     </Card>

     {/* Pending Invitations Card */}
     <Card
      title="Pending Invitations"
      action={
       invitations.length>0&&(
        <Chip tone="warn">{invitations.length} pending</Chip>
       )
      }
     >
      {loading?(
       <div className="h-10 animate-pulse rounded bg-line"/>
      ):invitations.length>0?(
       <div className="-m-4 overflow-x-auto">
        <table className="w-full">
         <thead>
          <tr className="border-b border-line text-left text-xs font-medium text-mute">
           <th className="px-4 py-2.5">Invited Email</th>
           <th className="px-3 py-2.5">Role</th>
           <th className="px-3 py-2.5">Invited By</th>
           <th className="px-3 py-2.5">Expires</th>
           <th className="px-3 py-2.5 text-right">Action</th>
          </tr>
         </thead>
         <tbody>
          {invitations.map(inv=>(
           <tr key={inv.id} className="border-b border-line last:border-0">
            <td className="px-4 py-3">
             <div className="flex items-center gap-2">
              <Mail size={14} className="text-mute shrink-0"/>
              <span className="font-medium">{inv.email}</span>
             </div>
            </td>
            <td className="px-3 py-3">
             <Chip tone={ROLE_TONES[inv.role]||'mute'}>
              {ROLES_DISPLAY[inv.role]||inv.role}
             </Chip>
            </td>
            <td className="px-3 py-3 text-xs text-mute">
             {inv.invitedBy}
            </td>
            <td className="px-3 py-3 text-xs text-mute">
             {days(inv.expiresAt.slice(0,10))<=0?'Today':`In ${days(inv.expiresAt.slice(0,10))} days`}
            </td>
            <td className="px-3 py-3 text-right">
             <button
              onClick={()=>handleRevoke(inv.id)}
              disabled={!!busyAction[inv.id]}
              className="rounded-md border border-line px-2.5 py-1 text-xs text-mute hover:border-bad/40 hover:text-bad disabled:opacity-50"
             >
              {busyAction[inv.id]?'Revoking...':'Revoke'}
             </button>
            </td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      ):(
       <Empty
        title="No pending invitations"
        hint="Invitations you send to colleagues will appear here until they accept or decline."
       />
      )}
     </Card>
    </div>

    {/* Right Col: Add Person Form */}
    <div className="space-y-6">
     <Card title="Add Person">
      {canInviteAny?(
       <form onSubmit={handleInvite} className="space-y-4">
        <p className="text-xs text-mute">
         Invite a colleague to join {workspace?.activeCompany?.name}. They will receive access upon signing in with this email.
        </p>

        <div>
         <label htmlFor="invite-email" className="block text-xs font-medium">
          Email Address <span className="text-bad">*</span>
         </label>
         <input
          id="invite-email"
          type="email"
          className="field mt-1 w-full text-sm"
          placeholder="colleague@example.com"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          disabled={isInviting}
         />
         {inviteErr.email&&<p role="alert" className="mt-1 text-xs text-bad">{inviteErr.email}</p>}
        </div>

        <div>
         <label htmlFor="invite-role" className="block text-xs font-medium">
          Assigned Role <span className="text-bad">*</span>
         </label>
         <select
          id="invite-role"
          className="field mt-1 w-full text-sm"
          value={selectedRole}
          onChange={e=>setSelectedRole(e.target.value as Role)}
          disabled={isInviting}
         >
          {allowedRoles.map(r=>(
           <option key={r} value={r}>
            {ROLES_DISPLAY[r]||r}
           </option>
          ))}
         </select>
         <p className="mt-1 text-[11px] text-mute">
          Only roles you are authorized to assign appear in this dropdown.
         </p>
         {inviteErr.role&&<p role="alert" className="mt-1 text-xs text-bad">{inviteErr.role}</p>}
        </div>

        {inviteErr.form&&(
         <p role="alert" className="rounded-md border border-bad/30 bg-bad/10 p-2 text-xs text-bad">
          {inviteErr.form}
         </p>
        )}

        {/* Inline Success Message */}
        {inviteSuccess&&(
         <div className="fade space-y-2 rounded-md border border-ok/30 bg-ok/10 p-3 text-xs text-ok">
          <div className="flex items-center gap-1.5 font-semibold">
           <Check size={14} className="shrink-0"/>
           <span>Invitation sent for {inviteSuccess.email}!</span>
          </div>
          <p className="text-ink">
           Ask them to sign in to HeimDall with this email.
          </p>
          <div className="mt-2 flex items-center justify-between gap-2 rounded border border-line bg-surface p-2 text-[11px] text-mute">
           <span className="truncate">{inviteSuccess.link}</span>
           <button
            type="button"
            onClick={handleCopyLink}
            className="flex shrink-0 items-center gap-1 rounded bg-accent px-2 py-0.5 text-white dark:text-[#07101f]"
           >
            {copied?<Check size={12}/>:<Copy size={12}/>}
            <span>{copied?'Copied!':'Copy link'}</span>
           </button>
          </div>
         </div>
        )}

        <button
         type="submit"
         disabled={isInviting}
         className="flex w-full items-center justify-center gap-1.5 rounded-md bg-accent py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:text-[#07101f]"
        >
         <UserPlus size={14}/>
         <span>{isInviting?'Sending invitation...':'Send Invitation'}</span>
        </button>
       </form>
      ):(
       <div className="space-y-2 text-xs text-mute">
        <p>Your current role ({ROLES_DISPLAY[callerRole||'EMPLOYEE']||callerRole}) cannot invite new members to the organization.</p>
        <p className="text-[11px]">Contact an Executive or HR member to invite new team members.</p>
       </div>
      )}
     </Card>

     {/* Permissions Guide Card */}
     <Card title="Team Roles & Permissions">
      <div className="space-y-3 text-xs">
       <div className="flex items-start gap-2">
        <Shield size={14} className="mt-0.5 shrink-0 text-accent"/>
        <div>
         <p className="font-semibold text-ink">Executive</p>
         <p className="text-[11px] text-mute">Can invite HR, Managers, and Employees. Can remove any member.</p>
        </div>
       </div>

       <div className="flex items-start gap-2">
        <Shield size={14} className="mt-0.5 shrink-0 text-ok"/>
        <div>
         <p className="font-semibold text-ink">HR</p>
         <p className="text-[11px] text-mute">Can invite Employees and decide leave requests. Can remove Employees.</p>
        </div>
       </div>

       <div className="flex items-start gap-2">
        <Shield size={14} className="mt-0.5 shrink-0 text-warn"/>
        <div>
         <p className="font-semibold text-ink">Manager</p>
         <p className="text-[11px] text-mute">Can invite Employees and manage projects and team tasks.</p>
        </div>
       </div>

       <div className="flex items-start gap-2">
        <Shield size={14} className="mt-0.5 shrink-0 text-mute"/>
        <div>
         <p className="font-semibold text-ink">Employee</p>
         <p className="text-[11px] text-mute">Can create and manage their own assigned tasks and submit leave requests.</p>
        </div>
       </div>
      </div>
     </Card>
    </div>
   </div>
  </div>
 )
}

