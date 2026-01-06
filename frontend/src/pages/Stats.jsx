import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { clearToken } from "../auth/useAuth";
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Stats</h1>
            <p className="text-sm text-slate-600">
              Quick summary of your mood check-ins.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="text-sm px-3 py-2 rounded-lg border bg-white hover:bg-slate-50"
          >
            Back to dashboard
          </Link>
        </div>

        <Nav />

        {loading && (
          <div className="bg-white border rounded-xl p-5 text-slate-600">
            Loading stats…
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-800">
            <div className="font-medium">Couldn’t load stats</div>
            <div className="text-sm mt-1">{error}</div>
            <button
              onClick={loadStats}
              className="mt-3 text-sm px-3 py-2 rounded-lg bg-red-700 text-white hover:opacity-90"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard label="Total entries" value={totalEntries} />
              <StatCard label="Average mood" value={`${averageMood}/5`} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DayCard title="Best day" day={bestDay} />
              <DayCard title="Worst day" day={worstDay} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border rounded-xl p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function DayCard({ title, day }) {
  return (
    <div className="bg-white border rounded-xl p-5 space-y-2">
      <div className="text-sm text-slate-500">{title}</div>

      {!day ? (
        <div className="text-slate-600">—</div>
      ) : (
        <>
          <div className="text-xl font-semibold">{day.mood}/5</div>
          <div className="text-sm text-slate-600">
            {formatDate(day.entry_date)}
          </div>
        </>
      )}
    </div>
  );
}

