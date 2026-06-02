import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

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

const hBarOptions = (height) => ({
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
    },
    y: {
      ticks: { color: TICK, font: { size: 11 } },
      grid: { display: false },
    },
  },
});

const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "65%",
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed} kunjungan` } },
  },
};

const trendOptions = {
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
      <div className="relative w-full" style={{ height: 180 }}>
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
  const height = Math.max(labels.length * 40 + 60, 160);

  return (
    <>
      <ChartLegend labels={labels} colors={colors} values={values} />
      <div className="relative w-full" style={{ height }}>
        <Bar
          data={{
            labels,
            datasets: [{
              data: values,
              backgroundColor: colors,
              borderWidth: 0,
              borderRadius: 4,
            }],
          }}
          options={hBarOptions(height)}
        />
      </div>
    </>
  );
}

export default function LinkAnalytics() {
  const { user } = useAuth();

  const [totalClicks, setTotalClicks] = useState(0);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [dailyChart, setDailyChart] = useState(null);
  const [referrerData, setReferrerData] = useState([]);
  const [topLinks, setTopLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deviceStats, setDeviceStats] = useState([]);
  const [browserStats, setBrowserStats] = useState([]);
  const [osStats, setOsStats] = useState([]);
  const [countryStats, setCountryStats] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/short/analytics");
        const data = res.data.data;

        setTotalClicks(data.totalClicks);
        setUniqueVisitors(data.uniqueVisitors || 0);
        setDeviceStats(data.deviceStats || []);
        setBrowserStats(data.browserStats || []);
        setOsStats(data.osStats || []);
        setCountryStats(data.countryStats || []);

        if (data.dailyStats) {
          setDailyChart({
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
                borderRadius: 6,
              },
            ],
          });
        }

        setReferrerData(data.referrerStats || []);
        setTopLinks(data.topLinkStats || []);
      } catch (err) {
        console.error("Analytics error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
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

  const handleExportAll = async () => {
  const res = await api.get("/export/links", { responseType: "blob" });
  const url = URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = `links-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};


  return (
    <section className="space-y-5">

      {/* HEADER */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h2 className="text-xl font-semibold text-white">Analytics</h2>
        <p className="text-xs text-white/40">Track performa link lu</p>
        {user?.role === "SUPER_USER" && (
  <button
    onClick={handleExportAll}
    className="text-xs px-3 py-1.5 rounded-lg border border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 transition-colors"
  >
    Export CSV ↓
  </button>
)}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-indigo-500/[0.06] border border-indigo-500/20 p-4">
          <p className="text-xs text-white/40">Total Clicks</p>
          <h3 className="text-2xl text-white">{totalClicks}</h3>
        </div>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
          <p className="text-xs text-white/40">Unique Visitors</p>
          <h3 className="text-2xl text-white">{uniqueVisitors}</h3>
        </div>
      </div>

      {user?.role === "SUPER_USER" ? (
        <>
          {/* TREND */}
          {dailyChart && (
            <Section title="Trend 7 Hari">
              <div className="relative w-full" style={{ height: 200 }}>
                <Bar data={dailyChart} options={trendOptions} />
              </div>
            </Section>
          )}

          {/* REFERRER + TOP LINKS */}
          <div className="grid md:grid-cols-2 gap-4">
            <Section title="Top Referrer">
              {referrerData.length ? (
                <ul className="space-y-2 text-xs text-white/60">
                  {referrerData.map((item, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{item.referer || "Direct"}</span>
                      <span>{item._count.referer}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-white/30">Belum ada data</p>
              )}
            </Section>

            <Section title="Top Links">
              {topLinks.length ? (
                <ul className="space-y-2 text-xs text-white/60">
                  {topLinks.map((link, i) => (
                    <li key={i} className="flex justify-between">
                      <span>/{link.slug}</span>
                      <span>{link.clicks}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-white/30">Belum ada data</p>
              )}
            </Section>
          </div>

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