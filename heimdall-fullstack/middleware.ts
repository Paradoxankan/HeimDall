import {NextResponse} from 'next/server'
import type {NextRequest} from 'next/server'

// Protects authenticated workspace and personal home routes.
export function middleware(req:NextRequest){
 const c=req.cookies
 const hasSession=c.has('authjs.session-token')||c.has('__Secure-authjs.session-token')
 if(hasSession)return NextResponse.next()
 return NextResponse.redirect(new URL('/',req.url))
}

export const config={matcher:['/workspace/:path*','/home/:path*']}
