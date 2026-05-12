import { clickQueue } from "../lib/clickQueue.js";
import { prisma } from "../lib/prisma.js";
import { recentClicks } from "../lib/recentClicks.js";
import { errorResponse, successResponse } from "../utils/response.util.js";
// import {slugCache} from "../lib/slugCache.js";
import { LRUCache as LRU } from "lru-cache";
import crypto from "crypto";

const slugCache = new LRU({
  max: 1000,
  ttl: 1000 * 60 * 10, // 10 menit
});



const index = async (req, res) => {
  try {
    const click = await prisma.click.findMany()
    !click && errorResponse(res, "data tidak ditemukan")
    return successResponse(res, "berhasil mengambil data", click)
  } catch (error) {
    console.error(error)
    return errorResponse(res, "coba lagi", { message: error.message })
  }
}

const getByUser = async (req, res) => {
  try {
    const clicks = await prisma.click.findMany({
      where: {
        link: {
          userId: Number(req.user.id)
        }
      },
      include: {
        link: {
          select: {
            id: true,
            shortSlug: true,
          }
        }
      }
    });

    if (!clicks || clicks.length === 0) {
      return errorResponse(res, "data tidak ditemukan")
    }

    return successResponse(res, "berhasil mengambil data", clicks)
  } catch (error) {
    return errorResponse(res, "coba lagi", { message: error.message })
  }
}

const trackClickAsync = async (linkId, req) => {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress;

    const userAgent = req.headers["user-agent"] || "";

    const botPatterns = [
      "bot",
      "crawl",
      "spider",
      "preview",
      "facebook",
      "whatsapp",
      "telegram",
      "discord",
    ];

    const isBot = botPatterns.some((p) =>
      userAgent.toLowerCase().includes(p)
    );

    if (isBot) return;

    // 🔥 fingerprint
    const today = new Date().toISOString().split("T")[0];

    const rawFingerprint =
      `${linkId}-${ip}-${userAgent}-${today}`;

    const fingerprint = crypto
      .createHash("sha256")
      .update(rawFingerprint)
      .digest("hex");

    try {
      await prisma.uniqueVisitor.create({
        data: {
          linkId,
          fingerprint,
          visitedDate: today,
        },
      });
    } catch (err) {
      // 🔥 ignore duplicate unique visitor
      if (err.code !== "P2002") {
        console.error(err);
      }
    }

    // 🔥 duplicate within 3 sec
    if (recentClicks.has(fingerprint)) {
      return;
    }

    recentClicks.set(fingerprint, true);

    setTimeout(() => {
      recentClicks.delete(fingerprint);
    }, 3000);

    // 🔥 masuk queue
    clickQueue.push({
      linkId,
      ipAddress: ip,
      userAgent,
      referer: req.headers.referer || null,
      clickedAt: new Date(),
    });

  } catch (err) {
    console.error(err);
  }
};

// 🔥 MAIN CONTROLLER
const redirectAndTrack = async (req, res) => {
  try {
    const { slug } = req.params;
    const { preview } = req.query;

    const host = req.get("host");

    const link = await prisma.link.findFirst({
      where: {
        shortSlug: slug,
        OR: [
          { domain: { host } },
          { domainId: null }
        ]
      },
      include: {
        domain: true
      }
    });

    if (!link) {
      return res.status(404).send("<h3>Link tidak ditemukan</h3>");
    }

    // 🔥 EXPIRED
    if (link.expiresAt && new Date() > link.expiresAt) {
      return res.status(410).send(`
        <h2>Link Expired ⚰️</h2>
        <p>Event sudah selesai bro.</p>
      `);
    }

    // 🔥 PREVIEW MODE
    if (preview === "true") {
      return res.redirect(link.originalUrl);
    }

    // 🔥 TRACK ASYNC
    trackClickAsync(link.id, req);

    // 🔥 REDIRECT
    return res.redirect(link.originalUrl);

  } catch (error) {
    console.error(error);

    return res.status(500).send("Internal Server Error");
  }
};
export { index, getByUser, redirectAndTrack, trackClickAsync }