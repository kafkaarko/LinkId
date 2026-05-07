import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import QRCode from "qrcode";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

export default function AnalisticDetail() {
  const { slug } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [qr, setQr] = useState("");

  // 🔥 DOMAIN
  const [host, setHost] = useState("");
  const [verifyStatus, setVerifyStatus] = useState(null);
  const [dnsToken, setDnsToken] = useState("");

  // 🔥 MODE
  const [mode, setMode] = useState("PERSONAL");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/short/analytics/${slug}`);
      const d = res.data.data;
      setData(d);

      // 🔥 QR
      const url = `${window.location.origin}/${slug}`;
      const qrData = await QRCode.toDataURL(url);
      setQr(qrData);

      setMode(d.mode || "PERSONAL");

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 🔥 DOMAIN VERIFY FLOW
  // =========================
  const handleVerifyDomain = async () => {
    try {
      const res = await api.post("/domain/verify", { host });

      setDnsToken(res.data.data.token);
      setVerifyStatus("pending");

    } catch {
      setVerifyStatus("failed");
    }
  };
  // const isExpired = data?.expiresAt && new Date(data.expiresAt) < new Date();
  const handleConfirmVerify = async () => {
    try {
      await api.post("/domain/confirm", { host });
      setVerifyStatus("verified");
    } catch {
      setVerifyStatus("failed");
    }
  };

  // =========================
  // 🔥 MODE UPDATE
  // =========================
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

  // =========================
  // 🔥 QR DOWNLOAD
  // =========================
  const downloadQR = () => {
    const a = document.createElement("a");
    a.href = qr;
    a.download = `${slug}-qr.png`;
    a.click();
  };

  // =========================
  // 🔥 COUNTDOWN
  // =========================
  const getCountdown = () => {
    if (!data?.expiresAt) return null;

    const diff = new Date(data.expiresAt) - new Date();
    if (diff <= 0) return "Expired";

    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff / (1000 * 60)) % 60);

    return `${h}h ${m}m`;
  };

  if (loading) return <p className="text-white">Loading...</p>;

  const isExpired =
    data?.expiresAt && new Date(data.expiresAt) < new Date();

  const chartData = {
    labels: data.dailyStats.map((d) =>
      new Date(d.date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      })
    ),
    datasets: [
      {
        label: "Clicks",
        data: data.dailyStats.map((d) => d.count),
        backgroundColor: "rgba(99,102,241,0.5)",
      },
    ],
  };

  return (
    <section className="space-y-5">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl text-white">Analytics /{slug}</h2>

        <span className={`text-xs px-3 py-1 rounded-full ${isExpired
          ? "bg-red-500/20 text-red-400"
          : "bg-emerald-500/20 text-emerald-400"
          }`}>
          {isExpired ? "EXPIRED" : "ACTIVE"}
        </span>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white/[0.03] rounded-xl">
          <p>Total Clicks</p>
          <h3>{data.totalClicks}</h3>
        </div>

        <div className="p-4 bg-white/[0.03] rounded-xl">
          <p>Unique Visitors</p>
          <h3>{data.uniqueVisitors}</h3>
        </div>
      </div>

      {/* 🔥 PHASE 2 */}
      <div className="grid md:grid-cols-3 gap-4">

        {/* =========================
            🔥 DOMAIN
        ========================= */}
        <div className="relative group p-4 border border-white/[0.05] rounded-xl bg-white/[0.02] opacity-60 cursor-not-allowed">

          {/* 🔥 TOOLTIP */}
          <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition duration-50">
            <div className="px-2 py-1 text-[10px] rounded-md bg-indigo-500 text-white shadow-lg whitespace-nowrap">
              Coming Soon
            </div>
          </div>

          <p className="text-xs text-white/40 mb-2">
            Custom Domain
          </p>

          <input
            disabled
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="domain.com"
            className="w-full px-3 py-2 bg-[#111] border border-white/[0.08] rounded-lg text-sm text-white cursor-not-allowed"
          />

          <button
            disabled
            className="mt-2 w-full bg-indigo-500/40 py-2 rounded-lg text-sm cursor-not-allowed"
          >
            Verify Domain
          </button>

        </div>

        {/* =========================
            🔥 QR
        ========================= */}
        <div className="p-4 border border-white/[0.05] rounded-xl text-center bg-white/[0.02]">
          <p className="text-xs text-white/40 mb-2">QR Code</p>

          {qr && <img src={qr} className="mx-auto w-24 h-24" />}

          <button
            onClick={downloadQR}
            className="mt-2 text-xs text-indigo-400"
          >
            Download PNG
          </button>
        </div>

        {/* =========================
            🔥 MODE + EXPIRE
        ========================= */}
        <div className="p-4 border border-white/[0.05] rounded-xl bg-white/[0.02]">
          <form action="" onSubmit={handleUpdateMode}>


            <p className="text-xs text-white/40 mb-2">Mode</p>

            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full px-3 py-2 bg-[#111] border border-white/[0.08] rounded-lg text-sm text-white"
            >
              <option value="PERSONAL">Personal (No Expire)</option>
              <option value="DPD">DPD (1 Hari)</option>
              <option value="MPM">MPM (1 Bulan)</option>
            </select>

            <p className="text-[10px] text-white/30 mt-2">
              DPD = Day per Day (24 jam) <br />
              MPM = Month per Month (30 hari)
            </p>

            <button
              type="submit"
              disabled={updating || isExpired}
              className="mt-3 w-full bg-indigo-500 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {updating ? "Updating..." : "Update Mode"}
            </button>
          </form>
          {/* EXPIRE INFO */}
          {data.expiresAt && (
            <div className="mt-3 text-xs text-indigo-400">
              {getCountdown()}
            </div>
          )}
        </div>

      </div>

      {/* CHART */}
      <div className="p-4 border border-white/[0.05] rounded-xl bg-white/[0.02]">
        <Bar data={chartData} />
      </div>

      {/* VISIT */}
      <a
        href={`/${slug}`}
        target="_blank"
        className="text-indigo-400"
      >
        Visit Link →
      </a>

    </section>
  );
}