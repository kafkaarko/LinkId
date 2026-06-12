// controllers/safety.controller.js
import { errorResponse } from "../utils/response.util.js";
import { checkUrlSafety } from "../utils/safebrowsing.utils.js";


export const checkUrl = (req, res) => {
  const { url } = req.body;
  if (!url) return errorResponse(res, "URL harus diisi")


  const result = checkUrlSafety(url);
  return res.json(result);
};