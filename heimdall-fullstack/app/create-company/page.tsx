'use client'
import {useState,useEffect} from 'react'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import {Building,ArrowLeft,Sun,Moon,Sparkles} from 'lucide-react'
import {useWs} from '@/lib/store'
import {Card} from '@/components/ui'

const slugify=(s:string)=>s
 .toLowerCase()
 .trim()
 .replace(/[^a-z0-9]+/g,'-')
 .replace(/^-+|-+$/g,'')

const SLUG_RE=/^[a-z0-9]+(?:-[a-z0-9]+)*$/

export default function CreateCompanyPage(){
 const {theme,toggleTheme,reload,ready,me}=useWs()
 const router=useRouter()

 const [name,setName]=useState('')
 const [slug,setSlug]=useState('')
 const [slugEdited,setSlugEdited]=useState(false)
 const [err,setErr]=useState<Record<string,string>>({})
 const [isSubmitting,setIsSubmitting]=useState(false)

 useEffect(()=>{
  if(ready&&!me){
   router.replace('/')
  }
 },[ready,me,router])

 const handleNameChange=(val:string)=>{
  setName(val)
  if(!slugEdited){
   setSlug(slugify(val))
  }
 }

 const handleSlugChange=(val:string)=>{
  setSlugEdited(true)
  setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g,''))
 }

 const handleSubmit=async(e:React.FormEvent)=>{
  e.preventDefault()
  const errors:Record<string,string>={}

  const trimmedName=name.trim()
  const trimmedSlug=slug.trim().toLowerCase()

  if(trimmedName.length<3||trimmedName.length>60){
   errors.name='Company name must be between 3 and 60 characters.'
  }

  if(trimmedSlug.length<3||trimmedSlug.length>40){
   errors.slug='Company handle must be between 3 and 40 characters.'
  }else if(!SLUG_RE.test(trimmedSlug)){
   errors.slug='Handle may only contain lowercase letters, numbers, and hyphens without consecutive or trailing dashes.'
  }

  setErr(errors)
  if(Object.keys(errors).length>0)return

  setIsSubmitting(true)
  try{
   const r=await fetch('/api/orgs',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name:trimmedName,slug:trimmedSlug})
   })
   const j=await r.json()

   if(!r.ok){
    setErr({form:j.error||'Failed to create organization.'})
   }else{
    await reload()
    router.replace('/workspace')
   }
  }catch{
   setErr({form:'Network error. Please try again.'})
  }finally{
   setIsSubmitting(false)
  }
 }

 return (
  <div className="min-h-screen bg-bg">
   {/* Header */}
   <header className="flex h-14 items-center justify-between border-b border-line bg-bg/90 px-4 backdrop-blur md:px-8">
    <div className="flex items-center gap-3">
     <Link href="/home" className="flex items-center gap-2 text-mute hover:text-ink">
      <ArrowLeft size={16}/>
      <span className="text-xs">Back to personal</span>
     </Link>
     <span className="text-mute">/</span>
     <img src="/logo-light.png" alt="HeimDall" className="h-7"/>
    </div>

    <button
     onClick={toggleTheme}
     aria-label="Toggle theme"
     className="rounded-md border border-line p-2 hover:bg-surface"
    >
     {theme==='dark'?<Sun size={15}/>:<Moon size={15}/>}
    </button>
   </header>

   <main className="mx-auto max-w-xl p-4 pt-12 md:p-8 md:pt-16">
    <div className="fade space-y-6">
     <div className="text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-xl bg-accent/10 text-accent">
       <Building size={24}/>
      </div>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Create your company</h1>
      <p className="mx-auto mt-1 max-w-sm text-xs text-mute">
       Establish the digital home of your organization. You will be assigned as Executive and can invite team members.
      </p>
     </div>

     <Card title="Company Information">
      <form onSubmit={handleSubmit} className="space-y-4">
       <div>
        <label htmlFor="company-name" className="block text-xs font-medium">
         Company Name <span className="text-bad">*</span>
        </label>
        <input
         id="company-name"
         className="field mt-1 w-full text-sm"
         placeholder="e.g. Acme Corporation"
         value={name}
         onChange={e=>handleNameChange(e.target.value)}
         maxLength={60}
         autoFocus
        />
        {err.name?(
         <p role="alert" className="mt-1 text-xs text-bad">{err.name}</p>
        ):(
         <p className="mt-1 text-[11px] text-mute">3 to 60 characters.</p>
        )}
       </div>

       <div>
        <label htmlFor="company-slug" className="block text-xs font-medium">
         Organization Handle (URL slug) <span className="text-bad">*</span>
        </label>
        <div className="mt-1 flex items-center rounded-md border border-line bg-surface px-2.5">
         <span className="text-xs text-mute">heimdall.app/</span>
         <input
          id="company-slug"
          className="w-full bg-transparent py-1.5 pl-1 text-sm outline-none"
          placeholder="acme-corp"
          value={slug}
          onChange={e=>handleSlugChange(e.target.value)}
          maxLength={40}
         />
        </div>
        {err.slug?(
         <p role="alert" className="mt-1 text-xs text-bad">{err.slug}</p>
        ):(
         <p className="mt-1 text-[11px] text-mute">
          Unique identifier: lowercase letters, numbers, and dashes.
         </p>
        )}
       </div>

       {err.form&&(
        <p role="alert" className="rounded-md border border-bad/30 bg-bad/10 p-2.5 text-xs text-bad">
         {err.form}
        </p>
       )}

       <div className="rounded-md border border-line bg-bg/50 p-3 text-xs">
        <div className="flex items-center gap-2 font-medium text-ink">
         <Sparkles size={14} className="text-accent"/>
         <span>Starter Plan Included</span>
        </div>
        <p className="mt-1 text-[11px] text-mute">
         Includes team task management, department boards, and initial company metrics.
        </p>
       </div>

       <div className="flex items-center justify-end gap-2 pt-2">
        <Link
         href="/home"
         className="rounded-md border border-line px-4 py-2 text-xs font-medium text-mute hover:bg-surface"
        >
         Cancel
        </Link>
        <button
         type="submit"
         disabled={isSubmitting}
         className="rounded-md bg-accent px-5 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:text-[#07101f]"
        >
         {isSubmitting?'Creating organization...':'Create Company'}
        </button>
       </div>
      </form>
     </Card>
    </div>
   </main>
  </div>
 )
}
