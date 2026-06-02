import express from 'express'
import { verifyToken } from '../middlewares/verif.middleware.js'
import { apiLimiter } from '../middlewares/rateLimiter.middleware.js'
import { createShortLink, getGlobalAnalytics, getLinkDetailAnalytics, index, setPassword, updateLinkMode, verifyPassword } from '../controllers/link.controller.js'
import { optionalAuth } from '../middlewares/optionalAuth.middleware.js'

const linkRoute = express.Router()

linkRoute.use(apiLimiter)
linkRoute.get('/all',verifyToken,index)
linkRoute.post('/create-short-link',optionalAuth,createShortLink)
linkRoute.patch('/:slug/mode',verifyToken,updateLinkMode)
linkRoute.patch("/:slug/password", verifyToken, setPassword);
linkRoute.post("/:slug/verify", verifyPassword); // public
linkRoute.get('/analytics', verifyToken,getGlobalAnalytics)
linkRoute.get('/analytics/:slug', verifyToken,getLinkDetailAnalytics)

export {linkRoute}