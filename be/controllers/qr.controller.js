// controllers/qr.controller.js
import QRCode from "qrcode";
import { createCanvas, loadImage } from "canvas"; // npm i canvas
import { errorResponse } from "../utils/response.util.js";

export const generateQR = async (req, res) => {
  try {
    const {
      url,
      foreground = "#000000",
      background = "#ffffff",
      size = 256,
      logo,         // base64 data URL, opsional
    } = req.body;  // atau req.body jika POST

    if (!url) return errorResponse(res, "URL required", null, 400);
    const px = Math.min(Math.max(Number(size) || 256, 128), 1024);

    // 1. Generate QR ke canvas
    const canvas = createCanvas(px, px);
    await QRCode.toCanvas(canvas, url, {
      width: px,
      margin: 2,
      color: {
        dark: foreground,
        light: background,
      },
    });

    // 2. Tempel logo di tengah (SUPER_USER only — validasi role di middleware)
    if (logo) {
      const ctx = canvas.getContext("2d");
      const img = await loadImage(logo); // base64 aman diload langsung
      const logoSize = px * 0.22;
      const pad = logoSize * 0.15;
      const x = (px - logoSize) / 2;
      const y = (px - logoSize) / 2;

      // White padding box supaya QR tetap terbaca
      ctx.fillStyle = background;
      ctx.beginPath();
      ctx.roundRect(x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2, 6);
      ctx.fill();

      ctx.drawImage(img, x, y, logoSize, logoSize);
    }

    const qr = canvas.toDataURL("image/png");
    return res.json({ qr });

  } catch (err) {
    console.log(err);
    return errorResponse(res, "Server error", { message: err.message }, 500);
  }
};