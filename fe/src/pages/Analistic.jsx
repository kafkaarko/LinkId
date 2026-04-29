import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import { useEffect, useState } from "react";
import { api } from "../lib/api";


ChartJS.register(ArcElement, Tooltip, Legend);

export default function LinkAnalytics({ linkId }) {
  const [data, setData] = useState(null);
  const [totalClicks, setTotalClicks] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get(`/short/analistic`);
        console.log(res.data.data);

        const result = res.data.data;

        setTotalClicks(result.totalClicks);

        // 🔥 kalau ada deviceStats berarti SUPER_USER
        if (result.deviceStats) {
          const labels = result.deviceStats.map((item) =>
            item.userAgent?.includes("Mobile")
              ? "Mobile"
              : item.userAgent?.includes("Windows")
              ? "Desktop"
              : "Other"
          );

          const values = result.deviceStats.map(
            (item) => item._count._all
          );

          setData({
            labels,
            datasets: [
              {
                label: "Device Usage",
                data: values,
              },
            ],
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [linkId]);

  if (loading) return <p className="text-white/60">Loading analytics...</p>;

  return (
    <div className="space-y-4">
      {/* TOTAL */}
      <div className="p-4 rounded-xl border border-white/10 bg-[#090909]">
        <p className="text-sm text-white/50">Total Clicks</p>
        <h2 className="text-3xl text-white font-semibold">
          {totalClicks}
        </h2>
      </div>

      {/* 🔥 PIE CHART (ONLY SUPER USER) */}
      {data ? (
        <div className="p-4 rounded-xl border border-white/10 bg-[#090909]">
          <h3 className="text-white mb-3">Device Distribution</h3>
          <Pie data={data} />
        </div>
      ) : (
        <p className="text-xs text-white/40">
          Upgrade ke PRO buat lihat detail analytics 😏
        </p>
      )}
    </div>
  );
}