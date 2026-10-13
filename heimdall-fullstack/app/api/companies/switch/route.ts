import {getMe,bad} from '@/lib/guard'

export async function POST(req:Request){
 const me=await getMe();if(!me)return bad('Unauthorized',401)
 const b=await req.json().catch(()=>null);if(!b)return bad('Invalid JSON body',400)
 const {companyId}=b

 if(companyId===null){
  return Response.json({activeCompanyId:null,isPersonal:true})
 }

 if(typeof companyId!=='string'||!companyId){
  return bad('Invalid organization ID',400)
 }

 if(!me.membership||me.membership.organizationId!==companyId){
  return bad('You are not a member of this organization',403)
 }

 return Response.json({activeCompanyId:companyId,isPersonal:false,role:me.membership.role})
}
