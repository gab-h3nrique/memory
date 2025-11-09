import prisma from "../database/prisma";
import { WhatsAppUserType } from "../types/whatsAppAccountType";

function model() {

    const query = prisma.whatsAppUser;

    return {

        query: query,

        find: async(input: string | number) => {

            if(!input) return null

            const data = await query.findFirst({

                where: {
                    OR: [
                        { id: Number(input) }, 
                        { role: Number(input) }, 
                        { userId: String(input) }, 
                        { whatsappAccountId: String(input) }, 
                    ],
                },

            })

            return data

        },

        findByUserId: async(input: string | number) => {

            if(!input) return null

            const data = await query.findFirst({

                where: {
                    userId: String(input)
                },

            })

            return data

        },

        get: async(input?: string) => {

            const data = await query.findMany({

                where: {
                    OR: [
                        { role: Number(input) }, 
                        { userId: String(input) }, 
                        { whatsappAccountId: String(input) }, 
                    ],
                },
                orderBy: { id: 'desc'}

            }) || []

            return data

        },

        upsert: async(item: WhatsAppUserType) => {

            const data = await query.upsert({
                where: {
                    id: item.id || -1
                },
                update: item,
                create: item,
            })

            return data
            
        },

        delete: async(id: number) => {

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
                        { role: Number(input) }, 
                        { userId: String(input) }, 
                        { whatsappAccountId: String(input) }, 
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
                        { role: Number(input) }, 
                        { userId: String(input) }, 
                        { whatsappAccountId: String(input) }, 
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

export const WhatsAppUserModel = model();