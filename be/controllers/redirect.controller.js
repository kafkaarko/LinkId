import { prisma } from "../lib/prisma.js";
import { errorResponse, successResponse } from "../utils/response.util.js";
import { trackClickAsync } from "../controllers/click.controller.js";
import { LRUCache as LRU } from "lru-cache";

const slugCache = new LRU({
  max: 1000,
  ttl: 1000 * 60 * 10, // 10 menit
});


export const resolveSlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const link = await prisma.link.findUnique({
      where: {
        shortSlug: slug,
      },
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Link tidak ditemukan",
      });
    }

        if (link.isProtected) {
      return res.json({ protected: true });
    }

    // 🔥 expired check
    if (link.expiresAt && new Date() > link.expiresAt) {
      return res.status(410).json({
        success: false,
        message: "Link expired",
      });
    }

    // 🔥 async analytics

    trackClickAsync(link.id, req);


    return res.json({
      success: true,
      data: {
        originalUrl: link.originalUrl,
      },
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};