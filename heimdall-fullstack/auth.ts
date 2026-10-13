import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import {PrismaAdapter} from '@auth/prisma-adapter'
import {db} from '@/lib/db'

export const {handlers,auth,signIn,signOut}=NextAuth({
 adapter:PrismaAdapter(db),
 session:{strategy:'jwt'},
 providers:[
  GitHub({allowDangerousEmailAccountLinking:true}),
  Google({allowDangerousEmailAccountLinking:true})
 ],
 callbacks:{
  jwt({token,user}){
   if(user)token.uid=user.id
   return token
  },
  session({session,token}){
   (session.user as any).id=token.uid
   return session
  }
 }
})
