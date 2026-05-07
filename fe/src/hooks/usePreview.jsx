import { useEffect, useState } from "react";
import { api } from "../lib/api";

export const usePreview = (url) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) {
      setPreview(null);
      return;
    }

    let cancelled = false;

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);

        const res = await api.get(
          `/preview?url=${encodeURIComponent(url)}`
        );

        if (!cancelled) {
          setPreview(res.data.data);
        }
      } catch {
        if (!cancelled) setPreview(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 500); // debounce

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [url]);

  return { preview, loading };
};