import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

import helmet from "helmet";
import compression from "compression";

import { prisma } from "./lib/prisma.js";

import { authRoute } from "./routes/auth.route.js";
import { userRoute } from "./routes/user.route.js";
import { linkRoute } from "./routes/link.route.js";
import { clickRoute } from "./routes/click.route.js";
import { previewRoute } from "./routes/preview.route.js";

import { redirectAndTrack } from "./controllers/click.controller.js";
import { resolveSlug } from "./controllers/redirect.controller.js";
import { generateQR } from "./controllers/qr.controller.js";

import { flushClicks } from "./workers/click.worker.js";

dotenv.config();

const server = express();

const PORT = process.env.PORT || 3000;

server.set("trust proxy", 1);

server.use(helmet());
server.use(compression());

server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(cookieParser());

server.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

server.use(express.static("dist"));

server.use("/auth", authRoute);
server.use("/user", userRoute);
server.use("/short", linkRoute);
server.use("/click", clickRoute);
server.use("/preview", previewRoute);

server.get("/qr", generateQR);

server.get("/api/resolve/:slug", redirectAndTrack);
server.get("/:slug", resolveSlug);

server.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

server.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

const shutdown = async () => {
  console.log("🛑 shutting down...");

  await flushClicks();
  await prisma.$disconnect();

  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const startServer = async () => {
  try {
    await prisma.$connect();

    console.log("🟢 database connected");

    server.listen(PORT, () => {
      console.log(`🚀 server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("🔴 database failed:", error);

    process.exit(1);
  }
};

startServer();