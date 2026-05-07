export default function PreviewCard({ preview, loading }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#111] p-4 animate-pulse">
        <div className="h-40 bg-white/10 rounded-lg mb-3" />
        <div className="h-4 bg-white/10 w-2/3 mb-2 rounded" />
        <div className="h-3 bg-white/10 w-full mb-1 rounded" />
        <div className="h-3 bg-white/10 w-1/2 rounded" />
      </div>
    );
  }

  if (!preview) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#111] p-4 space-y-3">
      {preview.image && (
        <img
          src={preview.image}
          alt="preview"
          className="w-full h-40 object-cover rounded-lg"
        />
      )}

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-white line-clamp-1">
          {preview.title}
        </h3>

        <p className="text-xs text-white/50 line-clamp-2">
          {preview.description}
        </p>

        <p className="text-xs text-indigo-400">
          {preview.siteName || new URL(preview.url).hostname}
        </p>
      </div>
    </div>
  );
}