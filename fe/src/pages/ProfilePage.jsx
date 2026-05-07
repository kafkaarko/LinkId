import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

function formatJoinDate(date) {
  try {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

function MetaCard({ label, value, accent = false }) {
  return (
    <div className={`rounded-xl border p-3 md:p-4 ${accent ? "border-indigo-500/20 bg-indigo-500/[0.05]" : "border-white/[0.06] bg-white/[0.02]"
      }`}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">{label}</p>
      <p className={`mt-1.5 text-sm font-medium ${accent ? "text-indigo-400/90" : "text-white/75"}`}>{value}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { isAuthenticated, user, updateProfile, setUser, refreshUser } = useAuth();

  const [links, setLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [status, setStatus] = useState({
    type: "", // success | error | loading
    message: "",
  });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

const itemsPerPage = 5;
const totalPages = Math.ceil(links.length / itemsPerPage);

const paginatedLinks = links.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

  const PLANS = [
    {
      id: "FREE",
      name: "User",
      price: "Gratis",
      features: [
        "100 link / bulan",
        "5 custom slug",
        "Limited analytics",
      ],
    },
    {
      id: "SUPER_USER",
      name: "Super User",
      price: "Gratis (dummy 😏)",
      features: [
        "500 link / bulan",
        "Unlimited custom slug",
        "Full analytics",
      ],
    },
  ];
  useEffect(() => {
    if (!user) return;

    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
    });

    const fetchLinks = async () => {
      try {
        const res = await api.get("/short/all");
        setLinks(res.data.data.links || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingLinks(false);
      }
    };

    fetchLinks();
  }, [user]);

  useEffect(() => {
    if (!showUpgradeModal) {
      setSelectedPlan(null);
    }
  }, [showUpgradeModal]);

  const allLink = links;

  const profileMeta = useMemo(() => [
    { label: "Role", value: user?.role ?? "-", accent: user?.role === "SUPER_USER" },
    { label: "Subcription", value: user?.subscriptionUntil ? formatJoinDate(user?.subscriptionUntil) : "-" },
    { label: "Bergabung", value: formatJoinDate(user?.createdAt) },
  ], [user]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-white/50">Silakan login untuk melihat profil.</p>
        <Link to="/login" className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-white/70 transition hover:bg-white/[0.08]">
          Login
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setStatus({ type: "loading", message: "Menyimpan..." });

      await updateProfile(form);

      setStatus({
        type: "success",
        message: "Profil berhasil diperbarui ✓",
      });
    } catch (err) {
      setStatus({
        type: "error",
        message: err?.message || "Update gagal.",
      });
    }
  };

  const handleCopy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);

      setStatus({
        type: "success",
        message: "Link disalin ✓",
      });
    } catch {
      setStatus({
        type: "error",
        message: "Clipboard gagal.",
      });
    }
  };

  const handleUpgrade = async () => {
    try {
      setUpgradeLoading(true);

      const res = await api.post("/user/upgrade");

      // setUser(res.data.data);

      setStatus({
        type: "success",
        message: "Upgrade berhasil 🚀",
      });
      console.log(refreshUser)
    } catch (err) {
      setStatus({
        type: "error",
        message: err?.message || "Upgrade gagal.",
      });
    } finally {
      setUpgradeLoading(false);
    }
  };

  return (
    <section className="space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 md:px-6 md:py-5">
        <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-base font-semibold uppercase text-indigo-400 md:h-12 md:w-12">
          {user?.name?.[0] ?? "U"}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white/90 md:text-xl">{user?.name}</h2>
          <p className="text-xs text-white/35 md:text-sm">{user?.email}</p>
        </div>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {profileMeta.map((item) => (
          <MetaCard key={item.label} {...item} />
        ))}
      </div>

      {/* Upgrade */}
      <div className={`rounded-2xl border p-4 md:p-5 ${user?.role === "SUPER_USER"
        ? "border-emerald-500/15 bg-emerald-500/[0.04]"
        : "border-indigo-500/15 bg-indigo-500/[0.04]"
        }`}>
        <h3 className="mb-2 text-sm font-medium text-white/80">Upgrade Plan</h3>

        {user?.role === "SUPER_USER" ? (
          <div className="space-y-1">
            <p className="text-xs text-emerald-400/80">Anda sudah Super User ✓</p>
            <p className="text-xs text-white/35">Aktif hingga: {formatJoinDate(user?.subscriptionUntil)}</p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs leading-relaxed text-white/40">
              Buka analytics lengkap, unlimited custom slug, dan fitur lainnya.
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="rounded-xl bg-white/90 px-4 py-2 text-sm font-medium text-black"
            >
              Upgrade ke Super User
            </button>
          </>
        )}
      </div>

      {/* Last Link */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 md:p-5">
        <h3 className="mb-3 text-sm font-medium text-white/70">Link Terakhir</h3>

        {paginatedLinks.length ? (
          paginatedLinks.map((link) => (
            <div key={link.id} className="rounded-xl border border-white/[0.06] bg-[#111] p-3 mb-3">

              <p className="truncate text-xs text-white/30">
                {link.originalUrl}
              </p>

              <div className="mt-1.5 flex items-center justify-between gap-3">
                <a
                  href={`/${link.shortSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-sm text-indigo-400/80 hover:text-indigo-400 transition"
                >
                  
                  {window.location.origin}/{link.shortSlug}
                </a>

                <button
                  onClick={() => handleCopy(`${window.location.origin}/${link.shortSlug}`)}
                  className="flex-shrink-0 rounded-lg border border-white/[0.06] px-2.5 py-1 text-xs text-white/40 hover:text-white/70"
                >
                  Copy
                </button>
              </div>

              <Link
                to={`/analistic/${link.shortSlug}`} // 🔥 pake slug, bukan full URL
                className={`mt-2 block text-xs transition ${user?.role === "SUPER_USER"
                    ? "text-indigo-400/60 hover:text-indigo-400"
                    : "pointer-events-none text-white/20"
                  }`}
              >
                Lihat Analytics → {user?.role === "SUPER_USER" ? "" : "🔒"}
              </Link>

            </div>
          ))
        ) : (
          <p className="text-xs text-white/30">Belum ada link</p>
        )}
        {/* PAGINATION */}
{totalPages > 1 && (
  <div className="mt-4 flex items-center justify-center gap-2">

    <button
      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
      disabled={currentPage === 1}
      className="rounded-lg border border-white/[0.06] px-3 py-1 text-xs text-white/50 disabled:opacity-30"
    >
      Prev
    </button>

    {Array.from({ length: totalPages }).map((_, i) => {
      const page = i + 1;

      return (
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`h-8 w-8 rounded-lg text-xs transition ${
            currentPage === page
              ? "bg-indigo-500 text-white"
              : "border border-white/[0.06] text-white/50 hover:text-white"
          }`}
        >
          {page}
        </button>
      );
    })}

    <button
      onClick={() =>
        setCurrentPage((p) => Math.min(p + 1, totalPages))
      }
      disabled={currentPage === totalPages}
      className="rounded-lg border border-white/[0.06] px-3 py-1 text-xs text-white/50 disabled:opacity-30"
    >
      Next
    </button>

  </div>
)}
      </div>

      {/* Edit Profile */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 md:p-5">
        <h3 className="mb-4 text-sm font-medium text-white/70">Edit Profil</h3>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs text-white/35">Nama</label>
            <input
              className="w-full rounded-xl border border-white/[0.08] bg-[#111] px-4 py-3 text-sm text-white/90 placeholder-white/20 outline-none transition focus:border-indigo-500/40"
              placeholder="Nama lengkap"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-white/35">Email</label>
            <input
              className="w-full rounded-xl border border-white/[0.08] bg-[#111] px-4 py-3 text-sm text-white/90 placeholder-white/20 outline-none transition focus:border-indigo-500/40"
              placeholder="email@contoh.com"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-white/35">Password baru (opsional)</label>
            <input
              type="password"
              className="w-full rounded-xl border border-white/[0.08] bg-[#111] px-4 py-3 text-sm text-white/90 placeholder-white/20 outline-none transition focus:border-indigo-500/40"
              placeholder="Kosongkan jika tidak diubah"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full rounded-xl bg-white/90 py-2.5 text-sm font-medium text-black transition hover:bg-white"
          >
            Simpan Perubahan
          </button>

          {status.message && (
            <p
              className={`text-xs ${status.type === "success"
                ? "text-emerald-400/70"
                : status.type === "error"
                  ? "text-red-400/70"
                  : "text-white/40"
                }`}
            >
              {status.message}
            </p>
          )}
        </div>
      </div>
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-[90%] max-w-md rounded-2xl bg-[#111] p-5 border border-white/[0.08]">

            <h3 className="text-lg font-semibold text-white mb-3">
              Upgrade Plan 🚀
            </h3>

            <p className="text-xs text-white/40 mb-4">
              Pilih plan terbaik buat kebutuhan lu
            </p>

            <div className="space-y-3">
              {PLANS.map((plan) => {
                const isActive = selectedPlan === plan.id;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`cursor-pointer rounded-xl border p-4 transition ${isActive
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-white/[0.06] hover:border-white/20"
                      }`}
                  >
                    {/* HEADER */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/80 font-medium">
                        {plan.name}
                      </span>
                      <span className="text-xs text-white/40">
                        {plan.price}
                      </span>
                    </div>

                    {/* FEATURES (ONLY IF SELECTED) */}
                    {isActive && (
                      <div className="mt-4 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                        <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-white/25">
                          Keuntungan
                        </p>

                        <ul className="space-y-1 text-xs text-white/35">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-indigo-400/50">✓</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ACTION */}
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 rounded-xl border border-white/[0.06] py-2 text-white/60"
              >
                Batal
              </button>

              <button
                disabled={!selectedPlan || upgradeLoading}
                onClick={async () => {
                  try {
                    setUpgradeLoading(true);

                    const res = await api.post("/user/upgrade", {
                      plan: selectedPlan,
                    });

                    // 🔥 IMPORTANT: normalize response
                    setUser(res.data.data); // 🔥 single source of truth


                    setStatus({
                      type: "success",
                      message: "Upgrade berhasil 🚀",
                    });

                    setShowUpgradeModal(false);
                    setSelectedPlan(null);

                  } catch (err) {
                    setStatus({
                      type: "error",
                      message: "Upgrade gagal",
                    });
                  } finally {
                    setUpgradeLoading(false);
                  }
                }}
                className="flex-1 rounded-xl bg-white text-black py-2 disabled:opacity-50"
              >
                {upgradeLoading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}