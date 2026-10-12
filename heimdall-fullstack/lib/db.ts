import {PrismaClient} from '@prisma/client'
const g=globalThis as any
export const db:PrismaClient=g.__db||new PrismaClient()
if(process.env.NODE_ENV!=='production')g.__db=db
