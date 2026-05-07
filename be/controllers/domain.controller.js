import dns from "dns/promises";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { successResponse, errorResponse } from "../utils/response.util.js";


// 🔥 STEP 1: ADD DOMAIN (generate token)
export const addDomain = async (req, res) => {
  try {
    const { domain } = req.body;
    const userId = Number(req.user.id);

    if (!domain) {
      return errorResponse(res, "Domain wajib diisi");
    }

    const existing = await prisma.domain.findUnique({
      where: { domain },
    });

    if (existing) {
      return errorResponse(res, "Domain sudah digunakan");
    }

    const token = crypto.randomBytes(16).toString("hex");

    const newDomain = await prisma.domain.create({
      data: {
        domain,
        userId,
        verificationToken: token,
      },
    });

    return successResponse(res, "Domain ditambahkan", {
      domain: newDomain.domain,
      txtRecord: `linkid-verification=${token}`,
    });

  } catch (err) {
    return errorResponse(res, "error", { message: err.message });
  }
};



// 🔥 STEP 2: VERIFY DOMAIN
export const verifyDomain = async (req, res) => {
  try {
    const { host } = req.body;
    const userId = Number(req.user.id);

    const domainData = await prisma.domain.findFirst({
      where: {
        host,
        userId,
      },
    });

    if (!domainData) {
      return errorResponse(res, "Domain tidak ditemukan");
    }

    if (domainData.isVerified) {
      return successResponse(res, "Sudah verified");
    }

    // 🔥 ambil TXT records
    const records = await dns.resolveTxt(host);

    const flatRecords = records.flat().join(" ");

    const expected = `linkid-verification=${domainData.verificationToken}`;

    if (!flatRecords.includes(expected)) {
      return errorResponse(res, "TXT record tidak cocok");
    }

    // 🔥 UPDATE VERIFIED
    await prisma.domain.update({
      host: { id: domainData.id },
      data: { isVerified: true },
    });

    return successResponse(res, "Domain verified 🚀");

  } catch (err) {
    console.log(err);
    return errorResponse(res, "Verification gagal", {
      message: err.message,
    });
  }
};