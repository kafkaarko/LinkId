import { prisma } from "../lib/prisma.js";
import { errorResponse, successResponse } from "../utils/response.util.js";
import { generateSlug } from "../utils/stringGen.util.js";



const index = async (req, res) => {
  try {
    const links = await prisma.link.findMany({
      where: {
        userId: Number(req.user.id)
      },
      orderBy: {
        createdAt: "desc"
      }
    })
    !links && errorResponse(res, "data tidak ditemukan")
    const shortenedUrl = links.map(link => ({
      ...link,
      shortenedUrl: `${req.protocol}://${req.get('host')}/${link.shortSlug}`
    }))
    return successResponse(res, "berhasil mengambil data", { links: shortenedUrl })
  } catch (error) {
    return errorResponse(res, "coba lagi", { message: error.message })
  }
}

const createShortLink = async (req, res) => {
  try {
    const { originalUrl, customSlug, guestIdentifier, domainId, mode } = req.body;

    const user = req.user || null;
    const userID = user?.id ? Number(user.id) : null;

    // 🔥 ambil IP
    const rawIP =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const ipAddress = rawIP?.split(",")[0]?.trim();

    // logic expired
    const allowedModes = ["PERSONAL", "DPD", "MPM"];
    const finalMode = mode || "PERSONAL";

    if (!allowedModes.includes(finalMode)) {
      return errorResponse(res, "Mode tidak valid");
    }

    let expiresAt = null;

    if (finalMode === "DPD") {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    if (finalMode === "MPM") {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    let domain = null;

    if (domainId) {
      domain = await prisma.domain.findFirst({
        where: {
          id: Number(domainId),
          userId
        }
      });

      if (!domain) {
        return errorResponse(res, "Domain tidak valid");
      }

      const domainCount = await prisma.domain.count({
        where: { userId }
      });

      if (domainCount > 5) {
        return errorResponse(res, "Limit domain tercapai");
      }
    }
    // =========================
    // 🔥 VALIDASI URL
    // =========================
    if (!originalUrl) {
      return errorResponse(res, "URL wajib diisi.");
    }

    // =========================
    // 🔥 HELPER
    // =========================
    const slugRegex = /^[a-zA-Z0-9_-]+$/;
    const reservedSlugs = ["admin", "login", "api"];

    const generateUniqueSlug = async (baseSlug) => {
      let slug = baseSlug;
      let counter = 1;

      while (true) {
        const exist = await prisma.link.findUnique({
          where: { shortSlug: slug },
        });

        if (!exist) return slug;

        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    };

    // 🔥 month range (buat SaaS limit)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let finalSlug;
    let isCustom = false;

    // =========================
    // 🔥 USER LIMIT (SaaS CORE)
    // =========================
    if (userID) {
      const monthlyCount = await prisma.link.count({
        where: {
          userId: userID,
          createdAt: {
            gte: startOfMonth,
          },
        },
      });

      // 🔥 USER = 100 / bulan
      if (user.role === "USER" && monthlyCount >= 100) {
        return errorResponse(
          res,
          "Limit 100 link/bulan habis. Upgrade biar nggak miskin fitur 😏"
        );
      }

      // 🔥 SUPER_USER = 500 / bulan
      if (user.role === "SUPER_USER" && monthlyCount >= 500) {
        return errorResponse(
          res,
          "Limit 500 link/bulan habis. Santai dikit bro 😭"
        );
      }
    }

    // =========================
    // 🔥 CUSTOM MODE
    // =========================
    if (customSlug && customSlug.trim() !== "") {
      if (!userID) {
        return errorResponse(res, "Login dulu buat custom slug 😏");
      }

      const cleanSlug = customSlug.trim();

      // 🔥 sanitize
      if (!slugRegex.test(cleanSlug)) {
        return errorResponse(res, "Slug tidak valid.");
      }

      if (reservedSlugs.includes(cleanSlug.toLowerCase())) {
        return errorResponse(res, "Slug reserved, jangan nakal 😑");
      }

      // 🔥 USER (strict)
      if (user.role === "USER") {
        const customCount = await prisma.link.count({
          where: {
            userId: userID,
            isCustom: true,
          },
        });

        if (customCount >= 5) {
          return errorResponse(
            res,
            "Limit custom slug (5) habis. Upgrade 😏"
          );
        }

        const exist = await prisma.link.findUnique({
          where: { shortSlug: cleanSlug },
        });

        if (exist) {
          return errorResponse(res, "Slug sudah dipakai.");
        }

        finalSlug = cleanSlug;
      }

      // 🔥 SUPER_USER (auto suffix, bebas tabrak)
      else {
        finalSlug = await generateUniqueSlug(cleanSlug);
      }

      isCustom = true;
    }

    // =========================
    // 🔥 RANDOM MODE
    // =========================
    else {
      // 🔥 guest limit
      if (!userID) {
        if (!guestIdentifier) {
          return errorResponse(res, "Guest butuh identifier.");
        }

        const guestLinkCount = await prisma.link.count({
          where: {
            userId: null,
            guestIdentifier,
          },
        });

        const ipLinkCount = await prisma.link.count({
          where: {
            userId: null,
            ipAddress,
          },
        });

        if (guestLinkCount >= 5 || ipLinkCount >= 20) {
          return errorResponse(res, "Limit guest tercapai.");
        }
      }

      // 🔥 random slug
      let slug;
      let exist;

      do {
        slug = generateSlug();
        exist = await prisma.link.findUnique({
          where: { shortSlug: slug },
        });
      } while (exist);

      finalSlug = slug;
    }

    // =========================
    // 🔥 CREATE
    // =========================
    const newLink = await prisma.link.create({
      data: {
        originalUrl,
        shortSlug: finalSlug,
        isCustom,
        userId: userID,
        guestIdentifier: userID ? null : guestIdentifier,
        ipAddress,
        domainId: domain?.id || null,
        expiresAt,
        mode
      },
    });

    const base = domain
      ? `https://${domain.host}`
      : `${req.protocol}://${req.get("host")}`;

    const shortUrl = `${base}/${finalSlug}`;


    return successResponse(res, "Berhasil bikin link", {
      data: newLink,
      shortenedUrl: shortUrl,
      shortSlug: newLink.shortSlug
    });

  } catch (error) {
    console.log(error);
    return errorResponse(res, "Server error", {
      message: error.message,
    });
  }
};

const getLinkAnalytics = async (req, res) => {
  try {
    const userID = Number(req.user.id);
    const role = req.user.role;

    // 🔥 TOTAL + UNIQUE
    const totalClicks = await prisma.click.count({
      where: { link: { userId: userID } }
    });

    const uniqueVisitors = await prisma.click.groupBy({
      by: ["ipAddress"],
      where: { link: { userId: userID } },
      _count: true
    });

    if (role === "USER") {
      return successResponse(res, "Basic analytics", {
        totalClicks,
        uniqueVisitors: uniqueVisitors.length,
      });
    }

    // 🔥 DAILY TREND (7 hari)
    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE("clickedAt") as date,
        COUNT(*)::int as count
      FROM "Click"
      WHERE "linkId" IN (
        SELECT id FROM "Link" WHERE "userId" = ${userID}
      )
      AND "clickedAt" >= NOW() - INTERVAL '7 days'
      GROUP BY date
      ORDER BY date;
    `;

    // 🔥 TOP REFERRER
    const referrerStats = await prisma.click.groupBy({
      by: ["referer"],
      where: {
        link: { userId: userID }
      },
      _count: {
        referer: true // 🔥 ini penting
      },
      orderBy: {
        _count: {
          referer: "desc" // 🔥 FIX
        }
      },
      take: 5
    });

    // 🔥 TOP LINK
    const topLinks = await prisma.click.groupBy({
      by: ["linkId"],
      where: {
        link: { userId: userID }
      },
      _count: {
        linkId: true
      },
      orderBy: {
        _count: {
          linkId: "desc"
        }
      },
      take: 5
    });

    const linkIds = topLinks.map(l => l.linkId);

    const links = await prisma.link.findMany({
      where: { id: { in: linkIds } },
      select: { id: true, shortSlug: true }
    });

    const topLinkStats = topLinks.map(item => {
      const link = links.find(l => l.id === item.linkId);
      return {
        slug: link?.shortSlug,
        clicks: item._count._all
      };
    });

    return successResponse(res, "Full analytics", {
      totalClicks,
      uniqueVisitors: uniqueVisitors.length,
      dailyStats,
      referrerStats,
      topLinkStats
    });

  } catch (err) {
    console.error(err);
    return errorResponse(res, "Analytics error", { message: err.message });
  }
};

const updateLinkMode = async (req, res) => {
  try {
    const { slug } = req.params;
    const { mode } = req.body;
    const userID = Number(req.user.id);

    const allowedModes = ["PERSONAL", "DPD", "MPM"];

    if (!allowedModes.includes(mode)) {
      return errorResponse(res, "Mode tidak valid");
    }

    const link = await prisma.link.findUnique({
      where: { shortSlug: slug },
    });

    if (!link) {
      return errorResponse(res, "Link tidak ditemukan");
    }

    // 🔥 SECURITY: pastikan punya user
    if (link.userId !== userID) {
      return errorResponse(res, "Akses ditolak");
    }

    // =========================
    // 🔥 SET EXPIRE
    // =========================
    let expiresAt = null;

    if (mode === "DPD") {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    if (mode === "MPM") {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    // PERSONAL = null

    const updated = await prisma.link.update({
  where: { id: link.id },
  data: {
    mode,
    expiresAt,
  },
});

const check = await prisma.link.findUnique({
  where: { id: link.id }
});

console.log(check);

    return successResponse(res, "Mode updated", updated);

  } catch (err) {
    console.error(err);
    return errorResponse(res, "Server error", {
      message: err.message,
    });
  }
};

const getGlobalAnalytics = async (req, res) => {
  try {
    const userID = Number(req.user.id);

    // total clicks
    const totalClicks = await prisma.click.count({
      where: { link: { userId: userID } },
    });

    // unique visitors
    const uniqueVisitors = await prisma.click.groupBy({
      by: ["ipAddress"],
      where: { link: { userId: userID } },
    });

    // daily trend
    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE("clickedAt") as date,
        COUNT(*)::int as count
      FROM "Click"
      WHERE "linkId" IN (
        SELECT id FROM "Link" WHERE "userId" = ${userID}
      )
      GROUP BY date
      ORDER BY date DESC
      LIMIT 7
    `;

    // referrer
    const referrerStats = await prisma.click.groupBy({
      by: ["referer"],
      where: { link: { userId: userID } },
      _count: {
        referer: true,
      },
      orderBy: {
        _count: {
          referer: "desc",
        },
      },
      take: 5,
    });

    // top links
    const topLinksRaw = await prisma.click.groupBy({
      by: ["linkId"],
      where: { link: { userId: userID } },
      _count: {
        linkId: true,
      },
      orderBy: {
        _count: {
          linkId: "desc",
        },
      },
      take: 5,
    });

    const links = await prisma.link.findMany({
      where: {
        id: { in: topLinksRaw.map(i => i.linkId) },
      },
      select: {
        id: true,
        shortSlug: true,
      },
    });

    const topLinkStats = topLinksRaw.map(item => {
      const link = links.find(l => l.id === item.linkId);
      return {
        slug: link?.shortSlug,
        clicks: item._count.linkId,
      };
    });

    return successResponse(res, "ok", {
      totalClicks,
      uniqueVisitors: uniqueVisitors.length,
      dailyStats,
      referrerStats,
      topLinkStats,
    });

  } catch (err) {
    console.error(err);
    return errorResponse(res, "error", { message: err.message });
  }
};


// 🔥 PER LINK ANALYTICS
const getLinkDetailAnalytics = async (req, res) => {
  try {
    const { slug } = req.params;

    const link = await prisma.link.findFirst({
      where: {
        shortSlug: slug,
        userId: req.user.id,
      },
    });

    if (!link) return errorResponse(res, "Link tidak ditemukan");

    const totalClicks = await prisma.click.count({
      where: { linkId: link.id },
    });

    const uniqueVisitors = await prisma.click.groupBy({
      by: ["ipAddress"],
      where: { linkId: link.id },
    });

    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE("clickedAt") as date,
        COUNT(*)::int as count
      FROM "Click"
      WHERE "linkId" = ${link.id}
      GROUP BY date
      ORDER BY date DESC
      LIMIT 7
    `;

    return successResponse(res, "ok", {
      totalClicks,
      uniqueVisitors: uniqueVisitors.length,
      dailyStats,
      mode: link.mode,
expiresAt: link.expiresAt,
    });

  } catch (err) {
    console.error(err);
    return errorResponse(res, "error", { message: err.message });
  }
};

export { index, createShortLink, getGlobalAnalytics,updateLinkMode, getLinkDetailAnalytics }