'use client'
import {createContext,useContext,useEffect,useState,useCallback,ReactNode} from 'react'

export const ROLES:any={employee:'Employee',manager:'Manager',hr:'HR',executive:'Executive'}
export const ALLOWED:Record<string,string[]>={
 EMPLOYEE:['employee'],
 MANAGER:['manager','employee'],
 HR:['hr','employee'],
 EXECUTIVE:['executive','manager','hr','employee']
}
export const VIEW_NAMES:Record<string,string>={
 executive:'Executive View',
 manager:'Manager View',
 hr:'HR View',
 employee:'Employee View'
}
export const first=(n:string)=>(n||'there').split(' ')[0]
export const days=(d:string)=>Math.round((Date.parse(d)-Date.parse(new Date().toISOString().slice(0,10)))/864e5)
export const fmt=(d:string)=>new Date(d+'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'})
export const ago=(m:number)=>m<60?m+' min ago':m<1440?Math.round(m/60)+' hr ago':Math.round(m/1440)+' d ago'

export function due(d:string){
 const n=days(d)
 return n<0?[`${-n}d overdue`,'bad']:n===0?['Today','warn']:n===1?['Tomorrow','warn']:n<=3?[`In ${n} days`,'warn']:[fmt(d),'mute']
}

const call=async(url:string,method:string,body?:any):Promise<{error?:string,data?:any}>=>{
 try{
  const r=await fetch(url,{
   method,
   headers:{'Content-Type':'application/json'},
   body:body?JSON.stringify(body):undefined
  })
  const j=await r.json().catch(()=>({}))
  if(r.ok)return {data:j}
  return {error:j.error||'Something went wrong.'}
 }catch{
  return {error:'Network error. Please try again.'}
 }
}

const Ctx=createContext<any>(null)
export const useWs=()=>useContext(Ctx)

export function WorkspaceProvider({children}:{children:ReactNode}){
 const [s,setS]=useState<any>({ready:false,me:null,workspace:null,data:null})
 const [view,setView]=useState<string|null>(null)
 const [theme,setTheme]=useState('light')
 const [busy,setBusy]=useState<any>({})
 const [notice,setNotice]=useState('')

 const load=useCallback(async()=>{
  try{
   const r=await fetch('/api/bootstrap',{cache:'no-store'})
   if(!r.ok)return setS({ready:true,me:null,workspace:null,data:null})
   const j=await r.json()
   setS({ready:true,me:j.me,workspace:j.workspace,data:j.data})
   setView(v=>v&&ALLOWED[j.me.role]?.includes(v)?v:ALLOWED[j.me.role]?.[0]||j.me.role.toLowerCase())
  }catch{
   setS({ready:true,me:null,workspace:null,data:null})
  }
 },[])

 useEffect(()=>{
  setTheme(document.documentElement.dataset.theme||'light')
  load()
 },[load])

 useEffect(()=>{
  if(!notice)return
  const t=setTimeout(()=>setNotice(''),5000)
  return()=>clearTimeout(t)
 },[notice])

 const toggleTheme=()=>{
  const n=theme==='dark'?'light':'dark',h=document.documentElement
  h.classList.add('anim')
  h.dataset.theme=n
  setTheme(n)
  try{localStorage.setItem('hd-theme',n)}catch{}
  setTimeout(()=>h.classList.remove('anim'),400)
 }

 const patch=(fn:(d:any)=>any)=>setS((x:any)=>({...x,data:fn(x.data)}))

 const run=async(key:string,optimistic:((d:any)=>any)|null,req:()=>Promise<{error?:string,data?:any}>)=>{
  setBusy((b:any)=>({...b,[key]:true}))
  if(optimistic)patch(optimistic)
  const r=await req()
  if(r.error)setNotice(r.error)
  await load()
  setBusy((b:any)=>({...b,[key]:false}))
  return r
 }

 const setStatus=(id:string,status:string)=>run(id,d=>({...d,tasks:d.tasks.map((t:any)=>t.id===id?{...t,status,progress:status==='done'?100:t.progress}:t)}),()=>call(`/api/tasks/${id}`,'PATCH',{status:status.toUpperCase()}))
 const deleteTask=(id:string)=>run(id,d=>({...d,tasks:d.tasks.filter((t:any)=>t.id!==id)}),()=>call(`/api/tasks/${id}`,'DELETE'))
 const createTask=(b:any)=>run('new-task',null,()=>call('/api/tasks','POST',b))
 const requestLeave=(b:any)=>run('new-leave',null,()=>call('/api/leave','POST',b))
 const cancelLeave=(id:string)=>run(id,d=>({...d,myLeave:d.myLeave.filter((l:any)=>l.id!==id)}),()=>call(`/api/leave/${id}`,'DELETE'))
 const decideLeave=(id:string,decision:string)=>run(id,d=>({...d,leave:d.leave.filter((l:any)=>l.id!==id)}),()=>call(`/api/leave/${id}`,'PATCH',{decision}))
 const switchWorkspace=(companyId:string|null)=>run('switch-ws',null,()=>call('/api/companies/switch','POST',{companyId}))
 const createCompany=(b:any)=>run('create-co',null,()=>call('/api/orgs','POST',b))
 const acceptInvitation=(token:string)=>run('accept-inv-'+token,null,()=>call(`/api/invitations/${token}/accept`,'POST'))
 const declineInvitation=(token:string)=>run('decline-inv-'+token,null,()=>call(`/api/invitations/${token}/decline`,'POST'))
 const revokeInvitation=(token:string)=>run('revoke-inv-'+token,null,()=>call(`/api/invitations/${token}/revoke`,'POST'))
 const inviteMember=(b:any)=>run('invite-member',null,()=>call('/api/orgs/members/invite','POST',b))
 const removeMember=(id:string)=>run('remove-member-'+id,null,()=>call(`/api/orgs/members/${id}`,'DELETE'))

 const changeRole=(newRole:string)=>{
  if(!s.me?.role)return setView(newRole)
  if(ALLOWED[s.me.role]?.includes(newRole)){
   setView(newRole)
  }
 }

 return (
  <Ctx.Provider value={{
   ready:s.ready,
   me:s.me,
   workspace:s.workspace,
   data:s.data,
   tasks:s.data?.tasks||[],
   role:view,
   setRole:changeRole,
   theme,
   toggleTheme,
   busy,
   notice,
   setNotice,
   setStatus,
   deleteTask,
   createTask,
   requestLeave,
   cancelLeave,
   decideLeave,
   switchWorkspace,
   createCompany,
   acceptInvitation,
   declineInvitation,
   revokeInvitation,
   inviteMember,
   removeMember,
   reload:load
  }}>
   {children}
  </Ctx.Provider>
 )
}
