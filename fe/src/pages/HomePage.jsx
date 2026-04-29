import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

// 🔥 validator
const isValidUrl = (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};



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
  const [limitReached, setLimitReached] = useState(false);
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);



const itemsPerPage = 5;

const paginatedLinks = useMemo(() => {
  const start = (currentPage - 1) * itemsPerPage;
  return links.slice(start, start + itemsPerPage);
}, [links, currentPage]);

const totalPages = Math.ceil(links.length / itemsPerPage);

const isGuest = !user

  const getGuestId = () => {
    let id = localStorage.getItem("guest_id");

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("guest_id", id);
    }

    return id;
  };

  const guestCount = links.length;
const remaining = 5 - guestCount;
// const limitReached = isGuest && guestCount >= 5;
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

    if (!isValidUrl(url)) {
      setStatus("Input lu bukan URL valid. Jangan ngaco 😑");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/short/create-short-link", {
        originalUrl: url,
        guestIdentifier: getGuestId(), // 🔥 ini kuncinya
      });


      const data = {
  ...res.data.data.data, // newLink dari prisma
  shortenedUrl: res.data.data.shortenedUrl,
};

      setLinks((prev) => [data, ...prev]);

      setStatus("Link berhasil dipendekin 🚀");
      setText("");
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Gagal generate link.";

      // 🔥 detect limit dari backend
      if (message.toLowerCase().includes("limit")) {
        setLimitReached(true);
        setStatus("Limit guest 5 link udah habis. Login biar unlimited 😏");
      } else {
        setStatus(message);
      }
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
{/* {id="uix1"} */}
{isGuest && (
  <p className="text-xs text-white/40">
    Guest: {remaining > 0
      ? `Sisa ${remaining} link lagi`
      : "Limit habis. Login buat unlimited 😏"}
  </p>
)}
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
                disabled={loading || limitReached}
                className="btn btn-primary bg-white text-black disabled:opacity-40"
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
              {paginatedLinks.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-[#090909] p-4"
                >
                  <p className="text-xs text-white/40 truncate">
                    {item?.originalUrl ? item.originalUrl : "-"}
                  </p>

                  <div className="flex justify-between items-center mt-2">
                    <a
                      href={item?.shortenedUrl ? item.shortenedUrl : "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white underline"
                    >
                      {item?.shortenedUrl ? item.shortenedUrl : "-"}
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
              <div className="flex justify-center items-center gap-2 mt-4">

  <button
    disabled={currentPage === 1}
    onClick={() => setCurrentPage((p) => p - 1)}
    className="btn btn-sm"
  >
    Prev
  </button>

  <span className="text-white text-sm">
    Page {currentPage} / {totalPages || 1}
  </span>

  <button
    disabled={currentPage === totalPages || totalPages === 0}
    onClick={() => setCurrentPage((p) => p + 1)}
    className="btn btn-sm"
  >
    Next
  </button>

</div>
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