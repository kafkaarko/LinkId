import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { usePreview } from "../hooks/usePreview";
import PreviewCard from "../components/PreviewCard";

const isValidUrl = (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }

};

function StatCard({ label, value, helper, accent = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 md:p-5 transition ${accent
        ? "border-indigo-500/20 bg-indigo-500/[0.06]"
        : "border-white/[0.06] bg-white/[0.02]"
        }`}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <h3 className="mt-2 text-2xl md:text-3xl font-semibold text-white/90">
        {value}
      </h3>
      {helper && <p className="mt-1.5 text-xs text-white/40">{helper}</p>}
    </div>
  );
}

export default function HomePage() {
  const { user, setUser } = useAuth();

  const [text, setText] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [status, setStatus] = useState("");
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);

  const isGuest = !user;

  const [currentPage, setCurrentPage] = useState(1);
  const { preview, loading: previewLoading } = usePreview(text);

  const itemsPerPage = 5;
  const guestLimit = 5;
  const guestCount = links.length;
  const guestRemaining = Math.max(0, guestLimit - guestCount);

  const paginatedLinks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return links.slice(start, start + itemsPerPage);
  }, [links, currentPage]);

  const totalPages = Math.ceil(links.length / itemsPerPage);

  const usage = user?.usage;

  const customCount = usage?.customCount ?? 0;
  const customLimit = usage?.customLimit;
  const monthlyCount = usage?.monthlyCount ?? 0;
  const monthlyLimit = usage?.monthlyLimit ?? 0;

  const remainingCustom =
    customLimit === null
      ? "Unlimited"
      : Math.max(0, customLimit - customCount);

  const getGuestId = () => {
    let id = localStorage.getItem("guest_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("guest_id", id);
    }
    return id;
  };

  // const linkCopy = {window.location.origin}/{item.shortSlug}

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const res = await api.get("/short/all");
        setLinks(res.data.data.links || []);
      } catch (err) {
        console.error(err);
      }
    };
    const delay = setTimeout(() => {
      if (text) fetchPreview();
    }, 500);

    fetchLinks();
    return () => clearTimeout(delay);
  }, [text]);

  const handleGenerate = async () => {
    const url = text.trim();

    if (!url) return setStatus("Masukkan URL dulu.");
    if (!isValidUrl(url)) return setStatus("URL tidak valid.");

    // 🔥 HARD GUARD (FE level)
    if (monthlyLimit && monthlyCount >= monthlyLimit) {
      return setStatus("Limit bulanan tercapai.");
    }

    if (customSlug && customLimit !== null && customCount >= customLimit) {
      return setStatus("Limit custom slug tercapai.");
    }

    try {
      setLoading(true);
      setStatus("");

      const payload = {
        originalUrl: url,
        guestIdentifier: getGuestId(),
      };

      if (customSlug.trim()) payload.customSlug = customSlug.trim();

      const res = await api.post("/short/create-short-link", payload);

      const data = {
        ...res.data.data.data,
        shortenedUrl: res.data.data.shortenedUrl,
      };

      setLinks((prev) => [data, ...prev]);

      // 🔥 sync usage (biar ga refetch)
      if (user) {
        setUser((prev) => ({
          ...prev,
          usage: {
            ...prev.usage,
            monthlyCount: prev.usage.monthlyCount + 1,
            customCount: data.isCustom
              ? prev.usage.customCount + 1
              : prev.usage.customCount,
          },
        }));
      }

      setStatus("Link berhasil dibuat ✓");
      setText("");
      setCustomSlug("");
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      setStatus(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("Copied ✓");
    } catch {
      setStatus("Clipboard gagal.");
    }
  };

  return (
    <section className="space-y-5">
      {/* HEADER */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
        <h2 className="text-xl font-semibold text-white/90">
          URL Shortener
        </h2>
        {isGuest && (
          <p className="mt-1 text-xs text-white/35">
            Mode guest — maks 5 link.
          </p>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3">

        {/* 🔥 CUSTOM SLUG / GUEST MODE */}
        <StatCard
          label="Custom Slug"
          value={
            isGuest
              ? "Locked"
              : `${customCount} / ${customLimit ?? "∞"}`
          }
          helper={
            isGuest
              ? "Login untuk unlock"
              : typeof remainingCustom === "number"
                ? `${remainingCustom} slot tersisa`
                : remainingCustom
          }
          accent
        />

        {/* 🔥 USAGE */}
        {isGuest ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4 md:p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-500/60">
              Guest Limit
            </p>

            <h3 className="mt-2 text-2xl md:text-3xl font-semibold text-white/90">
              {guestCount} / {guestLimit}
            </h3>

            <p className="mt-1.5 text-xs text-amber-500/70">
              {guestRemaining > 0
                ? `${guestRemaining} link tersisa sebelum kena limit`
                : "Limit habis, login sekarang 😈"}
            </p>
          </div>
        ) : (
          <StatCard
            label="Monthly Usage"
            value={`${monthlyCount} / ${monthlyLimit}`}
            helper="Reset tiap bulan"
          />
        )}
      </div>

      {/* MAIN */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="space-y-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-xl bg-[#111] px-4 py-3 text-white"
          />
          <PreviewCard preview={preview} loading={previewLoading} />

          <input
            value={customSlug}
            disabled={!user}
            onChange={(e) => setCustomSlug(e.target.value)}
            placeholder="custom-slug"
            className="w-full rounded-xl bg-[#111] px-4 py-3 text-white disabled:opacity-40"
          />

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full rounded-xl bg-white text-black py-3"
          >
            {loading ? "Loading..." : "Shorten"}
          </button>

          {status && (
            <p className="text-xs text-white/40">{status}</p>
          )}
        </div>

        {/* LIST */}
        <div className="mt-5 space-y-2">
          {paginatedLinks.map((item) => {

            const shortUrl = `${window.location.origin}/${item.shortSlug}`;

            return (
              <div
                key={item.id}
                className="flex justify-between bg-[#111] px-4 py-3 rounded-xl"
              >
                <div className="truncate">
                  <p className="text-xs text-white/30">
                    {item.originalUrl}
                  </p>

                  <a
                    href={shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400"
                  >
                    {shortUrl}
                  </a>
                </div>

                <button
                  onClick={() => handleCopy(shortUrl)}
                  className="text-xs"
                >
                  Copy
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}