import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

// 🔥 validator
const isValidUrl = (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

// 🔥 normalize url
// const normalizeUrl = (value) => {
//   if (!value.startsWith("http://") && !value.startsWith("https://")) {
//     return "https://" + value;
//   }
//   return value;
// };

function StatCard({ label, value, helper }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.22em] text-white/38">{label}</p>
      <h3 className="mt-3 text-3xl font-semibold text-white">{value}</h3>
      {helper && (
        <p className="mt-2 text-sm leading-6 text-white/48">{helper}</p>
      )}
    </div>
  );
}

export default function HomePage() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState("Ready to cook link 🔥");
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔥 stats
  const stats = useMemo(() => {
    const trimmedText = text.trim();
    const words = trimmedText ? trimmedText.split(/\s+/).length : 0;
    const lines = trimmedText ? trimmedText.split(/\n/).length : 0;

    return {
      characters: text.length,
      words,
      lines,
    };
  }, [text]);

  // 🔥 fetch links
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const res = await api.get("/short/all");
        setLinks(res.data.data.links);
      } catch (err) {
        console.error(err);
      }
    };

    fetchLinks();
  }, []);

  // 🔥 main handler
  const handleGenerate = async () => {
    let url = text.trim();

    if (!url) {
      setStatus("Masukin URL dulu bro, jangan kosong.");
      return;
    }

    // normalize dulu
    // url = normalizeUrl(url);

    // validasi
    if (!isValidUrl(url)) {
      setStatus("Input lu bukan URL valid. Jangan ngaco 😑");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/short/create-short-link", {
        originalUrl: url,
      });

      const data = res.data.data;

      setLinks((prev) => [data, ...prev]);

      setStatus("Link berhasil dipendekin 🚀");
      setText("");
    } catch (err) {
      setStatus(err?.message || "Gagal generate link.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText("");
    setStatus("Textarea dibersihin.");
  };

  const handleCopy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("Link disalin ke clipboard.");
    } catch {
      setStatus("Clipboard gagal.");
    }
  };

  return (
    <section className="space-y-6">
      {/* HERO */}
      <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-8">
        <h2 className="text-3xl font-semibold text-white md:text-5xl">
          URL Shortener Workspace
        </h2>
        <p className="mt-3 text-sm text-white/58">
          Tempel URL valid, otomatis disimpan ke akun lu.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* INPUT PANEL */}
        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="border-b border-white/10 px-6 py-5">
            <h3 className="text-xl text-white">Shorten your link</h3>
          </div>

          <div className="space-y-5 px-6 py-6">
            <input
              className="h-[50px] w-full rounded-[15px] border border-white/10 bg-[#090909] px-4 text-white focus:outline-none"
              placeholder="https://example.com (wajib URL valid)"
              value={text}
              type="text"
              onChange={(e) => setText(e.target.value)}
            />

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn btn-primary bg-white text-black"
              >
                {loading ? "Generating..." : "Shorten Link"}
              </button>

              <button onClick={handleClear} className="btn btn-ghost">
                Clear
              </button>
            </div>

            <div className="text-sm text-white/60">
              <b>Status:</b> {status}
            </div>

            {/* RESULT */}
            <div className="space-y-3">
              {links.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-[#090909] p-4"
                >
                  <p className="text-xs text-white/40 truncate">
                    {item.originalUrl}
                  </p>

                  <div className="flex justify-between items-center mt-2">
                    <a
                      href={item.shortenedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white underline"
                    >
                      {item.shortenedUrl}
                    </a>

                    <button
                      onClick={() => handleCopy(item.shortenedUrl)}
                      className="text-xs text-white/60 hover:text-white"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-4">
          <StatCard label="Characters" value={stats.characters} />
          <StatCard label="Words" value={stats.words} />
          <StatCard label="Lines" value={stats.lines} />
        </aside>
      </div>
    </section>
  );
}