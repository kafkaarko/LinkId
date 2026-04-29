import express from "express";
import { destroy, edit, index, me, show } from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/verif.middleware.js";
import { apiLimiter } from "../middlewares/rateLimiter.middleware.js";

const userRoute = express.Router();

userRoute.use(verifyToken)
userRoute.use(apiLimiter)
userRoute.get('/',index)
userRoute.get('/me',me)
userRoute.get('/:id',show)
userRoute.put('/',edit)
userRoute.delete('/:id',destroy)

export {userRoute}