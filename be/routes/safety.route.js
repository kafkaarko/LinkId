import express from 'express'
import { checkUrl } from '../controllers/safety.controller.js'

const safetyRouter = express.Router()
safetyRouter.post('/check',checkUrl)
export {safetyRouter}