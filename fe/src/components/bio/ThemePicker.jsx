export const THEMES = {
  dark:     { label: "Dark",     bg: "#0f0f13", card: "#1a1a22", accent: "#6366f1", text: "#ffffff" },
  light:    { label: "Light",    bg: "#f5f5f0", card: "#ffffff", accent: "#6366f1", text: "#111111" },
  midnight: { label: "Midnight", bg: "#0a0a1a", card: "#12122a", accent: "#818cf8", text: "#e0e7ff" },
  aurora:   { label: "Aurora",   bg: "#0d1f1a", card: "#132a22", accent: "#34d399", text: "#ecfdf5" },
  sunset:   { label: "Sunset",   bg: "#1a0f0a", card: "#2a1612", accent: "#f97316", text: "#fff7ed" },
  paper:    { label: "Paper",    bg: "#faf7f2", card: "#ffffff", accent: "#92400e", text: "#1c1917" },
};

export function ThemePicker({ value, onChange }) {
  return (
    <div className="space-y-2">
      <span className="text-[10px] text-white/30 uppercase tracking-widest">Theme</span>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(THEMES).map(([key, t]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`relative h-14 rounded-xl border-2 overflow-hidden transition-all ${
              value === key ? "border-indigo-500" : "border-transparent"
            }`}
            style={{ background: t.bg }}
          >
            {/* Mini preview */}
            <div className="absolute inset-x-2 top-2 h-2 rounded-full opacity-60" style={{ background: t.accent }} />
            <div className="absolute inset-x-3 bottom-3 h-1.5 rounded-full opacity-30" style={{ background: t.text }} />
            <span className="absolute bottom-1 inset-x-0 text-center text-[9px]" style={{ color: t.text + "99" }}>
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}