import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";

export default function RedirectPage() {
  const { slug } = useParams();

  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const timeoutRef = useRef(null);

  useEffect(() => {
  const fetchData = async () => {
    try {
      const res = await api.get(`/${slug}`);

      const originalUrl = res.data.data.originalUrl;

      const prev = await api.get(
        `/preview?url=${encodeURIComponent(originalUrl)}`
      );

      setPreview({
        ...prev.data.data,
        originalUrl,
      });

      timeoutRef.current = setTimeout(() => {
        window.location.href = originalUrl;
      }, 3000);

    } catch {
      setError("Link tidak valid / expired");
    } finally {
      setLoading(false);
    }
  };

  fetchData();

  return () => {
    clearTimeout(timeoutRef.current);
  };
}, [slug]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Loading preview...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

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
>
  Skip
</button>
      </div>
    </div>
  );
}