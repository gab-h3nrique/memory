import { Client, LocalAuth, Message } from "whatsapp-web.js"

import fs from "fs"
import { WhatsAppAccountType } from "../types/whatsAppAccountType";
import { WhatsAppAccountModel } from "../models/whatsAppAccount";

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
  client: Client

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

        CLIENTS.set(accountFound.id, { account: accountFound, client })

        instance = { account: accountFound, client }

      }

      const { account, client } = instance

      if((client as any)._initialized) return instance;

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

        if(msg.body.trim().toLowerCase() === "!!ping!!") return msg.reply("!!pong!!")

        const contact = await msg.getContact()
        
        console.log('msg: ', msg)

        console.log('contact: ', contact)

        const name = contact.pushname || contact.name || "Desconhecido"

        const payload = JSON.stringify( {
          id: msg.id.id,
          from: contact.number,
          to: account.number,
          name,
          type: msg.type,
          message: msg.body
        })

        const { account:loadedAccount } = CLIENTS.get(accountId)

        if(!loadedAccount.webhookUrl) return

        await fetch(loadedAccount.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload })

      })

      await instance.client.initialize();

      (client as any)._initialized = true

      return instance

    },

    async initAll() {

      const accounts = await WhatsAppAccountModel.query.findMany()

      accounts.forEach(async account => {

        // await this.create(account)
        await this.init(account.id)

      })

    },























































    // async create(account: WhatsAppAccountType) {

    //   if(!account.clientId) throw new Error("Client ID is required")

    //   if(!CLIENTS.has(account.id)) {

    //     const client = new Client({ authStrategy: new LocalAuth({ clientId: account.clientId }), puppeteer: PUPPETEER })
  
    //     CLIENTS.set(account.id, { account, client })

    //   }

    //   await this.init(account.id)

    //   return CLIENTS.get(account.id)!.client

    // },

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

      // const instance = CLIENTS.get(accountId)

      if(!instance) throw new Error("Client not found")

      const { client } = instance

      return new Promise((resolve, reject) => {

        function onQR(qr: string) {

          client.off("qr", onQR) // remove listener after receiving QR code

          resolve(qr)

        }

        client.on("qr", onQR)

      })

    },
    
    // setClient() {

    // },

    // setAccount(accountId: string, accounnt: WhatsAppAccountType) {

    //   const instance = CLIENTS.get(accountId)

    //   if(!instance) throw new Error("Client not found")

    //   instance.account = accounnt

    // },

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