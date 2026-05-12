import jwt, { decode } from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { errorResponse } from "../utils/response.util.js";

const verifyToken = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader) token = authHeader.split(" ")[1];

  if (!token && req.cookies?.token) token = req.cookies.token;

  if (!token)
    return errorResponse(res, "akses ditolak, silahkan login terlebih dahulu");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 ambil user FULL dari DB
    let user = await prisma.user.findUnique({
      where: { id: Number(decoded.id) },
    });

    if (!user) {
      return errorResponse(res, "user tidak ditemukan");
    }

    // 🔥 CHECK SUBSCRIPTION
    if (user.role === "SUPER_USER" && user.subscriptionUntil) {
      const now = new Date();
      const expiredDate = new Date(user.subscriptionUntil);

      if (now > expiredDate) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            role: "USER",
            subscriptionUntil: null,
          },
        });
      }
    }

    // 🔥 inject user fresh ke request
    req.user = user;

    next();
  } catch (error) {
    return errorResponse(res, error.message,"",401);
  }
};

export { verifyToken };