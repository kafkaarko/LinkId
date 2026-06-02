import express from "express"
import { generateQR } from "../controllers/qr.controller.js"
import { verifyToken } from "../middlewares/verif.middleware.js"

const qrRoute = express.Router()

qrRoute.use(verifyToken)
qrRoute.post('/custom',generateQR)  
qrRoute.get('/',generateQR)

export {qrRoute}