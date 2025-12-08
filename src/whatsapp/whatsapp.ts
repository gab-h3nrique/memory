import { Client, LocalAuth, Message } from "whatsapp-web.js"

import fs from "fs"
import { WhatsAppAccountType } from "../types/whatsAppAccountType";
import { WhatsAppAccountModel } from "../models/whatsAppAccount";
import { FailType } from "../types/failType";
import { FailModel } from "../models/failModel";

// window.WWebJS.getContact = async contactId => {
//     const wid = window.Store.WidFactory.createWid(contactId);
//     let contact = await window.Store.Contact.find(wid);
//     if (contact.id._serialized.endsWith('@lid')) {
//         contact.id = contact.phoneNumber;
//     }
//     const bizProfile = await window.Store.BusinessProfile.fetchBizProfile(wid);
//     bizProfile.profileOptions && (contact.businessProfile = bizProfile);
//     return window.WWebJS.getContactModel(contact);
// };

const PUPPETEER = {
  headless: true,
  executablePath: process.env.CHROME_PATH || undefined,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
  ]
}

interface IClient {

  account: WhatsAppAccountType,
  client: Client,
  initialized?: boolean
  initializingPromise?: Promise<void> | null

}

function factory() {

  const formatNumber = (number: string) => number.includes("@c.us") ? number : `${number}@c.us`

  const CLIENTS = new Map<string, IClient>()

  return {

    get clients() {

      return Array.from(CLIENTS.values())

    },

    set clients(value: IClient[]) {

      value.forEach(v => CLIENTS.set(v.account.id, v))
      
    },

    async init(accountId: string) {
      
      let instance = CLIENTS.get(accountId)

      if(!instance) {

        const accountFound = await WhatsAppAccountModel.find(accountId) as any

        if(!accountFound) return null

        const client = new Client({ authStrategy: new LocalAuth({ clientId: accountFound.clientId }), puppeteer: PUPPETEER })

        instance = { account: accountFound, client: client, initialized: false, initializingPromise: null }
        
        CLIENTS.set(accountFound.id, instance)

      }

      const { account, client, initialized } = instance

      if(initialized) return instance

      if(instance.initializingPromise) {

        await instance.initializingPromise

        return instance

      }

      instance.initializingPromise = (async () => {

        client.on("qr", async qr => {
          
          let foundAccount = await WhatsAppAccountModel.find(account.id)
          
          if(!foundAccount) return
          
          foundAccount.status = "connected"
          
          await WhatsAppAccountModel.upsert(foundAccount as any)
  
          // socket will emit qr code event
  
        })
  
        client.on("ready", async() => {
  
          let foundAccount = await WhatsAppAccountModel.find(account.id)
  
          if(!foundAccount) return
  
          foundAccount.status = "connected"
  
          await WhatsAppAccountModel.upsert(foundAccount as any)
  
        })
  
        client.on("message", async (msg: Message) => {

          try {

            if(msg.body.trim().toLowerCase() === "!!ping!!") return msg.reply("!!pong!!")
  
            const contact = await msg.getContact()

            const name = contact.pushname || contact.name || "Desconhecido"

            const clientId = msg.from.split("@")[0]
    
            const payload = JSON.stringify( {
              id: msg.id.id,
              from: contact.number,
              clientId: clientId,
              to: account.number,
              name,
              type: msg.type,
              message: msg.body
            })
    
            const { account:loadedAccount } = CLIENTS.get(accountId)
    
            if(!loadedAccount.webhookUrl) return
    
            await fetch(loadedAccount.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload })
            
          } catch (error) {

            console.error("❌ Error handling incoming message:", error)

            const formatedError = {
              name: error.name || 'UnknownError',
              message: error.message || 'An unknown error occurred.',
              stack: error.stack || 'No stack trace available.',
            }

            const item: FailType = {
              name: error.name,
              type: 'message',
              message: `Error processing message from ${msg.from}`,
              data: msg,
              error: formatedError,
              status: 'new',
            }

            await FailModel.upsert(item)
            
          }
  
  
        })
  
        console.log(`⌛ Initializing account ${account.id}`)
  
        await instance.client.initialize()

        console.log(`✅ initialized accoun ${account.id}`)

        instance!.initialized = true

      })()

      await instance.initializingPromise

      return instance

    },

    async initAll() {

      const accounts = await WhatsAppAccountModel.query.findMany()

      for(const account of accounts) {

        await this.init(account.id)

      }

      // accounts.forEach(async account => {

      //   // await this.create(account)
      //   await this.init(account.id)

      // })

    },

    async delete(accountId: string) {

      const instance = CLIENTS.get(accountId)

      if(!instance) return

      const { client, account } = instance

      await client.destroy()

      CLIENTS.delete(accountId)

      const dir = `./wwebjs_auth/session-${account.clientId}`

      if(fs.existsSync(dir)) fs.rmdirSync(dir, { recursive: true })

    },

    async qrCode(accountId: string) {

      const instance = await this.init(accountId)

      if(!instance) throw new Error("Client not found")

      const { client } = instance

      return new Promise((resolve, reject) => {

        const timer = setTimeout(() => {

          client.off("qr", onQR)

          reject(new Error("QR timeout"))

        }, 20000)

        function onQR(qr: string) {

          clearTimeout(timer)

          client.off("qr", onQR) // remove listener after receiving QR code

          resolve(qr)

        }

        client.on("qr", onQR)

      })

    },

    async send(accountId: string, number: string, message: string) {

      const instance = CLIENTS.get(accountId)

      if(!instance) throw new Error("Client not found")

      const client = instance.client

      const formattedNumber = formatNumber(number)

      return await client.sendMessage(formattedNumber, message);

    }

  }

}

const Whatsapp = factory()

export default Whatsapp