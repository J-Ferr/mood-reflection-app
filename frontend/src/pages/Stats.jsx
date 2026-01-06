import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { clearToken } from "../auth/useAuth";

import Page from "../components/Page";
import Card from "../components/Card";
import Nav from "../components/Nav";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Stats() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  async function loadStats() {
    setLoading(true);
    setError("");

    try {
      const res = await axiosClient.get("/entries/stats");
      setStats(res.data ?? null);
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.error || err?.message || "Failed to load stats.";
      setError(msg);

      if (status === 401) {
        clearToken();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalEntries = stats?.totalEntries ?? 0;
  const averageMood = stats?.averageMood ?? "—";
  const bestDay = stats?.bestDay ?? null;
  const worstDay = stats?.worstDay ?? null;

  return (
    <Page title="Stats" subtitle="A quick snapshot of your mood trends.">
      <Nav />

      {loading && (
        <Card>
          <p className="text-slate-600">Loading stats…</p>
        </Card>
      )}

      {!loading && error && (
        <Card className="border-red-200 bg-red-50/80">
          <div className="font-medium text-red-800">Couldn’t load stats</div>
          <div className="text-sm mt-1 text-red-700">{error}</div>
          <button
            onClick={loadStats}
            className="mt-3 text-sm px-3 py-2 rounded-full bg-red-700 text-white hover:opacity-90 transition"
          >
            Try again
          </button>
        </Card>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <div className="text-sm text-slate-500">Total entries</div>
              <div className="text-3xl font-semibold mt-1">{totalEntries}</div>
            </Card>

            <Card>
              <div className="text-sm text-slate-500">Average mood</div>
              <div className="text-3xl font-semibold mt-1">
                {averageMood}/5
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="space-y-2">
              <div className="text-sm text-slate-500">Best day</div>
              {!bestDay ? (
                <div className="text-slate-600">—</div>
              ) : (
                <>
                  <div className="text-xl font-semibold text-slate-900">
                    {bestDay.mood}/5
                  </div>
                  <div className="text-sm text-slate-600">
                    {formatDate(bestDay.entry_date)}
                  </div>
                </>
              )}
            </Card>

            <Card className="space-y-2">
              <div className="text-sm text-slate-500">Worst day</div>
              {!worstDay ? (
                <div className="text-slate-600">—</div>
              ) : (
                <>
                  <div className="text-xl font-semibold text-slate-900">
                    {worstDay.mood}/5
                  </div>
                  <div className="text-sm text-slate-600">
                    {formatDate(worstDay.entry_date)}
                  </div>
                </>
              )}
            </Card>
          </div>
        </>
      )}
    </Page>
  );
}
