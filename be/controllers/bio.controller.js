import {prisma} from "../lib/prisma.js";
import { errorResponse, successResponse } from "../utils/response.util.js";
import fs from "fs";
import path from "path";


const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return errorResponse(res, "No file uploaded", null, 400);

    // Hapus avatar lama kalau ada
    const existing = await prisma.bioPage.findUnique({
      where: { userId: req.user.id },
      select: { avatar: true },
    });

    if (existing?.avatar) {
      const oldPath = path.join("uploads/avatars", path.basename(existing.avatar));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const page = await prisma.bioPage.upsert({
      where: { userId: req.user.id },
      update: { avatar: avatarUrl },
      create: { avatar: avatarUrl, userId: req.user.id, title: "", username: `user_${req.user.id}` },
    });

    return successResponse(res, "Avatar uploaded", { avatar: page.avatar });
  } catch (err) {
    console.log(err)
    return errorResponse(res, "Server error", { message: err.message }, 500);
  }
};


// GET public bio page
 const getBioPage = async (req, res) => {
  try {
    const { username } = req.params;
    const bio = await prisma.bioPage.findUnique({
      where: { username },
      include: {
        links: { orderBy: { order: "asc" } },
        user: { select: { id: true } },
      },
    });
    if (!bio) return errorResponse(res, "Bio page not found", null, 404);
    return successResponse(res, "OK", bio);
  } catch (err) {
    console.log(err);
    return errorResponse(res, "Server error", { message: err.message }, 500);
  }
};

 const getMyBioPage = async (req, res) => {
  try {
    const bio = await prisma.bioPage.findUnique({
      where: { userId: req.user.id },
      include: { links: { orderBy: { order: "asc" } } },
    });
    if (!bio) return errorResponse(res, "Bio page not found", null, 404);
    return successResponse(res, "OK", bio);
  } catch (err) {
    return errorResponse(res, "Server error", { message: err.message }, 500);
  }
};

// POST create bio page
 const createBioPage = async (req, res) => {
  try {
    const { username, title, bio, avatar, theme } = req.body;
    const exists = await prisma.bioPage.findUnique({ where: { username } });
    if (exists) return errorResponse(res, "Username already taken", null, 409);

    const page = await prisma.bioPage.create({
      data: { username, title, bio, avatar, theme, userId: req.user.id },
    });
    return successResponse(res, "Bio page created", page, 201);
  } catch (err) {
    console.log(err);
    return errorResponse(res, "Server error", { message: err.message }, 500);
  }
};

// PATCH update bio page
const updateBioPage = async (req, res) => {
  try {
    const { title, bio, avatar, theme, username } = req.body;

    const page = await prisma.bioPage.upsert({
      where: { userId: req.user.id },
      update: { title, bio, avatar, theme, username },
      create: { title, bio, avatar, theme, username, userId: req.user.id },
    });

    return successResponse(res, "Updated", page);
  } catch (err) {
    // Username sudah dipakai orang lain
    if (err.code === "P2002") {
      return errorResponse(res, "Username already taken", null, 409);
    }
    return errorResponse(res, "Server error", { message: err.message }, 500);
  }
};

// POST add link
 const addLink = async (req, res) => {
  try {
    const { label, url, icon, type, order } = req.body;
    const bio = await prisma.bioPage.findUnique({ where: { userId: req.user.id } });
    if (!bio) return errorResponse(res, "Bio page not found", null, 404);

    const link = await prisma.bioLink.create({
      data: { label, url, icon, type, order: order ?? 0, bioPageId: bio.id },
    });
    return successResponse(res, "Link added", link, 201);
  } catch (err) {
    console.log(err);
    return errorResponse(res, "Server error", { message: err.message }, 500);
  }
};

// PATCH update link
 const updateLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { label, url, icon, type, order } = req.body;
    const link = await prisma.bioLink.update({
      where: { id: Number(linkId) },
      data: { label, url, icon, type, order },
    });
    return successResponse(res, "Link updated", link);
  } catch (err) {
    console.log(err);
    return errorResponse(res, "Server error", { message: err.message }, 500);
  }
};

// DELETE link
 const deleteLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    await prisma.bioLink.delete({ where: { id: Number(linkId) } });
    return successResponse(res, "Link deleted", null);
  } catch (err) {
    console.log(err);
    return errorResponse(res, "Server error", { message: err.message }, 500);
  }
};

// PATCH reorder links
 const reorderLinks = async (req, res) => {
  try {
    // body: [{ id: 1, order: 0 }, { id: 2, order: 1 }, ...]
    const { links } = req.body;
    await Promise.all(
      links.map((l) =>
        prisma.bioLink.update({ where: { id: l.id }, data: { order: l.order } })
      )
    );
    return successResponse(res, "Reordered", null);
  } catch (err) {
    console.log(err);
    return errorResponse(res, "Server error", { message: err.message }, 500);
  }
};

// POST track link click (analytics)
 const trackLinkClick = async (req, res) => {
  try {
    const { linkId } = req.params;
    await prisma.bioLink.update({
      where: { id: Number(linkId) },
      data: { clicks: { increment: 1 } },
    });
    return successResponse(res, "Tracked", null);
  } catch (err) {
    console.log(err);
    return errorResponse(res, "Server error", { message: err.message }, 500);
  }
};

export {getBioPage, getMyBioPage, createBioPage, updateBioPage, addLink, updateLink, deleteLink, reorderLinks, trackLinkClick, uploadAvatar}