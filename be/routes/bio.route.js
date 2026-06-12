import express from "express";
import {
  getBioPage,
  createBioPage,
  updateBioPage,
  addLink,
  updateLink,
  deleteLink,
  reorderLinks,
  trackLinkClick,
  getMyBioPage,
  uploadAvatar,
} from "../controllers/bio.controller.js";
import { verifyToken } from "../middlewares/verif.middleware.js";
import { uploadMiddleware } from "../middlewares/upload.middleware.js";


const bioRouter = express.Router();

// Private
bioRouter.post("/", verifyToken, createBioPage);
bioRouter.get("/me", verifyToken, getMyBioPage);
bioRouter.patch("/me", verifyToken, updateBioPage);
bioRouter.post("/me/avatar", verifyToken, uploadMiddleware.single("avatar"), uploadAvatar)
bioRouter.post("/me/links", verifyToken, addLink);
bioRouter.patch("/me/links/:linkId", verifyToken, updateLink);
bioRouter.delete("/me/links/:linkId", verifyToken, deleteLink);
bioRouter.patch("/me/links/reorder", verifyToken, reorderLinks);


// Public
bioRouter.get("/:username", getBioPage);
bioRouter.post("/:username/link/:linkId/click", trackLinkClick);


export  {bioRouter};