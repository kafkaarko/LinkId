import express from "express";
import { preview } from "../controllers/preview.controller.js";

const previewRoute = express.Router()

previewRoute.get('/',preview)

export {previewRoute}

