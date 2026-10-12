'use client'
import {useState} from 'react'
import {useWs,first,days,fmt,due,ago} from '@/lib/store'
import {Card,Chip,Empty,Stat,Bar,Head} from '../ui'
import AIWidget from '../AIWidget'
export const ST:any={todo:['To do','mute'],progress:['In progress','accent'],blocked:['Blocked','bad'],done:['Completed','ok']}
export const PR:any={high:'warn',medium:'accent',low:'mute'}
export const Th=({c}:{c:string})=><th className="px-3 py-2 text-left font-medium text-mute">{c}</th>
export function Updates({n=4}:{n?:number}){const {data}=useWs();return <Card title="Recent updates">{data.activity.length?<ul className="space-y-3">{data.activity.slice(0,n).map((a:any,i:number)=><li key={i} className="flex justify-between gap-3"><span><b className="font-medium">{a.who}</b> {a.what} <span className="text-mute">{a.target}</span></span><span className="shrink-0 text-xs text-mute">{ago(a.min)}</span></li>)}</ul>:<Empty title="No updates yet" hint="Uploads and comments from your projects will appear here."/>}</Card>}
export function Projects(){const {data}=useWs();return <Card title="Active projects">{data.projects.length?<div className="divide-y divide-line">{data.projects.map((p:any)=><div key={p.name} className="py-3 first:pt-0 last:pb-0"><div className="mb-2 flex items-center justify-between"><span className="font-medium">{p.name} <span className="font-normal text-mute">{p.sub}</span></span><Chip tone={p.tone}>{p.status}</Chip></div><Bar pct={p.pct} tone={p.tone}/><p className="mt-1.5 text-xs text-mute">{p.pct}% complete. Lead {p.lead}, {p.team} members. Next: {p.milestone}</p></div>)}</div>:<Empty title="No active projects" hint="Projects you belong to will show up here."/>}</Card>}

