

import { UserModel } from "../../models/userModel";
import JS from "../../utils/JS";
import Whatsapp from "../../whatsapp/whatsapp";
import crypto from "crypto";
import jwt from "jsonwebtoken";

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

        login: async(req: any, res: any) => {

            const { body } = req

            const email = body.email ? String(body.email) : ''
            const password = body.password ? String(body.password) : ''

            if(!email || !password) return res.status(401).json({ success: false, data: null, message: 'Email and password are required.' })

            const existing = await UserModel.find(email)

            if(!existing) return res.status(401).json({ success: false, data: null, message: 'Email or password incorrect.' })

            const verify = await JS.verifyPassword(password, existing.password)

            if(!verify) return res.status(401).json({ success: false, data: null, message: 'Email or password incorrect.' })

            const { password:ps, ...rest } = existing

            // expire in one month
            const token = await jwt.sign(rest, process.env.ACCESS_TOKEN || 'GARREN', { expiresIn: '30d' })

            return res.status(200).json({ success: true, data: { ...rest, token }, message: '' })

        },

        signup: async(req: any, res: any) => {

            const { body } = req

            const name = body.name ? String(body.name) : ''
            const email = body.email ? String(body.email) : ''
            const password = body.password ? String(body.password) : ''

            const existing = await UserModel.find(email)

            if(existing) return res.status(400).json({ success: false, data: null, message: 'Email already in use.' })

            const hash = await JS.hashPassword(password)

            const newUser = { name, email, password: hash, role: 300 }

            const created = await UserModel.upsert(newUser)

            return res.status(200).json({ success: true, data: newUser, message: '' })

        },
        
        get: async(req: any, res: any) => {

            const { query } = req;

            const number = query.number ? String(query.number) : '';

            // const id = query.id ? Number(query.id) : null;
            // const page = query.page ? Number(query.page) : null;
            // const limit = query.limit ? Number(query.limit) : null;
            // const input = query.input ? String(query.input) : '';
            // const startDate = query.startDate ? String(query.startDate) : '';
            // const endDate = query.endDate ? String(query.endDate) : '';

            // if(id) return res.status(200).json({ success: true, data: await ProjectModel.find(Number(id)), message: '' });

            // if(!page || !limit) return res.status(200).json({ success: true, data: await ProjectModel.get(input), message: '' });

            // const index = (Number(page) - 1) * Number(limit)
        
            // const { data, total } = await ProjectModel.paginated(index, Number(limit), (input || ''), startDate, endDate)
        
            return res.status(200).json({ success: true, data: null, message: 'hehe' });
        
        },

        post: async(req: any, res: any) => {

            const { body } = req

            const number = body.number ? String(body.number) : ''
            const message = body.message ? String(body.message) : ''

            if(!number) return res.status(400).json({ success: false, data: null, message: 'number proprety is required.' })

            if(!message) return res.status(400).json({ success: false, data: null, message: 'message proprety is required.' })

            // const result = await Whatsapp.send(number, message)

            return res.status(200).json({ success: true, data: null, message: '' })
        
        },

        delete: async(req: any, res: any) => {

            // const { query } = req;

            // const id = query.id ? Number(query.id) : undefined;
    
            // if(!id) return res.status(400).json({ success: false, data: null, message: 'ID is required' });

            // const project: ProjectType = await ProjectModel.find(id);

            // if(!project) return res.status(404).json({ success: false, data: null, message: 'Data not found' });

            // await ProjectModel.delete(project.id);
            
            // ProjectCommand.delete(project)

            // return res.status(200).json({ success: true, data: null, message: 'Data deleted successfully' });
        
        },
    
    }

}

const UserController = factory()

export default UserController
