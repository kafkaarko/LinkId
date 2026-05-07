import QRCode from "qrcode";

export const generateQR = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ message: "URL required" });
    }

    const qr = await QRCode.toDataURL(url);

    return res.json({
      qr
    });

  } catch (err) {
    return res.status(500).json({
      message: err.message
    });
  }
};