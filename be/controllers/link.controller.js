import { prisma } from "../lib/prisma.js";
import { errorResponse, successResponse } from "../utils/response.util.js";
import { generateSlug } from "../utils/stringGen.util.js";
import { getCache, setCache } from "../utils/analyticsCache.js";
import bcrypt from "bcrypt";



const index = async (req, res) => {
  try {
    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.max(1, Number(req.query.limit) || 5);
    const skip  = (page - 1) * limit;

    const [links, totalData] = await Promise.all([
      prisma.link.findMany({
        where: { userId: Number(req.user.id) },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          originalUrl: true,
          shortSlug: true,
          createdAt: true,
          isCustom: true,
          mode: true,
          expiresAt: true,
        },
        skip,
        take: limit,
      }),
      prisma.link.count({
        where: { userId: Number(req.user.id) },
      }),
    ]);

    const totalPages   = Math.ceil(totalData / limit);
    const hasNextPage  = page < totalPages;
    const hasPrevPage  = page > 1;

    const shortenedUrl = links.map(link => ({
      ...link,
      shortenedUrl: `${req.protocol}://${req.get("host")}/${link.shortSlug}`,
    }));

    return successResponse(res, "berhasil mengambil data", {
      links: shortenedUrl,
      pagination: {
        totalData,
        totalPages,
        currentPage: page,
        perPage: limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    return errorResponse(res, "coba lagi", { message: error.message });
  }
};

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
    const [monthlyCount, customCount] = await Promise.all([
      prisma.link.count({
        where: {
          userId: userID,
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),

      prisma.link.count({
        where: {
          userId: userID,
          isCustom: true,
        },
      }),
    ]);
    if (userID) {

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

        const [guestLinkCount, ipLinkCount] = await Promise.all([
          prisma.link.count({
            where: {
              userId: null,
              guestIdentifier,
            },
          }),

          prisma.link.count({
            where: {
              userId: null,
              ipAddress,
            },
          }),
        ]);

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
    const cacheKey = `analytics:global:${userID}`;

    const cached = getCache(cacheKey);
    if (cached) {
      console.log(`[Cache HIT] ${cacheKey}`);
      return successResponse(res, "ok", cached);
    }

    console.log(`[Cache MISS] ${cacheKey} — querying DB...`);

    // total clicks
    const totalClicks = await prisma.click.count({
      where: { link: { userId: userID } },
    });

    // unique visitors
    const link = await prisma.link.findFirst({
      where: {
        // shortSlug: slug,
        userId: req.user.id,
      },
    });
    const uniqueVisitors = await prisma.$queryRaw`
  SELECT COUNT(DISTINCT "ipAddress")::int as total
  FROM "Click"
  WHERE "linkId" = ${link.id}
`;

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

    const [deviceStats, browserStats, osStats, countryStats] = await Promise.all([
      prisma.click.groupBy({
        by: ["device"],
        where: { linkId: link.id },
        _count: { device: true },
        orderBy: { _count: { device: "desc" } },
      }),
      prisma.click.groupBy({
        by: ["browser"],
        where: { linkId: link.id },
        _count: { browser: true },
        orderBy: { _count: { browser: "desc" } },
        take: 5,
      }),
      prisma.click.groupBy({
        by: ["os"],
        where: { linkId: link.id },
        _count: { os: true },
        orderBy: { _count: { os: "desc" } },
        take: 5,
      }),
      prisma.click.groupBy({
        by: ["country"],
        where: { linkId: link.id },
        _count: { country: true },
        orderBy: { _count: { country: "desc" } },
        take: 10,
      }),
    ]);
    const result = {
      totalClicks,
      uniqueVisitors: uniqueVisitors[0]?.total ?? 0,
      dailyStats,
      referrerStats,
      topLinkStats,
      deviceStats,
      browserStats,
      osStats,
      countryStats,
    };

    setCache(cacheKey, result)
    return successResponse(res, "ok", result);


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

    const uniqueVisitors = await prisma.$queryRaw`
  SELECT COUNT(DISTINCT "ipAddress")::int as total
  FROM "Click"
  WHERE "linkId" = ${link.id}
`;

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


    const [deviceStats, browserStats, osStats, countryStats] = await Promise.all([
      prisma.click.groupBy({
        by: ["device"],
        where: { linkId: link.id },
        _count: { device: true },
        orderBy: { _count: { device: "desc" } },
      }),
      prisma.click.groupBy({
        by: ["browser"],
        where: { linkId: link.id },
        _count: { browser: true },
        orderBy: { _count: { browser: "desc" } },
        take: 5,
      }),
      prisma.click.groupBy({
        by: ["os"],
        where: { linkId: link.id },
        _count: { os: true },
        orderBy: { _count: { os: "desc" } },
        take: 5,
      }),
      prisma.click.groupBy({
        by: ["country"],
        where: { linkId: link.id },
        _count: { country: true },
        orderBy: { _count: { country: "desc" } },
        take: 10,
      }),
    ]);

    return successResponse(res, "ok", {
      totalClicks,
      uniqueVisitors: uniqueVisitors.length,
      dailyStats,
      mode: link.mode,
      expiresAt: link.expiresAt,
      deviceStats,
      browserStats,
      osStats,
      countryStats,
    });

  } catch (err) {
    console.error(err);
    return errorResponse(res, "error", { message: err.message });
  }
};


const setPassword = async (req, res) => {
  try {
    const { slug } = req.params;
    const { password } = req.body;

    const link = await prisma.link.findFirst({
      where: { shortSlug: slug, userId: req.user.id },
    });
    if (!link) return errorResponse(res, "Link not found", null, 404);

    if (!password) {
      // Remove password
      await prisma.link.update({
        where: { shortSlug:slug },
        data: { password: null, isProtected: false },
      });
      return successResponse(res, "Password removed", null);
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.link.update({
      where: { shortSlug:slug },
      data: { password: hashed, isProtected: true },
    });

    return successResponse(res, "Password set", null);
  } catch (err) {
    console.log(err)
    return errorResponse(res, "Server error", { message: err.message }, 500);
  }
};

const verifyPassword = async (req, res) => {
  try {
    const { slug } = req.params;
    const { password } = req.body;

    const link = await prisma.link.findUnique({ where: { shortSlug:slug } });
    if (!link) return errorResponse(res, "Link not found", null, 404);
    if (!link.isProtected) return successResponse(res, "Not protected", { url: link.originalUrl });

    const match = await bcrypt.compare(password, link.password);
    if (!match) return errorResponse(res, "Wrong password", null, 401);

    return successResponse(res, "OK", { url: link.originalUrl });
  } catch (err) {
    console.log(err)
    return errorResponse(res, "Server error", { message: err.message }, 500);
  }
};

export { index, createShortLink, getGlobalAnalytics, updateLinkMode, getLinkDetailAnalytics, setPassword, verifyPassword }