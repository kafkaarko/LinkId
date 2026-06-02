// RedirectPage.jsx
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";

export default function RedirectPage() {
  const { slug } = useParams();

  const [loading, setLoading]       = useState(true);
  const [preview, setPreview]       = useState(null);
  const [error, setError]           = useState("");
  const [state, setState]           = useState("loading"); // loading | protected | preview | error
  const [password, setPassword]     = useState("");
  const [pwError, setPwError]       = useState("");
  const [checking, setChecking]     = useState(false);
  const timeoutRef                  = useRef(null);

  // ─── fetch preview & redirect ─────────────────────
  const loadPreview = async (originalUrl) => {
    const prev = await api.get(`/preview?url=${encodeURIComponent(originalUrl)}`);
    setPreview({ ...prev.data.data, originalUrl });
    setState("preview");
    timeoutRef.current = setTimeout(() => {
      window.location.href = originalUrl;
    }, 3000);
  };

  // ─── initial fetch ────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/${slug}`);

        // Link terkunci → minta password dulu
        if (res.data?.protected) {
          setState("protected");
          setLoading(false);
          return;
        }

        await loadPreview(res.data.data.originalUrl);
      } catch {
        setState("error");
        setError("Link tidak valid / expired");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => clearTimeout(timeoutRef.current);
  }, [slug]);

  // ─── verify password ──────────────────────────────
  const handleVerify = async () => {
    if (!password) return;
    try {
      setChecking(true);
      setPwError("");
      const res = await api.post(`/short/${slug}/verify`, { password });
      await loadPreview(res.data.data.url);
    } catch {
      setPwError("Password salah, coba lagi.");
    } finally {
      setChecking(false);
    }
  };

  // ─── states ───────────────────────────────────────
  if (state === "loading") {
    return (
      <div className="h-screen flex items-center justify-center text-white/40 text-sm">
        Loading...
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="h-screen flex items-center justify-center text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (state === "protected") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-5">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">

            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-white font-semibold">Link Terkunci</h2>
              <p className="text-xs text-white/40 mt-1">
                Masukkan password untuk melanjutkan ke{" "}
                <span className="text-indigo-400">/{slug}</span>
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="Password..."
                autoFocus
                className="w-full px-3 py-2.5 bg-[#111] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50"
              />
              {pwError && <p className="text-xs text-red-400">{pwError}</p>}
            </div>

            <button
              onClick={handleVerify}
              disabled={checking || !password}
              className="w-full py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {checking ? "Checking..." : "Buka Link →"}
            </button>
          </div>

          <p className="text-center text-[10px] text-white/20">Powered by LinkId</p>
        </div>
      </div>
    );
  }

  // state === "preview"
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white px-4">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">

        {preview?.image && (
          <img
            src={preview.image}
            alt="preview"
            className="rounded-xl w-full object-cover"
          />
        )}

        <div>
          <h2 className="text-lg font-semibold">
            {preview?.title || "No title"}
          </h2>
          <p className="text-xs text-white/40 mt-1">
            {preview?.description || "No description"}
          </p>
        </div>

        <div className="text-xs text-indigo-400 truncate">
          {preview?.originalUrl}
        </div>

        <div className="text-xs text-white/40">
          Redirecting in 3s...
        </div>

        <button
          onClick={() => {
            clearTimeout(timeoutRef.current);
            window.location.href = preview.originalUrl;
          }}
          className="text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          Skip →
        </button>
      </div>
    </div>
  );
}