import {db} from '@/lib/db'
import {getContext,bad} from '@/lib/guard'

export const dynamic='force-dynamic'

export async function GET(){
 const ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 const {user,membership,org}=ctx

 const pendingInvites=user.email
  ? await db.invitation.findMany({
      where:{email:user.email.toLowerCase(),status:'PENDING'},
      include:{organization:{select:{name:true,slug:true}},invitedBy:{select:{name:true,email:true}}},
      orderBy:{createdAt:'desc'}
    })
  : []

 return Response.json({
  user:{
   id:user.id,
   name:user.name||user.email,
   email:user.email,
   title:user.title||'',
   city:user.city||'',
   joinedAt:user.joinedAt,
   image:user.image
  },
  membership:membership?{
   role:membership.role,
   organizationId:membership.organizationId,
   organizationName:org?.name,
   organizationSlug:org?.slug
  }:null,
  invitations:pendingInvites.map(i=>({
   id:i.id,
   token:i.token,
   organizationName:i.organization.name,
   organizationSlug:i.organization.slug,
   role:i.role,
   invitedBy:i.invitedBy?.name||i.invitedBy?.email||'Team lead',
   expiresAt:i.expiresAt
  }))
 })
}

export async function PATCH(req:Request){
 const ctx=await getContext();if(!ctx)return bad('Unauthorized',401)
 const b=await req.json().catch(()=>null);if(!b)return bad('Invalid JSON body',400)

 const data:any={}

 if(b.name!==undefined){
  const name=String(b.name).trim()
  if(name.length<2||name.length>60)return bad('Name must be between 2 and 60 characters',400)
  data.name=name
 }

 if(b.title!==undefined){
  data.title=String(b.title).trim().slice(0,100)
 }

 if(b.city!==undefined){
  data.city=String(b.city).trim().slice(0,60)
 }

 if(!Object.keys(data).length)return bad('No fields to update',400)

 const updated=await db.user.update({
  where:{id:ctx.user.id},
  data
 })

 return Response.json({
  id:updated.id,
  name:updated.name,
  email:updated.email,
  title:updated.title||'',
  city:updated.city||'',
  joinedAt:updated.joinedAt,
  image:updated.image
 })
}

