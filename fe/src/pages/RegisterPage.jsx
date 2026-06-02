import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError("Nama, email, dan password wajib diisi.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const guestId = localStorage.getItem("guest_id");
      await register({ ...form, guestIdentifier: guestId });
      navigate("/login");
    } catch (err) {
      setError(err?.message || "Registrasi gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl border border-indigo-500/20 bg-indigo-500/10">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-indigo-400">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white/60">LinkId</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white/90 md:text-2xl">Buat akun baru</h2>
            <p className="mt-1 text-sm text-white/35">Gratis, tanpa syarat tersembunyi.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs text-white/40">Nama lengkap</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full rounded-xl border border-white/[0.08] bg-[#111] px-4 py-3 text-sm text-white/90 placeholder-white/20 outline-none transition focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-white/40">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="email@contoh.com"
                className="w-full rounded-xl border border-white/[0.08] bg-[#111] px-4 py-3 text-sm text-white/90 placeholder-white/20 outline-none transition focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-white/40">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 8 karakter"
                className="w-full rounded-xl border border-white/[0.08] bg-[#111] px-4 py-3 text-sm text-white/90 placeholder-white/20 outline-none transition focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/15 bg-red-500/[0.06] px-4 py-3 text-xs text-red-400/80">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-white/90 py-3 text-sm font-medium text-black transition hover:bg-white disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                  </svg>
                  Mendaftar...
                </>
              ) : "Daftar"}
            </button>
          </div>

          {/* Benefit hints */}
          <div className="mt-4 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
            <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-white/25">Keuntungan daftar</p>
            <ul className="space-y-1 text-xs text-white/35">
              <li className="flex gap-2"><span className="text-indigo-400/50">✓</span> Simpan link tanpa batas</li>
              <li className="flex gap-2"><span className="text-indigo-400/50">✓</span> Custom slug untuk link</li>
              <li className="flex gap-2"><span className="text-indigo-400/50">✓</span> Analytics (upgrade ke Super User)</li>
              <li className="flex gap-2"><span className="text-indigo-400/50">✓</span> Fitur Bio page untuk kepentingan pribadi</li>

            </ul>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-white/35">
            <span>Sudah punya akun?</span>
            <Link to="/login" className="text-indigo-400/70 transition hover:text-indigo-400 underline underline-offset-4">
              Login di sini
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}