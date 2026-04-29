import { prisma } from "../lib/prisma.js";
import { errorResponse, successResponse } from "../utils/response.util.js";



const index = async(req,res) => {
    try {
        const click = await prisma.click.findMany()
        !click && errorResponse(res,"data tidak ditemukan")
        return successResponse(res,"berhasil mengambil data",click)
    } catch (error) {
        console.error(error)
        return errorResponse(res,"coba lagi", {message:error.message})
    }
}

const getByUser = async(req,res) => {
    try {
        const clicks = await prisma.click.findMany({
            where: {
                link: {
                    userId: Number(req.user.id) // Cari klik yang link-nya milik si user ini
                }
            },
            include: {
                link: true // Supaya tahu klik ini buat link yang mana
            }
        })
        
        if (!clicks || clicks.length === 0) {
            return errorResponse(res, "data tidak ditemukan")
        }
        
        return successResponse(res, "berhasil mengambil data", clicks)
    } catch (error) {
        return errorResponse(res, "coba lagi", {message: error.message})
    }
}
const redirectAndTrack = async(req,res) =>{
    try {
        const {slug} = req.params
        const link = await prisma.link.findUnique({
            where: { shortSlug: slug }
        })

        // TAMBAHKAN RETURN DISINI
        if (!link) {
            return res.status(404).send("<h3>Link tidak ditemukan</h3>");
        }

        const ipAddres = req.headers['x-forwarded-for'] || req.socket.remoteAddress
        const userAgent = req.headers['user-agent']
        const referer = req.get('Referer') || "Direct (WhatsApp/Browser)";

        // Catat klik (background process)
        prisma.click.create({
            data: {
                linkId: link.id,
                ipAddress: ipAddres,
                userAgent: userAgent,
                referer: referer
            }
        }).catch(err => console.error("gagal mencatat klik", err))

        // Redirect user
        return res.redirect(link.originalUrl)

    } catch (error) {
        return errorResponse(res, "coba lagi", {message: error.message})
    }
}


export {index,getByUser,redirectAndTrack}