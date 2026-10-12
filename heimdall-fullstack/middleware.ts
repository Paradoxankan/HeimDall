import {NextResponse} from 'next/server'
import type {NextRequest} from 'next/server'
// Redirects visitors without a session cookie before the page renders.
// Real verification happens in every API route (lib/guard.ts).
export function middleware(req:NextRequest){
 const c=req.cookies
 if(c.has('authjs.session-token')||c.has('__Secure-authjs.session-token'))return NextResponse.next()
 return NextResponse.redirect(new URL('/',req.url))}
export const config={matcher:['/workspace/:path*']}
