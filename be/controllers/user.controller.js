import { prisma } from "../lib/prisma.js";
import { errorResponse, successResponse } from "../utils/response.util.js";

const index = async (req, res) => {
  try {
    const users = await prisma.user.findMany()
    // !users &&  errorResponse(res,"data belum di buat")
    if (users.length === 0) return errorResponse(res, "Data belum di buat")
    return successResponse(res, "berhasil mengabil data dari databse", users)
  } catch (error) {
    return errorResponse(res, "coba lagi", { message: error.message })
  }
}

const show = async (req, res) => {
  const { id } = req.user.id;
  const userID = Number(id)
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userID
      }
    })
    !user && errorResponse(res, "data tidak ditemukan")
    return successResponse(res, "berhasil mengabil data dari databse", user)
  } catch (error) {
    return errorResponse(res, "coba lagi", { message: error.message })
  }
}

const edit = async (req, res) => {
  const { name, email, password } = req.body;
  const userID = Number(req.user.id);

  try {
    if (!userID) {
      return errorResponse(res, "Unauthorized");
    }

    const userLama = await prisma.user.findUnique({
      where: { id: userID },
    });

    if (!userLama) {
      return errorResponse(res, "User tidak ditemukan");
    }

    let dataUpdate = {
      ...(name && { name }),
      ...(email && { email }),
    };

    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      dataUpdate.password = hashedPassword;
    }

    const userBaru = await prisma.user.update({
      where: { id: userID },
      data: dataUpdate,
    });

    return successResponse(res, "Berhasil update data", userBaru);
  } catch (error) {
    console.log(error);
    return errorResponse(res, "coba lagi", { message: error.message });
  }
};

const destroy = async (req, res) => {
  const { id } = req.user.id
  const userID = Number(id)
  try {
    await prisma.user.delete({
      where: {
        id: userID
      }
    })
    return successResponse(res, "berhasil menghapus data")
  } catch (error) {
    return errorResponse(res, "coba lagi", { message: error.message })
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
        role: true,
        subscriptionUntil: true,
        createdAt: true,
      },
    });

    if (!user) return errorResponse(res, "user tidak ditemukan");

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyCount = await prisma.link.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    const customCount = await prisma.link.count({
      where: {
        userId: user.id,
        isCustom: true,
      },
    });

    return successResponse(res, "ok", {
      ...user,
      usage: {
        monthlyCount,
        monthlyLimit: user.role === "SUPER_USER" ? 500 : 100,
        customCount,
        customLimit: user.role === "SUPER_USER" ? null : 5,
      },
    });
  } catch (error) {
    console.log(error);
    return errorResponse(res, "coba lagi", { message: error.message });
  }
};

const upgradeToSuperUser = async (req, res) => {
  try {
    const { plan } = req.body;
    const userID = Number(req.user.id)

    const PLAN_CONFIG = {
  FREE: {
    role: "USER",
    duration: 0,
  },
  SUPER_USER: {
    role: "SUPER_USER",
    duration: 30,
  },
};

const config = PLAN_CONFIG[plan];

if (!config) return errorResponse(res, "Plan tidak valid");

let expiredDate = null;

if (config.duration > 0) {
  expiredDate = new Date();
  expiredDate.setDate(expiredDate.getDate() + config.duration);
}

const updatedUser = await prisma.user.update({
  where: { id: userID },
  data: {
    role: config.role,
    subscriptionUntil: expiredDate,
  },
});

    return successResponse(res,
      `selamat akun anda ${updatedUser.name} telah di upgrade menjadi super_user selama 30 hari `, updatedUser
    )
  } catch (error) {
    console.log(error)
    return errorResponse(res, "coba lagi", { message: error.message })
  }
}


export { index, show, edit, destroy, me, upgradeToSuperUser }
