export default function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5 fill-white"
        >
          <path d="M12 4 4 18h16L12 4Z" />
        </svg>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-white/45">
          Workspace
        </p>
        <h1 className="text-sm font-semibold text-white">Vercel Flow UI</h1>
      </div>
    </div>
  );
}
