import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"
import dotenv from 'dotenv'
import { authRoute } from "./routes/auth.route.js";
import { userRoute } from "./routes/user.route.js";
import { linkRoute } from "./routes/link.route.js";
import { clickRoute } from "./routes/click.route.js";
import { redirectAndTrack } from "./controllers/click.controller.js";
import { previewRoute } from "./routes/preview.route.js";
import { resolveSlug } from "./controllers/redirect.controller.js";
import { generateQR } from "./controllers/qr.controller.js";
import { verifyToken } from "./middlewares/verif.middleware.js";
import { flushClicks } from "./workers/click.worker.js";
import helmet from "helmet";
import compression from "compression";


dotenv.config()
const server = express();
const PORT = 3000
server.set("trust proxy", 1);

server.use(express.json())
server.use(cookieParser())
server.use(express.urlencoded({extended:true}))
server.use(cors({
  origin: "http://localhost:5173", // FE lu
  credentials: true
}))
server.use(express.static("dist"));
server.use(helmet());
server.use(compression());

server.use('/auth', authRoute)
server.use('/user',userRoute)
server.use('/short',linkRoute)
server.use('/click',clickRoute)
server.use('/preview',previewRoute)
// server.use('/domain',domainRoute)
server.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});
// QR
server.get("/qr", generateQR);

server.get("/api/resolve/:slug",  redirectAndTrack);
server.get("/:slug", resolveSlug);

server.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    uptime: process.uptime(),
    timestamp: new Date(),
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

server.listen(PORT,() =>{
    console.log(`server berjalan di port http://localhost:${PORT} !`)
})
