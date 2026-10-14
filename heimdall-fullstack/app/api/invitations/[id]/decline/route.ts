import {db} from '@/lib/db'
import {getContext,bad} from '@/lib/guard'

export const dynamic='force-dynamic'

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params
 const ctx=await getContext()
 if(!ctx)return bad('Unauthorized',401)
 const {user}=ctx

 const invite=await db.invitation.findFirst({
  where:{OR:[{id},{token:id}]}
 })

 if(!invite){
  return bad('Invitation not found',404)
 }

 if(!user.email||invite.email.toLowerCase()!==user.email.toLowerCase()){
  return bad(`Forbidden: You can only decline invitations addressed to your email address`,403)
 }

 if(invite.status!=='PENDING'){
  return bad(`This invitation has already been ${invite.status.toLowerCase()}`,400)
 }

 await db.invitation.update({
  where:{id:invite.id},
  data:{status:'DECLINED'}
 })

 return Response.json({success:true,status:'DECLINED'})
}

