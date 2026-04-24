import { prisma } from "../lib/prisma.js";
import { errorResponse, successResponse } from "../utils/response.util.js";

const index = async(req,res) =>{
    try {
        const users = await prisma.user.findMany()
        // !users &&  errorResponse(res,"data belum di buat")
        if(users.length === 0) return errorResponse(res,"Data belum di buat")
        return successResponse(res,"berhasil mengabil data dari databse",users)
    } catch (error) {
        return errorResponse(res,"coba lagi", {message:error.message})
    }
}

const show = async(req,res) =>{
    const {id} = req.user.id;
    const userID = Number(id)
    try {
        const user = await prisma.user.findUnique({
            where:{
                id:userID
            }
        })
        !user && errorResponse(res,"data tidak ditemukan")
        return successResponse(res,"berhasil mengabil data dari databse",user)
    } catch (error) {
        return errorResponse(res,"coba lagi", {message:error.message})
    }
}

const edit = async(req,res) =>{
    const {name,email,password} = req.body
    const {id} = req.user.id
    const userID = Number(id)

    try {
        const userLama = await prisma.user.findUnique({
            where:{
                id:userID
            }
        })
        if(!userLama) return errorResponse(res,"id tidak ditemukan")
            let dataUpdate = {
      ...(name && { name }),
      ...(email && { email }),
    }
    if(password && password.trim() !== ""){
        const hashedPassword = await bcrypt.hash(password,10)
        dataUpdate.password = hashedPassword
    }
    const userBaru = await prisma.user.update({
        where:{
            id:userID
        },
        data:dataUpdate
    })
    return successResponse(res,"Berhasil update data",userBaru)
    } catch (error) {
        return errorResponse(res,"coba lagi", {message:error.message})
    }
}

const destroy = async(req,res) =>{
    const {id} = req.user.id
    const userID = Number(id)
    try {
        await prisma.user.delete({
            where:{
                id:userID
            }
        })
        return successResponse(res,"berhasil menghapus data")
    } catch (error) {
        return errorResponse(res,"coba lagi", {message:error.message})
    }

}

const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) return errorResponse(res, "user tidak ditemukan");

    return successResponse(res, "ok", user);
  } catch (error) {
    return errorResponse(res, "coba lagi", { message: error.message });
  }
};


export {index,show,edit,destroy,me}
