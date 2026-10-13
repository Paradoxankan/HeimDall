import {db} from '@/lib/db'
import {getMe,bad} from '@/lib/guard'

export const dynamic='force-dynamic'

const slugify=(s:string)=>s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')

export async function GET(){
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 const pendingInvites=me.email
  ? await db.invitation.findMany({
      where:{email:me.email.toLowerCase(),status:'PENDING'},
      include:{organization:true,invitedBy:{select:{name:true,email:true}}},
      orderBy:{createdAt:'desc'}
    })
  : []

 const currentOrg=me.membership?.organization
 return Response.json({
  activeCompanyId:currentOrg?.id||null,
  companies:currentOrg?[{
   id:currentOrg.id,
   name:currentOrg.name,
   slug:currentOrg.slug,
   role:me.membership?.role,
   title:me.title,
   joinedAt:me.membership?.createdAt
  }]:[],
  invitations:pendingInvites.map(i=>({
   id:i.id,
   token:i.token,
   companyName:i.organization.name,
   companySlug:i.organization.slug,
   role:i.role,
   invitedBy:i.invitedBy?.name||i.invitedBy?.email||'Team lead',
   expiresAt:i.expiresAt
  }))
 })
}

export async function POST(req:Request){
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 if(me.membership)return bad('A user may belong to only one organization at a time',409)

 const b=await req.json().catch(()=>null);if(!b)return bad('Invalid JSON body',400)
 const name=String(b.name||'').trim()
 if(name.length<2||name.length>60)return bad('Organization name must be between 2 and 60 characters',400)

 let slug=b.slug?slugify(String(b.slug)):slugify(name)
 if(slug.length<2||slug.length>50)slug=slugify(name)+'-'+Math.random().toString(36).slice(2,6)
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return bad('Invalid organization handle format',400)

 const exists=await db.organization.findUnique({where:{slug}})
 if(exists)return bad('An organization with this handle already exists',409)

 const result=await db.$transaction(async tx=>{
  const organization=await tx.organization.create({
   data:{
    name,
    slug,
    createdById:me.id,
    plan:'STARTER'
   }
  })
  const membership=await tx.membership.create({
   data:{
    organizationId:organization.id,
    userId:me.id,
    role:'EXECUTIVE'
   }
  })
  if(b.title&&String(b.title).trim()){
   await tx.user.update({where:{id:me.id},data:{title:String(b.title).trim().slice(0,60)}})
  }
  return {company:organization,membership}
 })

 return Response.json(result,{status:201})
}
