import express from "express";
import { login, logout, register } from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/verif.middleware.js";
import { loginLimiter } from "../middlewares/rateLimiter.middleware.js";

const authRoute = express.Router();


authRoute.use(loginLimiter)
authRoute.post('/login', login)
authRoute.post('/register', register)
authRoute.use(verifyToken)
authRoute.post('/logout',logout)

export {authRoute}