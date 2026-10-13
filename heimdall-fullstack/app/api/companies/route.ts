import {db} from '@/lib/db'
import {getMe,bad} from '@/lib/guard'

export const dynamic='force-dynamic'

const slugify=(s:string)=>s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')

export async function GET(){
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 const pendingInvites=me.email
  ? await db.invitation.findMany({
      where:{email:me.email,status:'PENDING'},
      include:{company:true,invitedBy:{select:{name:true,email:true}}},
      orderBy:{createdAt:'desc'}
    })
  : []
 return Response.json({
  activeCompanyId:me.activeCompanyId,
  companies:me.memberships.map(m=>({
   id:m.company.id,
   name:m.company.name,
   slug:m.company.slug,
   role:m.role,
   title:m.title,
   dept:m.dept,
   joinedAt:m.joinedAt
  })),
  invitations:pendingInvites.map(i=>({
   id:i.id,
   token:i.token,
   companyName:i.company.name,
   companySlug:i.company.slug,
   role:i.role,
   invitedBy:i.invitedBy?.name||i.invitedBy?.email||'Team lead',
   expiresAt:i.expiresAt
  }))
 })
}

export async function POST(req:Request){
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 const b=await req.json().catch(()=>null);if(!b)return bad('Invalid JSON body',400)
 const name=String(b.name||'').trim()
 if(name.length<2||name.length>60)return bad('Company name must be between 2 and 60 characters',400)

 let slug=b.slug?slugify(String(b.slug)):slugify(name)
 if(slug.length<2||slug.length>50)slug=slugify(name)+'-'+Math.random().toString(36).slice(2,6)
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return bad('Invalid company slug format',400)

 const exists=await db.company.findUnique({where:{slug}})
 if(exists)return bad('A company with this handle already exists',409)

 const result=await db.$transaction(async tx=>{
  const company=await tx.company.create({data:{name,slug}})
  const membership=await tx.companyMember.create({
   data:{
    companyId:company.id,
    userId:me.id,
    role:'EXECUTIVE',
    title:b.title?String(b.title).slice(0,60):'Founder & Executive'
   }
  })
  await tx.user.update({
   where:{id:me.id},
   data:{activeCompanyId:company.id}
  })
  return {company,membership}
 })

 return Response.json(result,{status:201})
}

