import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { ThemePicker } from "../components/bio/ThemePicker";
import { LinkTypeIcon } from "../components/bio/LinkTypeIcon";

const LINK_TYPES = ["LINK", "PINNED", "SOCIAL"];
const ICON_OPTIONS = ["globe", "github", "instagram", "youtube", "twitter"];

export default function BioEditor() {
  const [bio, setBio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", bio: "", avatar: "", theme: "dark", username: "" });
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState({ label: "", url: "", icon: "globe", type: "LINK" });
  const [addingLink, setAddingLink] = useState(false);

  useEffect(() => {
    api.get("/bio/me")
      .then((r) => {
        const d = r.data.data;
        setBio(d);
        setForm({ title: d.title, bio: d.bio || "", avatar: d.avatar || "", theme: d.theme, username: d.username });
        setLinks(d.links || []);
      })
      .catch((error) => console.error(error.response?.data))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.patch("/bio/me", form);
    } catch (err) {
      console.error(err.response?.data);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLink = async () => {
    try {
      setAddingLink(true);
      const res = await api.post("/bio/me/links", { ...newLink, order: links.length });
      setLinks((p) => [...p, res.data.data]);
      setNewLink({ label: "", url: "", icon: "globe", type: "LINK" });
    } catch (err) {
      console.error(err.response?.data);
    } finally {
      setAddingLink(false);
    }
  };

  const handleDeleteLink = async (id) => {
    await api.delete(`/bio/me/links/${id}`);
    setLinks((p) => p.filter((l) => l.id !== id));
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/[0.04]" />)}</div>;

  return (
    <div className="space-y-5 max-w-2xl">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
        <h2 className="text-xl font-semibold text-white/90">
          Bio Link
        </h2>
      </div>
      {/* Profile */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
        <p className="text-xs uppercase tracking-widest text-white/30">Profile</p>
        <input value={form.username} onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))}
          placeholder="username" className="w-full px-3 py-2 bg-[#111] border border-white/[0.08] rounded-lg text-sm text-white" />
        <input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
          placeholder="Display name" className="w-full px-3 py-2 bg-[#111] border border-white/[0.08] rounded-lg text-sm text-white" />
        <textarea value={form.bio} onChange={(e) => setForm(p => ({ ...p, bio: e.target.value }))}
          placeholder="Bio..." rows={3} className="w-full px-3 py-2 bg-[#111] border border-white/[0.08] rounded-lg text-sm text-white resize-none" />
        <input value={form.avatar} onChange={(e) => setForm(p => ({ ...p, avatar: e.target.value }))}
          placeholder="Avatar URL" className="w-full px-3 py-2 bg-[#111] border border-white/[0.08] rounded-lg text-sm text-white" />
      </div>

      {/* Theme */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <ThemePicker value={form.theme} onChange={(t) => setForm(p => ({ ...p, theme: t }))} />
      </div>

      {/* Links */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
        <p className="text-xs uppercase tracking-widest text-white/30">Links</p>

        {links.map((link) => (
          <div key={link.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <LinkTypeIcon type={link.icon} className="w-4 h-4 text-white/40 flex-shrink-0" />
            <span className="text-sm text-white/70 flex-1 truncate">{link.label}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30">{link.type}</span>
            <button onClick={() => handleDeleteLink(link.id)} className="text-red-400/50 hover:text-red-400 text-xs ml-1">✕</button>
          </div>
        ))}

        {/* Add link form */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <input value={newLink.label} onChange={(e) => setNewLink(p => ({ ...p, label: e.target.value }))}
              placeholder="Label" className="px-3 py-2 bg-[#111] border border-white/[0.08] rounded-lg text-sm text-white" />
            <input value={newLink.url} onChange={(e) => setNewLink(p => ({ ...p, url: e.target.value }))}
              placeholder="https://..." className="px-3 py-2 bg-[#111] border border-white/[0.08] rounded-lg text-sm text-white" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={newLink.icon} onChange={(e) => setNewLink(p => ({ ...p, icon: e.target.value }))}
              className="px-3 py-2 bg-[#111] border border-white/[0.08] rounded-lg text-sm text-white">
              {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <select value={newLink.type} onChange={(e) => setNewLink(p => ({ ...p, type: e.target.value }))}
              className="px-3 py-2 bg-[#111] border border-white/[0.08] rounded-lg text-sm text-white">
              {LINK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button onClick={handleAddLink} disabled={addingLink || !newLink.label || !newLink.url}
            className="w-full py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-sm transition-colors disabled:opacity-50">
            {addingLink ? "Adding..." : "+ Add Link"}
          </button>
        </div>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 transition-colors text-sm font-medium disabled:opacity-50">
        {saving ? "Saving..." : "Save Changes"}
      </button>

      {/* Preview link */}
      {bio?.username && (
        <a href={`/u/${bio.username}`} target="_blank" rel="noreferrer"
          className="block text-center text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
          Preview bio page → {bio.username}
        </a>
      )}
    </div>
  );
}