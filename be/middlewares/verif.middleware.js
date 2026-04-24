import jwt from 'jsonwebtoken'
import { errorResponse } from '../utils/response.util.js';

const verifyToken = (req,res,next) =>{
    let token;
    const authHeader = req.headers.authorization
    if(authHeader) token = authHeader.split(" ")[1]
    if(!token && req.cookies?.token) token = req.cookies.token

    if(!token) return errorResponse(res,"akses ditolak,silahkan login terlebih dahulu")

    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decode
        next()
    } catch (error) {
        errorResponse(res, error.message)
    }
}

export {verifyToken}