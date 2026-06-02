// controllers/export.controller.js
import { Parser } from "json2csv"; // npm i json2csv
import { errorResponse } from "../utils/response.util.js";
import { prisma } from "../lib/prisma.js";

// GET /export/links — export semua link
export const exportLinks = async (req, res) => {
  try {
    const links = await prisma.link.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    const fields = ["slug", "originalUrl", "clicks", "mode", "expiresAt", "createdAt"];
    const parser = new Parser({ fields });
    const csv = parser.parse(links);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="links-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.log(err);
    return errorResponse(res, "Server error", { message: err.message }, 500);
  }
};

// GET /export/links/:slug — export satu link dengan analytics
export const exportLinkAnalytics = async (req, res) => {
  try {
    const { shortSlug } = req.params;

    const link = await prisma.link.findFirst({
      where: { shortSlug, userId: req.user.id },
      include: {
        clicks: {  // sesuaikan dengan nama relation di schema kamu
          select: {
            clickedAt: true,
            device: true,
            browser: true,
            os: true,
            country: true,
            referer: true,
          },
          orderBy: { clickedAt: "desc" },
        },
      },
    });

    if (!link) return errorResponse(res, "Link not found", null, 404);

    const fields = ["clickedAt", "device", "browser", "os", "country", "referer"];
    const parser = new Parser({ fields });
    const csv = parser.parse(link.clicks || []);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${link.shortSlug}-analytics-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.log(err);
    return errorResponse(res, "Server error", { message: err.message }, 500);
  }
};