// analyticsCache.js - simple in-memory cache
const cache = new Map();

const CACHE_TTL = 5 * 60 * 1000; // 5 menit

export const getCache = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
};

export const setCache = (key, data, ttl = CACHE_TTL) => {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });
};

export const deleteCache = (key) => cache.delete(key);

export const deleteCacheByPattern = (pattern) => {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
};