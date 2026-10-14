import {db} from '@/lib/db'
import {getContext,bad} from '@/lib/guard'

export const dynamic='force-dynamic'

export async function GET(){
 const ctx=await getContext()
 if(!ctx)return bad('Unauthorized',401)
 if(!ctx.membership||!ctx.org)return bad('Select an organization workspace first',400)
 const orgId=ctx.membership.organizationId

 const [members,invitations]=await Promise.all([
  db.membership.findMany({
   where:{organizationId:orgId},
   include:{
    user:{select:{id:true,name:true,email:true,title:true,city:true,joinedAt:true}},
    addedBy:{select:{name:true,email:true}},
    organization:{select:{createdById:true}}
   },
   orderBy:[
    {role:'asc'},
    {createdAt:'asc'}
   ]
  }),
  db.invitation.findMany({
   where:{organizationId:orgId,status:'PENDING'},
   include:{
    invitedBy:{select:{name:true,email:true}}
   },
   orderBy:{createdAt:'desc'}
  })
 ])

 // Filter or mark any expired pending invites
 const now=new Date()
 const validInvites=[]
 for(const inv of invitations){
  if(inv.expiresAt<now){
   await db.invitation.update({where:{id:inv.id},data:{status:'REVOKED'}})
  }else{
   validInvites.push(inv)
  }
 }

 return Response.json({
  members:members.map(m=>({
   id:m.id,
   userId:m.userId,
   name:m.user.name||m.user.email||'Member',
   email:m.user.email||'',
   role:m.role,
   title:m.user.title||'',
   city:m.user.city||'',
   joinedAt:m.createdAt,
   addedBy:m.addedBy?.name||m.addedBy?.email||null,
   isCreator:m.organization.createdById===m.userId
  })),
  invitations:validInvites.map(i=>({
   id:i.id,
   email:i.email,
   role:i.role,
   status:i.status,
   token:i.token,
   createdAt:i.createdAt,
   expiresAt:i.expiresAt,
   invitedBy:i.invitedBy?.name||i.invitedBy?.email||'Team lead'
  }))
 })
}

