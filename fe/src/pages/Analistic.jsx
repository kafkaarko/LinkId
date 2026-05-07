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
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const chartDefaults = {
  plugins: {
    legend: {
      labels: { color: "rgba(255,255,255,0.45)", font: { size: 11 } },
    },
  },
  scales: {
    x: {
      ticks: { color: "rgba(255,255,255,0.35)" },
      grid: { color: "rgba(255,255,255,0.04)" },
    },
    y: {
      ticks: { color: "rgba(255,255,255,0.35)" },
      grid: { color: "rgba(255,255,255,0.04)" },
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

export default function LinkAnalytics() {
  const { user } = useAuth();

  const [totalClicks, setTotalClicks] = useState(0);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);

  const [dailyChart, setDailyChart] = useState(null);
  const [referrerData, setReferrerData] = useState([]);
  const [topLinks, setTopLinks] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/short/analytics");
        const data = res.data.data;

        setTotalClicks(data.totalClicks);
        setUniqueVisitors(data.uniqueVisitors || 0);

        // 🔥 DAILY TREND
        if (data.dailyStats) {
          setDailyChart({
            labels: data.dailyStats.map(d =>
  new Date(d.date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short"
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

        // 🔥 REFERRER
        setReferrerData(data.referrerStats || []);

        // 🔥 TOP LINKS
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

  return (
    <section className="space-y-5">

      {/* HEADER */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h2 className="text-xl font-semibold text-white">Analytics</h2>
        <p className="text-xs text-white/40">Track performa link lu</p>
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

      {/* 🔥 SUPER USER ONLY */}
      {user?.role === "SUPER_USER" ? (
        <>
          {/* TREND */}
          {dailyChart && (
            <Section title="Trend 7 Hari">
              <Bar data={dailyChart} options={chartDefaults} />
            </Section>
          )}

          {/* GRID */}
          <div className="grid md:grid-cols-2 gap-4">

            {/* REFERRER */}
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

            {/* TOP LINKS */}
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
        </>
      ) : (
        <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-6 text-center">
          <p className="text-sm text-white/50">
            Analytics lengkap hanya untuk Super User
          </p>
          <p className="text-xs text-white/30 mt-1">
            Upgrade dulu bro 😏
          </p>
        </div>
      )}
    </section>
  );
}