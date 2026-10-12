import {auth} from '@/auth'
import {db} from './db'
export async function getMe(){const s=await auth();const id=(s?.user as any)?.id;return id?db.user.findUnique({where:{id}}):null}
export const bad=(m:string,status:number)=>Response.json({error:m},{status})
