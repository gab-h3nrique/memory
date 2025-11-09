import express, { Request, Response } from "express"
import path from 'path'
import routes from "./routes/routes"
import Whatsapp from "./whatsapp/whatsapp"

const port = parseInt(process.env.PORT || '3000', 10)

const app = express()

app.use(express.json())

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // or '*'
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true'); // if needed
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
})

routes(app)

Whatsapp.initAll()

app.listen(port, () => console.log(`Server listening at http://localhost:${port} as ${ process.env.NODE_ENV ? process.env.NODE_ENV : 'development' }`))
