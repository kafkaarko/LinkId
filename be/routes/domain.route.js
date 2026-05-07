import express from 'express'
import { addDomain, verifyDomain } from "../controllers/domain.controller.js";
import { verifyToken } from '../middlewares/verif.middleware.js';

const domainRoute = express.Router()

domainRoute.use(verifyToken)
domainRoute.post("/",addDomain);
domainRoute.post("/verify", verifyDomain);

export {domainRoute}
