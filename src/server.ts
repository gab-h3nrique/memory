import express, { Request, Response } from "express"
import http from "http"
import path from 'path'
import routes from "./routes/routes"
import Whatsapp from "./whatsapp/whatsapp"

const port = parseInt(process.env.PORT || '3002', 10)

// ================= EXPRESS SETUP ================= //
// create an express app instance
const app = express()

// middleware to parse incoming JSON requests
app.use(express.json())

// middleware to handle CORS and preflight requests
app.use((req, res, next) => {

  // allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*')

  // allow common HTTP methods
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')

  // allow all headers
  res.setHeader('Access-Control-Allow-Headers', '*')

  // allow credentials if needed
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  // respond immediately to OPTIONS preflight requests
  if(req.method === 'OPTIONS') return res.sendStatus(200)

  console.log(`request received: ${req.method} ${req.url}`)

  // pass control to the next middleware or route
  next()

})

// attach the application routes
routes(app)

Whatsapp.initAll()

const server = http.createServer(app)

server.setTimeout(1000 * 60 * 5)     // 5 minutes

server.keepAliveTimeout = 1000 * 60 * 5

server.headersTimeout = 1000 * 60 * 5

// app.listen(port, () => console.log(`✅ Server listening at http://localhost:${port} as ${ process.env.NODE_ENV ? process.env.NODE_ENV : 'development' }`))
server.listen(port, () => console.log(`✅ Server listening at http://localhost:${port} as ${ process.env.NODE_ENV ? process.env.NODE_ENV : 'development' }`))
