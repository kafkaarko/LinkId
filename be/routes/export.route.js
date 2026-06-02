// routes/export.route.js
import express from "express";
import { exportLinks, exportLinkAnalytics } from "../controllers/export.controller.js";
import { verifyToken } from "../middlewares/verif.middleware.js";

const exportRouter = express.Router();

exportRouter.get("/links", verifyToken, exportLinks);
exportRouter.get("/links/:slug", verifyToken, exportLinkAnalytics);

export { exportRouter };