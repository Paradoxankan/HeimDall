'use client'
import {useState,useEffect,useRef,DragEvent,ChangeEvent} from 'react'
import {
  UploadCloud,
  FileText,
  Check,
  Trash2,
  AlertCircle,
  Sparkles,
  Calendar,
  Building2,
  ArrowRight,
  Loader2
} from 'lucide-react'
import {useWs,due,fmt} from '@/lib/store'
import {Card,Chip,Empty,Head} from './ui'

export function ContractsView(){
  const {reload}=useWs()
  const [contracts,setContracts]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [uploading,setUploading]=useState(false)
  const [error,setError]=useState<string|null>(null)
  const [dragActive,setDragActive]=useState(false)
  const [busy,setBusy]=useState<Record<string,boolean>>({})
  const fileInputRef=useRef<HTMLInputElement>(null)

  const fetchContracts=async()=>{
    try{
      const res=await fetch('/api/contracts',{cache:'no-store'})
      if(!res.ok)throw new Error('Failed to load contracts')
      const data=await res.json()
      setContracts(Array.isArray(data)?data:[])
    }catch(err:any){
      setError(err.message||'Could not load contracts')
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{
    fetchContracts()
  },[])

  const handleFileProcess=async(file:File)=>{
    setError(null)

    // Client-side validations
    const fileName=file.name.toLowerCase()
    const isAllowedExt=fileName.endsWith('.pdf')||fileName.endsWith('.txt')||fileName.endsWith('.md')
    if(!isAllowedExt){
      setError('Invalid file type: Please upload a PDF (.pdf), Text (.txt), or Markdown (.md) document.')
      return
    }

    if(file.size>3.5*1024*1024){
      setError('File size exceeds the 3.5 MB limit. Please upload a smaller document.')
      return
    }

    setUploading(true)
    const formData=new FormData()
    formData.append('file',file)

    try{
      const res=await fetch('/api/contracts/analyze',{
        method:'POST',
        body:formData
      })
      const json=await res.json()
      if(!res.ok){
        throw new Error(json.error||'Failed to analyze contract.')
      }

      await fetchContracts()
      await reload()
    }catch(err:any){
      setError(err.message||'Contract analysis failed. Please try again.')
    }finally{
      setUploading(false)
      if(fileInputRef.current)fileInputRef.current.value=''
    }
  }

  const handleDrag=(e:DragEvent)=>{
    e.preventDefault()
    e.stopPropagation()
    if(e.type==='dragenter'||e.type==='dragover'){
      setDragActive(true)
    }else if(e.type==='dragleave'){
      setDragActive(false)
    }
  }

  const handleDrop=(e:DragEvent)=>{
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if(uploading)return

    if(e.dataTransfer.files&&e.dataTransfer.files[0]){
      handleFileProcess(e.dataTransfer.files[0])
    }
  }

  const handleFileChange=(e:ChangeEvent<HTMLInputElement>)=>{
    if(e.target.files&&e.target.files[0]){
      handleFileProcess(e.target.files[0])
    }
  }

  const handleCreateTask=async(contractId:string,obligationId:string)=>{
    setBusy(b=>({...b,[obligationId]:true}))
    try{
      const res=await fetch(`/api/contracts/${contractId}/tasks`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({obligationIds:[obligationId]})
      })
      const json=await res.json()
      if(!res.ok)throw new Error(json.error||'Failed to create task')
      await fetchContracts()
      await reload()
    }catch(err:any){
      setError(err.message||'Failed to convert obligation into task')
    }finally{
      setBusy(b=>({...b,[obligationId]:false}))
    }
  }

  const handleCreateAllTasks=async(contractId:string)=>{
    setBusy(b=>({...b,[contractId]:true}))
    try{
      const res=await fetch(`/api/contracts/${contractId}/tasks`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({})
      })
      const json=await res.json()
      if(!res.ok)throw new Error(json.error||'Failed to create tasks')
      await fetchContracts()
      await reload()
    }catch(err:any){
      setError(err.message||'Failed to convert obligations into tasks')
    }finally{
      setBusy(b=>({...b,[contractId]:false}))
    }
  }

  const handleDeleteContract=async(contractId:string,name:string)=>{
    if(!window.confirm(`Are you sure you want to delete "${name}"? This will also remove its tracked obligations.`)){
      return
    }
    setBusy(b=>({...b,['del-'+contractId]:true}))
    try{
      const res=await fetch(`/api/contracts/${contractId}`,{
        method:'DELETE'
      })
      const json=await res.json()
      if(!res.ok)throw new Error(json.error||'Failed to delete contract')
      await fetchContracts()
      await reload()
    }catch(err:any){
      setError(err.message||'Failed to delete contract')
    }finally{
      setBusy(b=>({...b,['del-'+contractId]:false}))
    }
  }

  const kindTone:Record<string,string>={
    payment:'warn',
    deliverable:'accent',
    renewal:'bad',
    compliance:'ok',
    notice:'warn',
    other:'mute'
  }

  return (
    <div className="fade space-y-6">
      <Head
        title="AI Contract Intelligence"
        sub="Upload contracts to automatically extract summaries, actionable obligations, and deadlines into company tasks."
      />

      {error&&(
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-md border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0"/>
            <span>{error}</span>
          </div>
          <button
            onClick={()=>setError(null)}
            className="text-xs font-semibold hover:underline"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload & AI Analysis Area */}
      <section aria-labelledby="upload-heading">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragActive
              ? 'border-accent bg-accent/10'
              : 'border-line bg-surface hover:border-accent/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            id="contract-file-input"
            aria-label="Select contract document to analyze"
            accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />

          {uploading?(
            <div className="w-full max-w-md space-y-4 py-4" aria-live="polite">
              <div className="flex items-center justify-center gap-2 text-accent">
                <Sparkles size={22} className="animate-spin text-accent"/>
                <span className="font-semibold text-ink">Analyzing contract with HeimDall AI...</span>
              </div>
              <p className="text-xs text-mute">
                Extracting legal clauses, counterparty data, and actionable deadlines. This usually takes 10–25 seconds.
              </p>
              {/* Shimmer skeleton */}
              <div className="space-y-2.5 rounded-md border border-line bg-surface p-3">
                <div className="h-2.5 w-full animate-pulse rounded bg-accent/20"/>
                <div className="h-2.5 w-4/5 animate-pulse rounded bg-accent/20"/>
                <div className="h-2.5 w-2/3 animate-pulse rounded bg-accent/20"/>
              </div>
            </div>
          ):(
            <div className="space-y-3">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent/10 text-accent">
                <UploadCloud size={24}/>
              </div>
              <div>
                <p id="upload-heading" className="font-medium text-ink">
                  Drag and drop your contract here, or{' '}
                  <button
                    type="button"
                    onClick={()=>fileInputRef.current?.click()}
                    className="font-semibold text-accent hover:underline focus-visible:outline-none"
                  >
                    browse files
                  </button>
                </p>
                <p className="mt-1 text-xs text-mute">
                  Supports PDF, TXT, or MD up to 3.5 MB.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Contract List */}
      <section aria-labelledby="contracts-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="contracts-heading" className="text-lg font-semibold text-ink">
            Analyzed Contracts ({contracts.length})
          </h2>
        </div>

        {loading?(
          <div className="space-y-4">
            {[1,2].map(n=>(
              <div key={n} className="rounded-md border border-line bg-surface p-6 animate-pulse space-y-3">
                <div className="h-5 w-1/3 rounded bg-line"/>
                <div className="h-4 w-2/3 rounded bg-line"/>
                <div className="h-20 w-full rounded bg-line/60"/>
              </div>
            ))}
          </div>
        ):contracts.length===0?(
          <Empty
            dashed
            title="No contracts analyzed yet"
            hint="Upload your vendor agreements, master service agreements, or leases above to turn obligations into tracked tasks."
          />
        ):(
          <div className="space-y-6">
            {contracts.map(contract=>{
              const pendingCount=contract.obligations?.filter((o:any)=>!o.taskId).length||0
              const totalCount=contract.obligations?.length||0
              const isDeleting=!!busy['del-'+contract.id]
              const isBatchCreating=!!busy[contract.id]

              return (
                <Card
                  key={contract.id}
                  title={contract.name}
                  action={
                    <div className="flex flex-wrap items-center gap-2">
                      {pendingCount>0&&(
                        <button
                          onClick={()=>handleCreateAllTasks(contract.id)}
                          disabled={isBatchCreating}
                          className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:text-[#07101f]"
                          aria-label={`Create tasks for all ${pendingCount} pending obligations`}
                        >
                          {isBatchCreating?<Loader2 size={13} className="animate-spin"/>:<Plus size={13}/>}
                          <span>{isBatchCreating?'Creating...':`Create tasks for all (${pendingCount})`}</span>
                        </button>
                      )}
                      <button
                        onClick={()=>handleDeleteContract(contract.id,contract.name)}
                        disabled={isDeleting}
                        className="flex items-center gap-1 rounded-md border border-line p-1.5 text-xs text-mute transition-colors hover:border-bad/40 hover:text-bad disabled:opacity-50"
                        title="Delete contract"
                        aria-label={`Delete contract ${contract.name}`}
                      >
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  }
                >
                  <div className="space-y-4">
                    {/* Header meta */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-mute">
                      {contract.party&&(
                        <span className="flex items-center gap-1">
                          <Building2 size={14} className="text-accent"/>
                          <span>Counterparty: <b className="text-ink">{contract.party}</b></span>
                        </span>
                      )}
                      {contract.due&&(
                        <span className="flex items-center gap-1">
                          <Calendar size={14} className="text-accent"/>
                          <span>Next key date: <b className="text-ink">{fmt(contract.due.slice(0,10))}</b></span>
                        </span>
                      )}
                      <span>Uploaded {fmt(contract.createdAt.slice(0,10))}</span>
                    </div>

                    {/* AI Summary */}
                    {(contract.summary||contract.note)&&(
                      <div className="rounded-md border border-line bg-surface p-3 text-xs leading-relaxed text-ink/90">
                        <span className="font-semibold text-accent">Summary: </span>
                        <span>{contract.summary||contract.note}</span>
                      </div>
                    )}

                    {/* Obligations Table */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-xs font-semibold tracking-wider text-mute uppercase">
                          Actionable Obligations ({totalCount})
                        </h4>
                      </div>

                      {totalCount===0?(
                        <p className="text-xs text-mute">No specific obligations extracted for this document.</p>
                      ):(
                        <div className="-mx-4 -mb-4 overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="border-t border-b border-line bg-surface">
                              <tr>
                                <th className="px-4 py-2 font-medium text-mute">Obligation</th>
                                <th className="px-3 py-2 font-medium text-mute">Party</th>
                                <th className="px-3 py-2 font-medium text-mute">Category</th>
                                <th className="px-3 py-2 font-medium text-mute">Deadline</th>
                                <th className="px-3 py-2 font-medium text-mute">Priority</th>
                                <th className="px-4 py-2 text-right font-medium text-mute">Task status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                              {contract.obligations.map((ob:any)=>{
                                const isItemBusy=!!busy[ob.id]
                                const [dText,dTone]=ob.due?due(ob.due.slice(0,10)):['No deadline','mute']

                                return (
                                  <tr key={ob.id} className="hover:bg-white/5">
                                    <td className="max-w-xs px-4 py-3 font-medium text-ink">
                                      {ob.text}
                                    </td>
                                    <td className="px-3 py-3 capitalize text-mute">
                                      <Chip tone="mute">
                                        {ob.owner==='us'?'Our team':ob.owner==='counterparty'?'Counterparty':'Both'}
                                      </Chip>
                                    </td>
                                    <td className="px-3 py-3">
                                      <Chip tone={kindTone[ob.kind]||'mute'}>
                                        {ob.kind}
                                      </Chip>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                      {ob.due?(
                                        <Chip tone={dTone as string}>{dText}</Chip>
                                      ):(
                                        <span className="text-mute">-</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-3">
                                      <Chip tone={ob.priority==='high'?'bad':ob.priority==='medium'?'warn':'ok'}>
                                        {ob.priority}
                                      </Chip>
                                    </td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                      {ob.taskId?(
                                        <Chip tone="ok">
                                          <Check size={12} className="mr-1"/> Task created
                                        </Chip>
                                      ):(
                                        <button
                                          onClick={()=>handleCreateTask(contract.id,ob.id)}
                                          disabled={isItemBusy}
                                          className="inline-flex items-center gap-1 rounded border border-line px-2.5 py-1 text-xs font-medium text-accent hover:border-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
                                          aria-label={`Create task for obligation: ${ob.text.slice(0,30)}`}
                                        >
                                          {isItemBusy?(
                                            <Loader2 size={12} className="animate-spin"/>
                                          ):(
                                            <ArrowRight size={12}/>
                                          )}
                                          <span>{isItemBusy?'Creating...':'Create task'}</span>
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
