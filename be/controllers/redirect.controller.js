import { prisma } from "../lib/prisma.js";
import { errorResponse, successResponse } from "../utils/response.util.js";
import { trackClickAsync } from "../controllers/click.controller.js";


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

    // analytics async
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