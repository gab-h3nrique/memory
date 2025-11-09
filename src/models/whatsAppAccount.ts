import prisma from "../database/prisma";
import { WhatsAppAccountType } from "../types/whatsAppAccountType";

function model() {

    const query = prisma.whatsAppAccounts;

    return {

        query: query,

        find: async(input: string | number) => {

            if(!input) return null

            const data = await query.findFirst({

                where: {
                    OR: [
                        { id: String(input) }, 
                        { clientId: String(input) }, 
                        { number:String(input) }, 
                        { name:{ contains: String(input) } }, 
                        { webhookUrl:{ contains: String(input) } },
                    ],
                },

            })

            return data

        },

        get: async(input?: string) => {

            const data = await query.findMany({

                where: {
                    OR: [
                        { name:{ contains: String(input) } }, 
                        { number:{ contains: String(input) } }, 
                        { clientId: String(input) }, 
                        { webhookUrl:{ contains: String(input) } },
                    ],
                },
                orderBy: { id: 'desc'}

            }) || []

            return data

        },

        upsert: async(item: WhatsAppAccountType) => {

            const data = await query.upsert({
                where: {
                    id: item.id || ''
                },
                update: item,
                create: item,
            })

            return data
            
        },

        delete: async(id: string) => {

            const data = await query.delete({

                where: {
                    id: id
                },

            })

            return data

        },

        paginated: async(index: number, limit: number, input: any = null, startDate: any = '', endDate: any = '') => {

            const data = await query.findMany({

                where: {
                    OR: [
                        { name:{ contains: String(input) } }, 
                        { number:{ contains: String(input) } }, 
                        { clientId: String(input) }, 
                        { webhookUrl:{ contains: String(input) } },
                    ],
                    createdAt: {
                        gte: startDate !== '' ? new Date(startDate)  : undefined,
                        lte: endDate !== '' ? new Date(endDate) : undefined,
                    },
                },
                skip: index,
                take: limit,
                orderBy: { id: 'desc'}

            }) || []

            const total = await query.count({
                where: {
                    OR: [
                        { name:{ contains: String(input) } }, 
                        { number:{ contains: String(input) } }, 
                        { clientId: String(input) }, 
                        { webhookUrl:{ contains: String(input) } },
                    ],
                    createdAt: {
                        gte: startDate !== '' ? new Date(startDate)  : undefined,
                        lte: endDate !== '' ? new Date(endDate) : undefined,
                    },
                },
            }) || 0

            return { data, total }

        }

    }

}

export const WhatsAppAccountModel = model();