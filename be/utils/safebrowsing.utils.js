// utils/safebrowsing.util.js
const SUSPICIOUS_PATTERNS = [
  { pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, type: "IP_ADDRESS" },           // IP langsung
  { pattern: /login|signin|verify|secure|account|update|confirm/i, type: "PHISHING" }, // kata phishing
  { pattern: /paypal|bankbri|bca|mandiri|bni/i, type: "BRAND_IMPERSONATION" },       // brand spoofing
  { pattern: /-{2,}/, type: "TYPOSQUATTING" },                                        // banyak dash
  { pattern: /\.(xyz|tk|ml|ga|cf|gq)$/i, type: "SUSPICIOUS_TLD" },                  // TLD murahan
  { pattern: /bit\.ly|tinyurl|shorturl|is\.gd/i, type: "SHORTLINK_IN_SHORTLINK" },  // shortlink chain
  { pattern: /free|win|prize|claim|reward|bonus/i, type: "SCAM" },                  // kata scam
];

export const checkUrlSafety = (url) => {
  try {
    const parsed = new URL(url);
    const fullUrl = url.toLowerCase();
    const hostname = parsed.hostname.toLowerCase();

    for (const { pattern, type } of SUSPICIOUS_PATTERNS) {
      if (pattern.test(fullUrl) || pattern.test(hostname)) {
        return { isThreat: true, threatType: type };
      }
    }

    return { isThreat: false, threatType: null };
  } catch {
    return { isThreat: true, threatType: "INVALID_URL" };
  }
};