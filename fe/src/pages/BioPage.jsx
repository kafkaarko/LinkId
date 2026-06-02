import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { LinkTypeIcon } from "../components/bio/LinkTypeIcon";
import { THEMES } from "../components/bio/ThemePicker";

export default function BioPage() {
  const { username } = useParams();
  const [bio, setBio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/bio/${username}`)
      .then((r) => setBio(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [username]);

  const handleLinkClick = async (link) => {
    // Track dulu, baru redirect
    try {
      await api.post(`/bio/${username}/link/${link.id}/click`);
    } catch (_) {}
    window.open(link.url, "_blank", "noreferrer");
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!bio) return (
    <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
      <p className="text-white/30 text-sm">Bio page not found.</p>
    </div>
  );

  const theme = THEMES[bio.theme] || THEMES.dark;
  const pinnedLinks = bio.links.filter((l) => l.type === "PINNED");
  const socialLinks = bio.links.filter((l) => l.type === "SOCIAL");
  const regularLinks = bio.links.filter((l) => l.type === "LINK");

  return (
    <div className="min-h-screen flex flex-col items-center py-16 px-4" style={{ background: theme.bg }}>
      <div className="w-full max-w-sm space-y-5">

        {/* Avatar + Info */}
        <div className="flex flex-col items-center gap-3 text-center">
          {bio.avatar ? (
            <img src={bio.avatar} className="w-20 h-20 rounded-full object-cover ring-2 ring-white/10" />
          ) : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ background: theme.accent + "22", color: theme.accent }}>
              {bio.title?.[0]}
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold" style={{ color: theme.text }}>{bio.title}</h1>
            {bio.bio && <p className="text-sm mt-1 opacity-50 leading-relaxed" style={{ color: theme.text }}>{bio.bio}</p>}
          </div>

          {/* Social icons */}
          {socialLinks.length > 0 && (
            <div className="flex gap-3 mt-1">
              {socialLinks.map((link) => (
                <button key={link.id} onClick={() => handleLinkClick(link)}
                  className="opacity-50 hover:opacity-100 transition-opacity"
                  style={{ color: theme.text }}>
                  <LinkTypeIcon type={link.icon} className="w-5 h-5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pinned link */}
        {pinnedLinks.map((link) => (
          <button key={link.id} onClick={() => handleLinkClick(link)}
            className="w-full py-3 px-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
            style={{ background: theme.accent, color: "#fff" }}>
            <LinkTypeIcon type={link.icon} className="w-4 h-4" />
            {link.label}
          </button>
        ))}

        {/* Regular links */}
        <div className="space-y-2.5">
          {regularLinks.map((link) => (
            <button key={link.id} onClick={() => handleLinkClick(link)}
              className="w-full py-3 px-4 rounded-2xl text-sm flex items-center gap-3 transition-opacity hover:opacity-80 border"
              style={{ background: theme.card, color: theme.text, borderColor: theme.text + "10" }}>
              <LinkTypeIcon type={link.icon} className="w-4 h-4 opacity-50" />
              <span className="flex-1 text-left">{link.label}</span>
              <svg className="w-3.5 h-3.5 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] opacity-20 pt-4" style={{ color: theme.text }}>
          Powered by LinkId <br />
          (this is beta test)
        </p>
      </div>
    </div>
  );
}