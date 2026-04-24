import express from 'express'
import { verifyToken } from '../middlewares/verif.middleware.js'
import { apiLimiter } from '../middlewares/rateLimiter.middleware.js'
import { createShortLink, index } from '../controllers/link.controller.js'

const linkRoute = express.Router()

linkRoute.use(verifyToken)
linkRoute.use(apiLimiter)
linkRoute.get('/all',index)
linkRoute.post('/create-short-link',createShortLink)

export {linkRoute}