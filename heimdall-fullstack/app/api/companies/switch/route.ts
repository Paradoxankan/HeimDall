import {db} from '@/lib/db'
import {getMe,bad} from '@/lib/guard'

export async function POST(req:Request){
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 const b=await req.json().catch(()=>null);if(!b)return bad('Invalid JSON body',400)
 const {companyId}=b

 if(companyId===null){
  await db.user.update({where:{id:me.id},data:{activeCompanyId:null}})
  return Response.json({activeCompanyId:null,isPersonal:true})
 }

 if(typeof companyId!=='string'||!companyId){
  return bad('Invalid company ID',400)
 }

 const membership=me.memberships.find(m=>m.companyId===companyId)
 if(!membership)return bad('You are not a member of this company',403)

 await db.user.update({where:{id:me.id},data:{activeCompanyId:companyId}})
 return Response.json({activeCompanyId:companyId,isPersonal:false,role:membership.role})
}

