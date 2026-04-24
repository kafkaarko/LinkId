import { prisma } from "../lib/prisma.js";
import { errorResponse, successResponse } from "../utils/response.util.js";
import { generateSlug } from "../utils/stringGen.util.js";



const index = async (req,res) =>{
    try {
        const links =  await prisma.link.findMany({
            where:{
                userId:Number(req.user.id)
            },
            orderBy:{
                createdAt:"desc"
            }
        })
        !links && errorResponse(res,"data tidak ditemukan")
        const shortenedUrl = links.map(link => ({
            ...link,
            shortenedUrl:`${req.protocol}://${req.get('host')}/${link.shortSlug}`
        }))
        return successResponse(res,"berhasil mengambil data",{links:shortenedUrl})
    } catch (error) {
        return errorResponse(res,"coba lagi", {message:error.message})
    }
}

const createShortLink = async (req,res) =>{
    try {
        const {originalUrl} = req.body
        const userID = Number(req.user.id)

        !originalUrl && errorResponse(res,"silahkan isi field !!")

        let slug = generateSlug()

        const exist = await prisma.link.findUnique({where:{shortSlug:slug}})
        if(exist) slug = generateSlug()

        const newLink = await prisma.link.create({
            data:{
                originalUrl,
                shortSlug:slug, 
                userId:userID
            }
        })
        return successResponse(res,"berhasil membuat link",{
            newLink,
            shortenedUrl: `${req.protocol}://${req.get('host')}/${newLink.shortSlug}`
        })
    } catch (error) {
        console.log(error)
        return errorResponse(res,"coba lagi", {message:error.message})
        
    }
}

export {index, createShortLink}