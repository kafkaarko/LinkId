import express from "express";
import { apiLimiter } from "../middlewares/rateLimiter.middleware.js";
import { getByUser, index, redirectAndTrack } from "../controllers/click.controller.js";
import { verifyToken } from "../middlewares/verif.middleware.js";

const clickRoute = express.Router()
clickRoute.use(apiLimiter)
clickRoute.get('/all',index)
clickRoute.get('/userTO',verifyToken,getByUser)
clickRoute.get('/:slug',redirectAndTrack)

export {clickRoute}