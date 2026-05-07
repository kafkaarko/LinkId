// controllers/preview.controller.js
import { prisma } from "../lib/prisma.js";
import { getLinkPreview } from "../services/preview.service.js";
import { errorResponse, successResponse } from "../utils/response.util.js";



const preview = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return errorResponse(res,"URL required",400)
    }

    const data = await getLinkPreview(url);

    return successResponse(res,"berhasil mengambil data",data)
  } catch (err) {
    console.log(err)
    return errorResponse(res,"coba lagi",{message:err.message},400)
  }
};

export {preview}