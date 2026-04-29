import express from 'express'
import { verifyToken } from '../middlewares/verif.middleware.js'
import { apiLimiter } from '../middlewares/rateLimiter.middleware.js'
import { createShortLink, getLinkAnalytics, index } from '../controllers/link.controller.js'
import { optionalAuth } from '../middlewares/optionalAuth.middleware.js'

const linkRoute = express.Router()

linkRoute.use(apiLimiter)
linkRoute.get('/all',verifyToken,index)
linkRoute.get('/analistic',verifyToken ,getLinkAnalytics)
linkRoute.post('/create-short-link',optionalAuth,createShortLink)

export {linkRoute}