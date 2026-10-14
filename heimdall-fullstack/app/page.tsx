'use client'
import {useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {signIn} from 'next-auth/react'
import {Sun,Moon} from 'lucide-react'
import {useWs} from '@/lib/store'

export default function Landing(){
 const {me,workspace,ready,theme,toggleTheme}=useWs()
 const router=useRouter()

 useEffect(()=>{
  if(ready&&me){
   if(workspace?.activeCompany&&!workspace?.isPersonal){
    router.replace('/workspace')
   }else{
    router.replace('/home')
   }
  }
 },[ready,me,workspace,router])

 const btn="flex w-full items-center justify-center rounded-md border border-line bg-surface px-4 py-3 font-medium transition-colors hover:bg-accent/10"

 return (
  <div className="grid min-h-screen md:grid-cols-[1.1fr_1fr]">
   <section className="flex flex-col justify-between bg-[var(--side)] p-8 md:p-14">
    <img src="/logo-light.png" alt="HeimDall" className="h-24 w-fit md:h-32"/>
    <div className="py-12">
     <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
      Your personal workspace, ready to grow into your company's.
     </h1>
     <p className="mt-4 max-w-sm text-[#B9C4D8]">
      Sign in as an individual to organize tasks, documents, and priorities. Create a company or accept invitations to collaborate with your organization seamlessly.
     </p>
    </div>
    <p className="text-sm text-[#7F8CA6]">The Digital Home of Work.</p>
   </section>

   <section className="relative flex items-center p-8 md:p-14">
    <button onClick={toggleTheme} aria-label="Toggle theme" className="absolute right-5 top-5 rounded-md border border-line p-2 hover:bg-surface">
     {theme==='dark'?<Sun size={16}/>:<Moon size={16}/>}
    </button>
    <div className="fade w-full max-w-sm">
     <h2 className="text-xl font-semibold">Sign in to HeimDall</h2>
     <p className="mt-1 text-mute">
      Get started with your personal workspace or access your company.
     </p>
     <div className="mt-6 space-y-3">
      <button className={btn} onClick={()=>signIn('github',{callbackUrl:'/'})}>
       Continue with GitHub
      </button>
      <button className={btn} onClick={()=>signIn('google',{callbackUrl:'/'})}>
       Continue with Google
      </button>
     </div>
    </div>
   </section>
  </div>
 )
}
