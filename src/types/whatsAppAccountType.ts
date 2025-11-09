
export interface WhatsAppAccountType {

    id?: string,

    name: string,
    number: string,
    clientId: string,
    status?: string,
    webhookUrl?: string,

    updatedAt?: string,
    createdAt?: string,
}

export const EMPTY_WHATS_APP_ACCOUNT = {

    id: undefined,

    name: '',
    number: '',
    clientId: '',
    status: '',
    webhookUrl: '',

    updatedAt: undefined,
    createdAt: undefined,

}

export interface WhatsAppUserType {

    id?: number,
    role: number,

    userId: string,
    whatsappAccountId: string,

}

export const EMPTY_WHATS_APP_USER: WhatsAppUserType = {

    id: undefined,
    role: 0,

    userId: '',
    whatsappAccountId: '',

}
