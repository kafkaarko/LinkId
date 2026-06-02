import ogs from "open-graph-scraper";
import pLimit from "p-limit";
import { LRUCache } from "lru-cache";

const limit = pLimit(3);

const cache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 30,
});

// ─── validators ───────────────────────────────────────
const isValidUrl = (url) => {
  try {
    const u = new URL(url);
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
};

// ─── platform special handlers ────────────────────────
const isYoutube = (url) =>
  url.includes("youtube.com") || url.includes("youtu.be");

const isTwitter = (url) =>
  url.includes("twitter.com") || url.includes("x.com");

const isInstagram = (url) => url.includes("instagram.com");

const isTiktok = (url) => url.includes("tiktok.com");

const getYoutubePreview = (url) => {
  try {
    const parsed = new URL(url);
    const id =
      parsed.searchParams.get("v") ||
      parsed.hostname === "youtu.be"
        ? parsed.pathname.slice(1)
        : parsed.pathname.split("/").pop();

    if (!id) return null;

    return {
      title: "YouTube Video",
      description: "Klik untuk tonton di YouTube",
      image: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
      imageFallback: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      url,
      platform: "youtube",
    };
  } catch {
    return null;
  }
};

// Platform yang block scraping — return branded fallback
const getPlatformFallback = (url, platform) => ({
  title: {
    twitter: "Twitter / X",
    instagram: "Instagram",
    tiktok: "TikTok",
  }[platform],
  description: "Buka link untuk lihat konten",
  image: null,
  url,
  platform,
});

// ─── clean & pick best image ──────────────────────────
const pickBestImage = (images = []) => {
  if (!images.length) return null;

  // Sort by area kalau ada width/height
  const sorted = [...images].sort((a, b) => {
    const aArea = (a.width || 0) * (a.height || 0);
    const bArea = (b.width || 0) * (b.height || 0);
    return bArea - aArea;
  });

  // Filter out icon/logo kecil
  const filtered = sorted.filter((img) => {
    if (img.width && img.width < 100) return false;
    if (img.height && img.height < 100) return false;
    return true;
  });

  return (filtered[0]?.url || sorted[0]?.url) ?? null;
};

const cleanText = (text = "") =>
  text.replace(/\s+/g, " ").trim().slice(0, 300);

// ─── main scraper ─────────────────────────────────────
const scrapeOG = async (url) => {
  const { result } = await ogs({
    url,
    fetchOptions: {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept-Language": "en-US,en;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000), // timeout 8 detik
    },
    onlyGetOpenGraphInfo: false, // ambil semua meta tag
  });

  // Kumpulkan semua kandidat image
  const imagePool = [
    ...(result.ogImage || []),
    ...(result.twitterImage || []),
    result.ogImageURL ? [{ url: result.ogImageURL }] : [],
  ].flat();

  const image = pickBestImage(imagePool);

  const title =
    cleanText(result.ogTitle) ||
    cleanText(result.twitterTitle) ||
    cleanText(result.dcTitle) ||
    "No title";

  const description =
    cleanText(result.ogDescription) ||
    cleanText(result.twitterDescription) ||
    cleanText(result.dcDescription) ||
    "";

  // Favicon fallback kalau tidak ada image sama sekali
  const favicon = result.favicon
    ? result.favicon.startsWith("http")
      ? result.favicon
      : `${new URL(url).origin}${result.favicon}`
    : `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`;

  return {
    title,
    description,
    image: image || favicon,
    url: result.ogUrl || url,
    siteName: result.ogSiteName || new URL(url).hostname,
    platform: "web",
  };
};

// ─── main export ──────────────────────────────────────
export const getLinkPreview = async (url) => {
  if (!isValidUrl(url)) throw new Error("Invalid URL");

  // Cache hit
  if (cache.has(url)) return cache.get(url);

  let result;

  try {
    // Platform special handlers
    if (isYoutube(url)) {
      result = getYoutubePreview(url);
    } else if (isTwitter(url)) {
      result = getPlatformFallback(url, "twitter");
    } else if (isInstagram(url)) {
      result = getPlatformFallback(url, "instagram");
    } else if (isTiktok(url)) {
      result = getPlatformFallback(url, "tiktok");
    } else {
      // Normal scraping dengan rate limit
      result = await limit(() => scrapeOG(url));
    }
  } catch (err) {
    // Graceful fallback — jangan error, tetap return sesuatu
    console.error("Preview failed:", url, err.message);
    result = {
      title: new URL(url).hostname,
      description: "",
      image: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`,
      url,
      siteName: new URL(url).hostname,
      platform: "web",
    };
  }

  console.log("PREVIEW:", url, "→", result.title);
  cache.set(url, result);
  return result;
};