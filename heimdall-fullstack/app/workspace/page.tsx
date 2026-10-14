'use client'
import {useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {useWs} from '@/lib/store'
import Shell from '@/components/Shell'
import {Employee} from '@/components/dashboards/Employee'
import {Manager} from '@/components/dashboards/Manager'
import {HR} from '@/components/dashboards/HR'
import {Executive} from '@/components/dashboards/Executive'

export default function Workspace(){
 const {role,ready,me,workspace}=useWs()
 const router=useRouter()

 useEffect(()=>{
  if(ready){
   if(!me)router.replace('/')
   else if(!workspace?.companies?.length||workspace?.isPersonal||!workspace?.activeCompany)router.replace('/home')
  }
 },[ready,me,workspace,router])

 if(!ready||!me||!role)return <div className="grid min-h-screen place-items-center"><div className="h-2.5 w-32 animate-pulse rounded bg-line"/></div>
 const V:any={employee:Employee,manager:Manager,hr:HR,executive:Executive}[role]||Employee
 return <Shell><V/></Shell>
}
