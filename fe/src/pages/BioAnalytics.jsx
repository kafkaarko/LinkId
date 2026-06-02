// pages/BioAnalytics.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const TICK = "rgba(255,255,255,0.35)";
const GRID = "rgba(255,255,255,0.04)";
const PALETTE = [
  "rgba(99,102,241,0.7)",
  "rgba(29,158,117,0.7)",
  "rgba(216,90,48,0.7)",
  "rgba(212,83,126,0.7)",
  "rgba(55,138,221,0.7)",
  "rgba(186,117,23,0.7)",
  "rgba(99,153,34,0.7)",
  "rgba(136,135,128,0.7)",
];

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y} clicks` } },
  },
  scales: {
    x: {
      ticks: { color: TICK, font: { size: 11 } },
      grid: { color: GRID },
    },
    y: {
      ticks: { color: TICK, font: { size: 11 } },
      grid: { color: GRID },
      beginAtZero: true,
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

export default function BioAnalytics() {
  const { user } = useAuth();
  const [bio, setBio]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [totalClicks, setTotalClicks] = useState(0);
  const [topLinks, setTopLinks] = useState([]);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    api.get("/bio/me")
      .then((r) => {
        const d = r.data.data;
        setBio(d);

        const links = d.links || [];
        const total = links.reduce((a, l) => a + (l.clicks || 0), 0);
        setTotalClicks(total);

        const sorted = [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
        setTopLinks(sorted);

        // Chart — clicks per link
        if (links.length) {
          setChartData({
            labels: links.map((l) => l.label),
            datasets: [{
              label: "Clicks",
              data: links.map((l) => l.clicks || 0),
              backgroundColor: PALETTE.slice(0, links.length),
              borderRadius: 6,
            }],
          });
        }
      })
      .catch((e) => console.error(e.response?.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-5">

      {/* HEADER */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h2 className="text-xl font-semibold text-white">Bio Analytics</h2>
        <p className="text-xs text-white/40 mt-0.5">
          Track performa link bio kamu
          {bio?.username && (
            <a
              href={`/u/${bio.username}`}
              target="_blank"
              rel="noreferrer"
              className="ml-2 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              /u/{bio.username} →
            </a>
          )}
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-indigo-500/[0.06] border border-indigo-500/20 p-4">
          <p className="text-xs text-white/40">Total Clicks</p>
          <h3 className="text-2xl text-white mt-1">{totalClicks}</h3>
        </div>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
          <p className="text-xs text-white/40">Total Links</p>
          <h3 className="text-2xl text-white mt-1">{topLinks.length}</h3>
        </div>
      </div>

      {user?.role === "SUPER_USER" ? (
        <>
          {/* CHART */}
          {chartData && (
            <Section title="Clicks per Link">
              <div className="relative w-full" style={{ height: 200 }}>
                <Bar data={chartData} options={barOptions} />
              </div>
            </Section>
          )}

          {/* TOP LINKS TABLE */}
          <Section title="Top Links">
            {topLinks.length ? (
              <ul className="space-y-2">
                {topLinks.map((link, i) => (
                  <li
                    key={link.id}
                    className="flex items-center gap-3 text-xs text-white/60"
                  >
                    <span className="text-white/20 w-4 text-right flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate">{link.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30">
                      {link.type}
                    </span>
                    <span className="text-indigo-400 font-medium tabular-nums">
                      {link.clicks || 0}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-white/30">Belum ada data</p>
            )}
          </Section>
        </>
      ) : (
        <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-6 text-center">
          <p className="text-sm text-white/50">Analytics lengkap hanya untuk Super User</p>
          <p className="text-xs text-white/30 mt-1">Upgrade dulu bro 😏</p>
        </div>
      )}

    </section>
  );
}