import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"
import dotenv from 'dotenv'
import { authRoute } from "./routes/auth.route.js";
import { userRoute } from "./routes/user.route.js";
import { linkRoute } from "./routes/link.route.js";
import { clickRoute } from "./routes/click.route.js";
import { redirectAndTrack } from "./controllers/click.controller.js";

dotenv.config()
const server = express();
const PORT = 3000

server.use(express.json())
server.use(cookieParser())
server.use(express.urlencoded({extended:true}))
server.use(cors({
  origin: "http://localhost:5173", // FE lu
  credentials: true
}))

server.use('/auth', authRoute)
server.use('/user',userRoute)
server.use('/short',linkRoute)
server.use('/click',clickRoute)



server.get('/:slug', redirectAndTrack);
server.listen(PORT,() =>{
    console.log(`server berjalan di port http://localhost:${PORT} !`)
})
