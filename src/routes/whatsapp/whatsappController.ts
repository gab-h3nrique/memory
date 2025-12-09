import { UserModel } from "../../models/userModel";
import { WhatsAppAccountModel } from "../../models/whatsAppAccount";
import { WhatsAppUserModel } from "../../models/whatsAppUser";
import { WhatsAppAccountType, WhatsAppUserType } from "../../types/whatsAppAccountType";
import Whatsapp from "../../whatsapp/whatsapp";
import { Auth } from "../routes";
import QRCode from "qrcode"

// 200 OK
// 201 Created
// 202 Accepted
// 203 Non-Authoritative Information
// 204 No Content
// 205 Reset Content
// 206 Partial Content

// 400 Bad Request
// 401 Unauthorized
// 402 Payment Required
// 403 Forbidden
// 404 Not Found
// 405 Method Not Allowed
// 406 Not Acceptable
// 407 Proxy Authentication Required
// 408 Request Timeout
// 429 Too Many Requests
// 500 Internal Server Error
// 501 Not Implemented
// 502 Bad Gateway
// 503 Service Unavailable

function factory() {

    return {
        
        get: async(req: any, res: any) => {

            const { query } = req;

            const id = query.id ? String(query.id) : null;
            const page = query.page ? Number(query.page) : null;
            const limit = query.limit ? Number(query.limit) : null;
            const input = query.input ? String(query.input) : '';
            const startDate = query.startDate ? String(query.startDate) : '';
            const endDate = query.endDate ? String(query.endDate) : '';

            if(id) return res.status(200).json({ success: true, data: await WhatsAppAccountModel.find(Number(id)), message: '' });

            if(!page || !limit) return res.status(200).json({ success: true, data: await WhatsAppAccountModel.get(input), message: '' });

            const index = (Number(page) - 1) * Number(limit)
        
            const { data, total } = await WhatsAppAccountModel.paginated(index, Number(limit), (input || ''), startDate, endDate)
        
            return res.status(200).json({ success: true, data: null, message: 'hehe' });
        
        },

        post: async(req: any, res: any) => {

            const { body } = req

            const id = body.id ? String(body.id) : ''
            const name = body.name ? String(body.name) : ''
            const number = body.number ? String(body.number) : ''
            const webhookUrl = body.webhookUrl ? String(body.webhookUrl) : ''

            if(!name) return res.status(400).json({ success: false, data: null, message: 'name proprety is required.' })

            if(!number) return res.status(400).json({ success: false, data: null, message: 'number proprety is required.' })

            const auth = await Auth(req)

            if(!auth.user) return res.status(401).json({ success: false, data: null, message: 'Unauthorized.' })

            const user = await UserModel.find(auth.user.id)

            if(!user) return res.status(404).json({ success: false, data: null, message: 'User not found.' })

            const foundId = await WhatsAppAccountModel.find(id)

            if(foundId) {

                const foundWhatsAppUser = await WhatsAppUserModel.query.findFirst({

                    where: {
                        userId: String(user.id),
                        whatsappAccountId: String(foundId.id),
                    }

                })

                if(!foundWhatsAppUser) return res.status(404).json({ success: false, data: null, message: 'User dont have access for this whatsapp account.' })

                if(foundWhatsAppUser.role > 200) return res.status(403).json({ success: false, data: null, message: 'User dont have permission to update whatsapp account.' })

                const newAccount: WhatsAppAccountType = { id, name, number, clientId: foundId.clientId, status: foundId.status, webhookUrl }
    
                const { clientId:ci, ...rest} = await WhatsAppAccountModel.upsert(newAccount)

                // await Whatsapp.setAccount(id, newAccount)
                Whatsapp.updateAccount(newAccount)
    
                return res.status(200).json({ success: true, data: rest, message: '' })

            }

            // new whatsapp accounnt

            const foundNumber = await WhatsAppAccountModel.find(number)

            if(foundNumber) return res.status(400).json({ success: false, data: null, message: 'number already exists.' })

            const newAccount: WhatsAppAccountType = { name, number, clientId: crypto.randomUUID(), status: 'pendingQr', webhookUrl }

            const { clientId:newCi, ...newWhatsAppAccount} = await WhatsAppAccountModel.upsert(newAccount)

            if(!newWhatsAppAccount.id) return res.status(500).json({ success: false, data: null, message: 'Error creating WhatsApp account.' })

            const whatsappAccount: WhatsAppUserType = { role: 100, userId: user.id, whatsappAccountId: newWhatsAppAccount.id }

            const account = await WhatsAppUserModel.upsert(whatsappAccount)

            if(account) {

                // await Whatsapp.create({ ...newWhatsAppAccount, clientId: newCi } as any)
                await Whatsapp.init(newWhatsAppAccount.id)

                return res.status(200).json({ success: true, data: newWhatsAppAccount, message: '' })

            }

            await WhatsAppAccountModel.delete(newWhatsAppAccount.id)

            await Whatsapp.delete(newWhatsAppAccount.id)

            return res.status(500).json({ success: false, data: null, message: 'Error creating WhatsApp account user.' })

        },

        delete: async(req: any, res: any) => {

            const { body } = req

            const id = body.id ? String(body.id) : undefined
    
            if(!id) return res.status(400).json({ success: false, data: null, message: 'id is required' })

            const auth = await Auth(req)

            if(!auth.user) return res.status(401).json({ success: false, data: null, message: 'Unauthorized.' })

            const user = await UserModel.find(auth.user.id)

            if(!user) return res.status(404).json({ success: false, data: null, message: 'User not found.' })

            const foundId = await WhatsAppAccountModel.find(String(id))

            if(!foundId) return res.status(404).json({ success: false, data: null, message: 'WhatsApp account not found.' })

            const foundWhatsAppUser = await WhatsAppUserModel.query.findFirst({

                where: {
                    userId: String(user.id),
                    whatsappAccountId: String(foundId.id),
                }

            })

            if(foundWhatsAppUser.role > 100) return res.status(403).json({ success: false, data: null, message: 'User dont have permission to update whatsapp account.' })

            await WhatsAppAccountModel.delete(id)

            await Whatsapp.delete(id)

            return res.status(200).json({ success: true, data: null, message: 'Data deleted successfully.' })
        
        },

        sendMessage: async(req: any, res: any) => {

            const { body } = req

            const from = body.from ? String(body.from) : ''
            const to = body.to ? String(body.to) : ''
            const message = body.message ? String(body.message) : ''
    
            if(!from) return res.status(400).json({ success: false, data: null, message: 'from to proprety is required' })

            if(!to) return res.status(400).json({ success: false, data: null, message: 'to proprety is required.' })

            if(!message) return res.status(400).json({ success: false, data: null, message: 'message proprety is required.' })

            const auth = await Auth(req)

            if(!auth.user) return res.status(401).json({ success: false, data: null, message: 'Unauthorized.' })

            const user = await UserModel.find(auth.user.id)

            if(!user) return res.status(404).json({ success: false, data: null, message: 'User not found.' })

            const foundId = await WhatsAppAccountModel.find(from)

            if(!foundId) return res.status(404).json({ success: false, data: null, message: 'WhatsApp account not found.' })

            const foundWhatsAppUser = await WhatsAppUserModel.query.findFirst({

                where: {
                    userId: String(user.id),
                    whatsappAccountId: String(foundId.id),
                }

            })

            if(foundWhatsAppUser.role > 100) return res.status(403).json({ success: false, data: null, message: 'User dont have permission to update whatsapp account.' })

            const result = await Whatsapp.send(foundId.id, to, message)

            return res.status(200).json({ success: true, data: result, message: '' })
        
        },

        qrCode: async(req: any, res: any) => {

            const { query } = req

            const account = query.account ? String(query.account) : ''
    
            if(!account) return res.status(400).json({ success: false, data: null, message: 'account number proprety is required' })

            const auth = await Auth(req)

            if(!auth.user) return res.status(401).json({ success: false, data: null, message: 'Unauthorized.' })

            const user = await UserModel.find(auth.user.id)

            if(!user) return res.status(404).json({ success: false, data: null, message: 'User not found.' })

            const foundId = await WhatsAppAccountModel.find(account)

            if(!foundId) return res.status(404).json({ success: false, data: null, message: 'WhatsApp account not found.' })

            const foundWhatsAppUser = await WhatsAppUserModel.query.findFirst({

                where: {
                    userId: String(user.id),
                    whatsappAccountId: String(foundId.id),
                }

            })

            if(foundWhatsAppUser.role > 100) return res.status(403).json({ success: false, data: null, message: 'User dont have permission to update whatsapp account.' })

            // return res.status(200).json({ success: true, data: await Whatsapp.clients, message: '' })

            // const base64 = await Whatsapp.qrCode(foundId.id) || '' as any

            // const [meta, data] = base64.split(',')

            // const mime = meta.replace(/^data:/, '').replace(/;base64$/, '')

            // res.setHeader('Content-Type', mime)

            // res.setHeader('Content-Length', Buffer.byteLength(data, 'base64'))

            // return res.status(200).end(Buffer.from(data, 'base64'))

            // return res.status(200).json({ success: true, data: result, message: '' })

             const qrText = await Whatsapp.qrCode(foundId.id)

            // converte o texto do QR em imagem PNG
            const pngBuffer = await QRCode.toBuffer(qrText)

            res.setHeader("Content-Type", "image/png")
            
            res.setHeader("Content-Length", pngBuffer.length)

            return res.status(200).end(pngBuffer)
        
        },
    
    }

}

const WhaatsappController = factory()

export default WhaatsappController
