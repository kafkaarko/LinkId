import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import QRCode from "qrcode";
import { useAuth } from "../context/AuthContext";
import { useRef } from "react";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const TICK = "rgba(255,255,255,0.35)";
const GRID = "rgba(255,255,255,0.04)";
const PALETTE = [
  "rgba(99,102,241,0.75)",
  "rgba(29,158,117,0.75)",
  "rgba(216,90,48,0.75)",
  "rgba(212,83,126,0.75)",
  "rgba(55,138,221,0.75)",
  "rgba(186,117,23,0.75)",
  "rgba(99,153,34,0.75)",
  "rgba(136,135,128,0.75)",
];

const trendOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y} clicks` } },
  },
  scales: {
    x: {
      ticks: { color: TICK, font: { size: 11 }, maxRotation: 45 },
      grid: { color: GRID },
    },
    y: {
      ticks: { color: TICK, font: { size: 11 } },
      grid: { color: GRID },
      beginAtZero: true,
    },
  },
};

const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "65%",
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed} kunjungan` } },
  },
};

const hBarOptions = {
  indexAxis: "y",
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.x} kunjungan` } },
  },
  scales: {
    x: {
      ticks: { color: TICK, font: { size: 11 } },
      grid: { color: GRID },
      beginAtZero: true,
    },
    y: {
      ticks: { color: TICK, font: { size: 11 } },
      grid: { display: false },
    },
  },
};

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="mb-4 text-xs uppercase tracking-widest text-white/30">{title}</p>
      {children}
    </div>
  );
}

function ChartLegend({ labels, colors, values }) {
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
      {labels.map((label, i) => {
        const pct = total ? Math.round((values[i] / total) * 100) : 0;
        return (
          <span key={i} className="flex items-center gap-1 text-xs text-white/50">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: colors[i] }}
            />
            {label} {pct}%
          </span>
        );
      })}
    </div>
  );
}

function DeviceChart({ stats }) {
  if (!stats.length) return <p className="text-xs text-white/30">Belum ada data</p>;
  const labels = stats.map((d) => d.device || "Unknown");
  const values = stats.map((d) => d._count.device);
  const colors = PALETTE.slice(0, labels.length);
  return (
    <>
      <ChartLegend labels={labels} colors={colors} values={values} />
      <div className="relative w-full" style={{ height: 160 }}>
        <Doughnut
          data={{ labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }] }}
          options={donutOptions}
        />
      </div>
    </>
  );
}

function HBarChart({ stats, labelKey, countKey }) {
  if (!stats.length) return <p className="text-xs text-white/30">Belum ada data</p>;
  const labels = stats.map((d) => d[labelKey] || "Unknown");
  const values = stats.map((d) => d._count[countKey]);
  const colors = PALETTE.slice(0, labels.length);
  const height = Math.max(labels.length * 40 + 60, 140);
  return (
    <>
      <ChartLegend labels={labels} colors={colors} values={values} />
      <div className="relative w-full" style={{ height }}>
        <Bar
          data={{ labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, borderRadius: 4 }] }}
          options={hBarOptions}
        />
      </div>
    </>
  );
}

export default function AnalisticDetail() {
  const { user } = useAuth();
  const { slug } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState("");
  const [host, setHost] = useState("");
  const [mode, setMode] = useState("PERSONAL");
  const [updating, setUpdating] = useState(false);
  const [deviceStats, setDeviceStats] = useState([]);
  const [browserStats, setBrowserStats] = useState([]);
  const [osStats, setOsStats] = useState([]);
  const [countryStats, setCountryStats] = useState([]);
  // Tambah state di atas
  const [qrConfig, setQrConfig] = useState({
    foreground: "#6366f1",
    background: "#0f0f13",
    size: "256",
    logo: null,
  });
  const [logoFile, setLogoFile] = useState(null);    // base64
  const [generating, setGenerating] = useState(false);
  const initialized = useRef(false);
  const [linkPassword, setLinkPassword] = useState("");
const [settingPassword, setSettingPassword] = useState(false);
const [passwordSet, setPasswordSet] = useState(data?.isProtected || false);
  useEffect(() => {
    fetchData();
    generateCustomQR();

  }, [user]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/short/analytics/${slug}`);
      const d = res.data.data;
      setData(d);
      setMode(d.mode || "PERSONAL");
      setDeviceStats(d.deviceStats || []);
      setBrowserStats(d.browserStats || []);
      setOsStats(d.osStats || []);
      setCountryStats(d.countryStats || []);

      // Generate QR setelah data ready
      const savedConfig = JSON.parse(localStorage.getItem(`qr_config_${slug}`) || "null");
      const savedLogo = localStorage.getItem(`qr_logo_${slug}`) || null;
      if (savedConfig) setQrConfig(savedConfig);
      if (savedLogo) setLogoFile(savedLogo);

      await generateCustomQR(savedConfig || qrConfig, savedLogo);
      initialized.current = true;

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMode = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await api.patch(`/short/${slug}/mode`, { mode });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  // const downloadQR = () => {
  //   const a = document.createElement("a");
  //   a.href = qr;
  //   a.download = `${slug}-qr.png`;
  //   a.click();
  // };


  // console.log(data.user.role)

  // Fungsi generate QR baru (hit BE)
  const generateCustomQR = async (config = qrConfig, logo = logoFile) => {
    try {
      setGenerating(true);
      const url = `${window.location.origin}/${slug}`;
      // console.log(url)

      const res = await api.post("/qr/custom", {
        url: url || `${window.location.origin}/${slug}`,
        foreground: config.foreground,
        background: config.background,
        size: config.size,
        logo: logo || undefined,
      });
      // console.log(res)
      setQr(res.data.qr);
    } catch (err) {
      console.error(err.response?.data);
    } finally {
      setGenerating(false);
    }
  };

  // Jalankan otomatis saat config berubah (debounce ringan)
  useEffect(() => {
    if (!initialized.current) return;
    const t = setTimeout(() => generateCustomQR(), 300);
    return () => clearTimeout(t);
  }, [qrConfig, logoFile, user]);

  useEffect(() => {
    if (!initialized.current) return;
    localStorage.setItem(`qr_config_${slug}`, JSON.stringify(qrConfig));
  }, [qrConfig]);

  useEffect(() => {
    if (!initialized.current) return;
    try {
      if (logoFile) {
        localStorage.setItem(`qr_logo_${slug}`, logoFile);
        console.log("Logo saved to localStorage ✓");
      } else {
        localStorage.removeItem(`qr_logo_${slug}`);
      }
    } catch (e) {
      if (e.name === "QuotaExceededError") {
        console.warn("localStorage penuh — compress dulu atau skip");
      }
    }
  }, [logoFile]);

  const compressImage = (base64, maxSizeKB = 50) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Scale down kalau terlalu besar
        const scale = Math.min(1, Math.sqrt((maxSizeKB * 1024) / (base64.length * 0.75)));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7)); // compress ke JPEG 70%
      };
      img.src = base64;
    });
  };

  const handleSetPassword = async () => {
  try {
    setSettingPassword(true);
    await api.patch(`/short/${slug}/password`, { password: linkPassword || null });
    setPasswordSet(!!linkPassword);
    setLinkPassword("");
  } catch (err) {
    console.error(err.response?.data);
  } finally {
    setSettingPassword(false);
  }
};


  const handleExportAnalytics = async () => {
    const res = await api.get(`/export/links/${slug}`, { responseType: "blob" });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-analytics.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle upload logo
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const compressed = await compressImage(ev.target.result, 50); // max 50KB
      setLogoFile(compressed);
    };
    reader.readAsDataURL(file);
  };

  const downloadQR = (format = "png") => {
    const a = document.createElement("a");
    a.href = qr;
    a.download = `${slug}-qr.${format}`;
    a.click();
  };

  const getCountdown = () => {
    if (!data?.expiresAt) return null;
    const diff = new Date(data.expiresAt) - new Date();
    if (diff <= 0) return "Expired";
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff / (1000 * 60)) % 60);
    return `${h}h ${m}m`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
    );
  }

  const isExpired = data?.expiresAt && new Date(data.expiresAt) < new Date();

  const chartData = {
    labels: data.dailyStats.map((d) =>
      new Date(d.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
    ),
    datasets: [{
      label: "Clicks",
      data: data.dailyStats.map((d) => d.count),
      backgroundColor: "rgba(99,102,241,0.5)",
      borderRadius: 6,
    }],
  };

  const shortUrl = `${window.location.origin}/${slug}`;

  return (
    <section className="space-y-5">

      {/* HEADER */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 ">
            <h2 className="text-xl font-semibold text-white truncate">/{slug}</h2>
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-0.5 inline-block"
            >
            →  {shortUrl} 
            </a>
            {user?.role === "SUPER_USER" && (
              <button
                onClick={handleExportAnalytics}
                className="text-xs px-3 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 transition-colors ml-5"
              >
                Export Analytics CSV ↓
              </button>
            )}

          </div>

          <span className={`flex-shrink-0 text-xs px-3 py-1 rounded-full font-medium ${isExpired
            ? "bg-red-500/20 text-red-400"
            : "bg-emerald-500/20 text-emerald-400"
            }`}>
            {isExpired ? "EXPIRED" : "ACTIVE"}
          </span>
        </div>

        {data.originalUrl && (
          <p className="text-xs text-white/30 mt-2 truncate">
            → {data.originalUrl}
          </p>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-indigo-500/[0.06] border border-indigo-500/20 p-4">
          <p className="text-xs text-white/40">Total Clicks</p>
          <h3 className="text-2xl font-semibold text-white mt-1">{data.totalClicks}</h3>
        </div>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
          <p className="text-xs text-white/40">Unique Visitors</p>
          <h3 className="text-2xl font-semibold text-white mt-1">{data.uniqueVisitors}</h3>
        </div>
      </div>

      {/* QR + MODE */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* QR */}
        <Section title="QR Code">
          <div className="flex flex-col gap-4">

            {/* Preview */}
            <div className="flex items-center gap-4">
              {qr ? (
                <div className="relative">
                  <img
                    src={qr}
                    className="w-24 h-24 rounded-xl border border-white/10"
                    alt="QR Code"
                  />
                  {generating && (
                    <div className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl bg-white/5 animate-pulse" />
              )}

              {/* Download buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => downloadQR("png")}
                  className="block text-xs px-3 py-1.5 rounded-lg border border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 transition-colors w-full text-center"
                >
                  Download PNG
                </button>
                {/* SVG export → hanya SUPER_USER */}
                {user?.role === "SUPER_USER" && (

                  <button
                    onClick={() => downloadQR("svg")}
                    className="block text-xs px-3 py-1.5 rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition-colors w-full text-center"
                  >
                    Download SVG ✦
                  </button>
                )}
              </div>
            </div>

            {/* Customizer */}
            <div className="grid grid-cols-2 gap-3">

              {/* Foreground */}
              <label className="space-y-1">
                <span className="text-[10px] text-white/30 uppercase tracking-widest">Foreground</span>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-white/[0.08] bg-[#111]">
                  <input
                    type="color"
                    value={qrConfig.foreground}
                    onChange={(e) => setQrConfig(p => ({ ...p, foreground: e.target.value }))}
                    className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs text-white/50">{qrConfig.foreground}</span>
                </div>
              </label>

              {/* Background */}
              <label className="space-y-1">
                <span className="text-[10px] text-white/30 uppercase tracking-widest">Background</span>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-white/[0.08] bg-[#111]">
                  <input
                    type="color"
                    value={qrConfig.background}
                    onChange={(e) => setQrConfig(p => ({ ...p, background: e.target.value }))}
                    className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs text-white/50">{qrConfig.background}</span>
                </div>
              </label>

            </div>

            {/* Size */}
            <div className="space-y-1">
              <span className="text-[10px] text-white/30 uppercase tracking-widest">Size</span>
              <div className="flex gap-2">
                {["256", "512", "1024"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setQrConfig(p => ({ ...p, size: s }))}
                    className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${qrConfig.size === s
                      ? "border-indigo-500/60 bg-indigo-500/15 text-indigo-300"
                      : "border-white/[0.08] text-white/40 hover:text-white/60"
                      }`}
                  >
                    {s}px
                  </button>
                ))}
              </div>
            </div>

            {/* Logo — SUPER_USER only */}
            {user?.role === "SUPER_USER" ? (
              <div className="space-y-1">
                <span className="text-[10px] text-white/30 uppercase tracking-widest">
                  Logo Center <span className="text-amber-400">✦ Super</span>
                </span>
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-white/[0.12] cursor-pointer hover:border-indigo-500/40 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <span className="text-xs text-white/40">
                    {logoFile ? "✓ Logo uploaded" : "Upload logo (PNG/SVG)"}
                  </span>
                  {logoFile && (
                    <button
                      onClick={(e) => { e.preventDefault(); setLogoFile(null); }}
                      className="ml-auto text-[10px] text-red-400/70 hover:text-red-400"
                    >
                      remove
                    </button>
                  )}
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.01]">
                <span className="text-xs text-white/25">Logo center & SVG export</span>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400/70 border border-amber-500/20">
                  Super User
                </span>
              </div>
            )}

          </div>
        </Section>

        {/* MODE */}
        <Section title="Mode & Expire">
          <form onSubmit={handleUpdateMode} className="space-y-3">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full px-3 py-2 bg-[#111] border border-white/[0.08] rounded-lg text-sm text-white"
            >
              <option value="PERSONAL">Personal (No Expire)</option>
              <option value="DPD">DPD — 1 Hari</option>
              <option value="MPM">MPM — 1 Bulan</option>
            </select>

            <div className="flex items-center justify-between">
              <p className="text-[10px] text-white/30 leading-relaxed">
                DPD = Day per Day (24 jam)<br />
                MPM = Month per Month (30 hari)
              </p>
              {data.expiresAt && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${isExpired
                  ? "bg-red-500/20 text-red-400"
                  : "bg-indigo-500/20 text-indigo-400"
                  }`}>
                  {isExpired ? "Expired" : getCountdown()}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={updating || isExpired}
              className="w-full bg-indigo-500 hover:bg-indigo-600 transition-colors py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {updating ? "Updating..." : "Update Mode"}
            </button>
          </form>
        </Section>


        <Section title="Password Protection ✦">
    <div className="space-y-3">
      {passwordSet && (
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <span>●</span> Link ini sedang terkunci
        </div>
      )}
      <input
        type="password"
        value={linkPassword}
        onChange={(e) => setLinkPassword(e.target.value)}
        placeholder={passwordSet ? "Password baru (kosongkan untuk hapus)" : "Set password..."}
        className="w-full px-3 py-2 bg-[#111] border border-white/[0.08] rounded-lg text-sm text-white"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSetPassword}
          disabled={settingPassword}
          className="flex-1 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 transition-colors text-sm disabled:opacity-50"
        >
          {settingPassword ? "Saving..." : "Save"}
        </button>
        {passwordSet && (
          <button
            onClick={() => { setLinkPassword(""); handleSetPassword(); }}
            disabled={settingPassword}
            className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
          >
            Hapus
          </button>
        )}
      </div>
    </div>
  </Section>

      </div>

      {/* TREND */}
      <Section title="Trend Klik Harian">
        <div className="relative w-full" style={{ height: 200 }}>
          <Bar data={chartData} options={trendOptions} />
        </div>
      </Section>

      {/* DEVICE + OS */}
      <div className="grid md:grid-cols-2 gap-4">
        <Section title="Device">
          <DeviceChart stats={deviceStats} />
        </Section>
        <Section title="OS">
          <HBarChart stats={osStats} labelKey="os" countKey="os" />
        </Section>
      </div>

      {/* BROWSER + COUNTRY */}
      <div className="grid md:grid-cols-2 gap-4">
        <Section title="Browser">
          <HBarChart stats={browserStats} labelKey="browser" countKey="browser" />
        </Section>
        <Section title="Country">
          <HBarChart stats={countryStats} labelKey="country" countKey="country" />
        </Section>
      </div>

    </section>
  );
}