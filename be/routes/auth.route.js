import express from "express";
import { login, logout, register } from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/verif.middleware.js";
import { loginLimiter } from "../middlewares/rateLimiter.middleware.js";

const authRoute = express.Router();


authRoute.post('/login',loginLimiter, login)
authRoute.post('/register',loginLimiter, register)
authRoute.use(verifyToken)
authRoute.post('/logout',logout)

export {authRoute}