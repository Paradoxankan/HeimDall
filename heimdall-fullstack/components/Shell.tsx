'use client'
import {useState,ReactNode} from 'react'
import {useRouter} from 'next/navigation'
import {Sun,Moon,Menu,X,Settings,LogOut} from 'lucide-react'
import {signOut} from 'next-auth/react'
import {useWs,ROLES,ALLOWED} from '@/lib/store'
import {Logo,Empty} from './ui'
const NAV:any={employee:['Overview','Tasks','Documents','Communication','Reports','Updates'],manager:['Overview','Department','Team','Projects','Contracts','Communication','Reports','Updates'],hr:['Overview','Team','Communication','Reports','Updates'],executive:['Overview','Department','Team','Projects','Contracts','Communication','Reports','Updates','HeimDall AI']}
export default function Shell({children}:{children:ReactNode}){
 const {role,setRole,theme,toggleTheme,me,notice}=useWs();const router=useRouter();const [open,setOpen]=useState(false),[view,setView]=useState('Overview')
 const out=()=>signOut({callbackUrl:'/'})
 const nav=<><div className="flex h-16 items-center px-5"><img src="/logo-light.png" alt="HeimDall" className="h-9"/></div>
  <nav className="flex-1 space-y-0.5 px-3 py-2">{NAV[role].map((n:string)=><button key={n} onClick={()=>{setView(n);setOpen(false)}} className={`block w-full rounded-md px-3 py-2 text-left text-[#B9C4D8] transition-colors hover:bg-white/5 hover:text-white ${view===n?'bg-white/10 !text-white':''}`}>{n}</button>)}</nav>
  <div className="space-y-0.5 border-t border-white/10 px-3 py-3 text-[#B9C4D8]"><button className="flex w-full items-center gap-2 rounded-md px-3 py-2 hover:bg-white/5 hover:text-white" onClick={()=>setView('Settings')}><Settings size={16}/>Settings</button><button onClick={out} className="flex w-full items-center gap-2 rounded-md px-3 py-2 hover:bg-white/5 hover:text-white"><LogOut size={16}/>Sign out</button></div></>
 return <div className="min-h-screen md:pl-60"><aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-[var(--side)] md:flex">{nav}</aside>
 {open&&<div className="fixed inset-0 z-40 md:hidden"><div className="absolute inset-0 bg-black/50" onClick={()=>setOpen(false)}/><aside className="fade absolute inset-y-0 left-0 flex w-64 flex-col bg-[var(--side)]">{nav}</aside></div>}
 <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur"><button className="md:hidden" aria-label="Open menu" onClick={()=>setOpen(true)}><Menu size={20}/></button><span className="hidden text-mute sm:block">HeimDall / {ROLES[role]} dashboard</span><div className="ml-auto flex items-center gap-2">
  <select aria-label="Switch dashboard" className="field py-1" value={role} onChange={e=>setRole(e.target.value)}>{ALLOWED[me.role].map((k:string)=><option key={k} value={k}>{ROLES[k]}</option>)}</select>
  <button onClick={toggleTheme} aria-label="Toggle theme" className="rounded-md border border-line p-2 hover:bg-surface">{theme==='dark'?<Sun size={16}/>:<Moon size={16}/>}</button>
  <span className="grid size-8 place-items-center rounded-full bg-accent text-xs font-semibold text-white dark:text-[#07101f]" title={(me.name||'?')}>{(me.name||'?').split(' ').map((w:string)=>w[0]).join('')}</span></div></header>
 {notice&&<p role="alert" className="mx-4 mt-3 rounded-md border border-bad/40 bg-bad/10 px-3 py-2 text-bad md:mx-6">{notice}</p>}<main className="mx-auto max-w-6xl p-4 md:p-6">{view==='Overview'?children:<Empty dashed title={`${view} isn't part of this release`} hint="This section is planned for the next milestone. Your Overview is fully working."/>}</main></div>}
