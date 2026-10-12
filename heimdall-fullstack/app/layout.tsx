import './globals.css'
import {Onest} from 'next/font/google'
import {WorkspaceProvider} from '@/lib/store'
const f=Onest({subsets:['latin'],variable:'--font-onest'})
export const metadata={title:'HeimDall — Enterprise Workspace',description:'Unified AI-grounded company intelligence and management platform',icons:{icon:'/logo-mark.png'}}
const init="try{var t=localStorage.getItem('hd-theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light')}catch(e){}"
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={f.variable} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:init}}/></head><body className="font-sans antialiased" suppressHydrationWarning><WorkspaceProvider>{children}</WorkspaceProvider></body></html>}
