// dipakai ketika tidak perlu login dan kalo login juga ke baca
import jwt from "jsonwebtoken";

export const optionalAuth = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    req.user = null; // token invalid → treat as guest
  }

  next();
};