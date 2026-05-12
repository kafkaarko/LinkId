import axios from "axios";
import ogs from "open-graph-scraper";
import pLimit from "p-limit";
import { LRUCache } from "lru-cache";

const limit = pLimit(2); // max 2 request parallel

const cache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 30,
});

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// 🔥 detect youtube
const isYoutube = (url) => {
  return url.includes("youtube.com") || url.includes("youtu.be");
};

const getYoutubePreview = (url) => {
  try {
    const parsed = new URL(url);
    const id =
      parsed.searchParams.get("v") ||
      parsed.pathname.split("/").pop();

    return {
      title: "YouTube Video",
      description: "Preview YouTube",
      image: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      url,
    };
  } catch {
    return null;
  }
};

export const getLinkPreview = async (url) => {
  if (!isValidUrl(url)) {
    throw new Error("Invalid URL");
  }

  // 🔥 cache hit
  if (cache.has(url)) {
    return cache.get(url);
  }

  // 🔥 youtube special handler
  if (isYoutube(url)) {
    const yt = getYoutubePreview(url);
    cache.set(url, yt);
    return yt;
  }

  // 🔥 normal OG scraping (rate limited)
  const result = await limit(async () => {
    try {
      const { result } = await ogs({
        url,
        fetchOptions: {
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
        },
      });

      return {
        title: result.ogTitle || "No title",
        description: result.ogDescription || "",
        image: result.ogImage?.[0]?.url || null,
        url,
      };
    } catch (err) {
      return {
        title: "Preview gagal",
        description: "",
        image: null,
        url,
      };
    }
  });
  console.log("PREVIEW SCRAPING:", url);
  cache.set(url, result);
  return result;
};