import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, authLoading } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate("/profile");
  }, [authLoading, isAuthenticated, navigate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Email dan password wajib diisi.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await login(form);
      navigate("/profile");
    } catch {
      setError("Email atau password salah.");
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
            <h2 className="text-xl font-semibold text-white/90 md:text-2xl">Selamat datang kembali</h2>
            <p className="mt-1 text-sm text-white/35">Masuk ke akun Anda untuk melanjutkan.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs text-white/40">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="email@contoh.com"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
                className="w-full rounded-xl border border-white/[0.08] bg-[#111] px-4 py-3 text-sm text-white/90 placeholder-white/20 outline-none transition focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-white/40">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
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
              type=""
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-white/90 py-3 text-sm font-medium text-black transition hover:bg-white disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                  </svg>
                  Masuk...
                </>
              ) : "Masuk"} 
            </button>
          </div>

          <div className="mt-5 flex items-center justify-between text-xs text-white/35">
            <span>Belum punya akun?</span>
            <Link to="/register" className="text-indigo-400/70 transition hover:text-indigo-400 underline underline-offset-4">
              Daftar sekarang
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}