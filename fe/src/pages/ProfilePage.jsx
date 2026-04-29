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

function MetaCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-white/40 uppercase">{label}</p>
      <p className="mt-2 text-white font-medium">{value}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { isAuthenticated, user, updateProfile } = useAuth();

  const [links, setLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [status, setStatus] = useState("");

  // 🔥 FETCH LINKS
  useEffect(() => {
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
  }, []);

  // 🔥 SYNC USER → FORM
  useEffect(() => {
    if (!user) return;

    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
    });
  }, [user]);

  const lastLink = links[0];

  const profileMeta = useMemo(
    () => [
      { label: "Role", value: user?.role ?? "-" },
      { label: "Plan", value: user?.plan ?? "-" },
      { label: "Joined", value: formatJoinDate(user?.createdAt) },
    ],
    [user]
  );

  if (!isAuthenticated) {
    return (
      <div className="text-white text-center mt-20">
        Login dulu bro, jangan ngintip doang 😏
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setStatus("Updating...");

      await updateProfile(form);

      setStatus("Profile updated successfully 🚀");
    } catch (err) {
      setStatus(err?.message || "Update gagal 😑");
    }
  };

  const handleCopy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("Link copied 🔥");
    } catch {
      setStatus("Clipboard gagal.");
    }
  };

  return (
    <section className="space-y-6">
      {/* 🔥 HEADER */}
      <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03]">
        <h2 className="text-2xl text-white font-semibold">
          {user?.name}
        </h2>
        <p className="text-white/50">{user?.email}</p>
      </div>

      {/* 🔥 META */}
      <div className="grid grid-cols-3 gap-4">
        {profileMeta.map((item) => (
          <MetaCard key={item.label} {...item} />
        ))}
      </div>

      {/* 🔥 LAST LINK */}
      <div className="p-6 rounded-2xl border border-white/10 bg-[#090909]">
        <h3 className="text-white mb-3">Last Created Link</h3>

        {loadingLinks ? (
          <p className="text-white/40">Loading...</p>
        ) : lastLink ? (
          <div className="space-y-2">
            <p className="text-xs text-white/40 truncate">
              {lastLink.originalUrl}
            </p>

            <div className="flex justify-between items-center">
              <a
                href={lastLink.shortenedUrl}
                target="_blank"
                rel="noreferrer"
                className="text-white underline"
              >
                {lastLink.shortenedUrl}
              </a>

              <button
                onClick={() => handleCopy(lastLink.shortenedUrl)}
                className="text-xs text-white/60 hover:text-white"
              >
                Copy
              </button>
            </div>

            <Link
              to={`/analistic`}
              className="text-xs text-blue-400"
            >
              View Analytics →
            </Link>
          </div>
        ) : (
          <p className="text-white/40">
            Belum ada link. Lu belum ngapa-ngapain 😑
          </p>
        )}
      </div>

      {/* 🔥 EDIT PROFILE (BOTTOM) */}
      <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03]">
        <h3 className="text-white mb-4">Edit Profile</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="input w-full bg-[#090909] text-white"
            placeholder="Name"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />

          <input
            className="input w-full bg-[#090909] text-white"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
          />

          <input
            className="input w-full bg-[#090909] text-white"
            placeholder="Password (optional)"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password: e.target.value }))
            }
          />

          <button className="btn bg-white text-black">
            Save Changes
          </button>
        </form>

        {status && (
          <p className="text-sm text-white/50 mt-3">{status}</p>
        )}
      </div>
    </section>
  );
}