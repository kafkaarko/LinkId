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

const createShortLink = async (req, res) => {
  try {
    const { originalUrl, guestIdentifier } = req.body;

    const userID = req.user?.id ? Number(req.user.id) : null;


    // 🔥 ambil IP lebih clean
    const rawIP =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    const ipAddress = rawIP?.split(",")[0]?.trim();

    // 🔥 validasi
    if (!originalUrl) {
      return errorResponse(res, "silahkan isi field yang tersedia");
    }


    // 🔥 GUEST LIMIT
    if (!userID) {
      if (!guestIdentifier) {
        return errorResponse(
          res,
          "guest identifier diperlukan untuk akses guest"
        );
      }

      const guestLinkCount = await prisma.link.count({
        where: {
          userId: null,
          OR: [
            { guestIdentifier: guestIdentifier },
            { ipAddress: ipAddress },
          ],
        },
      });

      if (guestLinkCount >= 5) {
        return errorResponse(
          res,
          "Limit guest tercapai (5 link). Login buat unlimited 😏"
        );
      }
    }

    // 🔥 slug anti-collision
    let slug;
    let exist;

    do {
      slug = generateSlug();
      exist = await prisma.link.findUnique({
        where: { shortSlug: slug },
      });
    } while (exist);

    const newLink = await prisma.link.create({
      data: {
        originalUrl,
        shortSlug: slug,
        userId: userID,
        guestIdentifier: userID ? null : guestIdentifier,
        ipAddress: ipAddress,
      },
    });

    return successResponse(res, "berhasil membuat link", {
      message: userID
        ? "Link berhasil dibuat"
        : "Link dibuat sebagai guest",
      data: newLink,
      shortenedUrl: `${req.protocol}://${req.get("host")}/${slug}`,
    });
  } catch (error) {
    console.log(error);
    return errorResponse(res, "coba lagi", {
      message: error.message,
    });
  }
};

const getLinkAnalytics = async (req, res) => {
  try {
    const userID = Number(req.user.id);
    const userRole = req.user.role;

    // 1. Ambil TOTAL CLICKS dari SEMUA link milik user ini
    const totalClicks = await prisma.click.count({
      where: {
        link: {
          userId: userID // Kita memfilter lewat relasi tabel Link
        }
      }
    });

    if (userRole === 'USER') {
      return successResponse(res, "Data basic", { totalClicks });
    }

    // 2. JIKA SUPER_USER/ADMIN: Grouping Device dari SEMUA link milik user
    const deviceStats = await prisma.click.groupBy({
      by: ['userAgent'],
      where: {
        link: {
          userId: userID // Sama seperti di atas, filter lewat relasi
        }
      },
      _count: { _all: true }
    });

    return successResponse(res, "Data super user", {
      totalClicks,
      deviceStats, 
    });

  } catch (error) {
    console.error(error);
    return errorResponse(res, "Gagal ambil analitik", { message: error.message });
  }
};

export {index, createShortLink, getLinkAnalytics}