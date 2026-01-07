import Card from "./Card";

export default function StatsCard({ stats }) {
  if (!stats) return null;

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Your check-in
          </div>

          <div className="text-2xl font-extrabold">
            {stats.currentStreak} day{stats.currentStreak === 1 ? "" : "s"}
            <span className="text-sm font-semibold text-slate-500 ml-2">
              (best: {stats.longestStreak})
            </span>
          </div>

          <div className="text-sm text-slate-600">
            This month:{" "}
            <span className="font-semibold">{stats.entriesThisMonth}</span>{" "}
            • Total:{" "}
            <span className="font-semibold">{stats.totalEntries}</span>
          </div>
        </div>

        <div className="min-w-[260px] flex-1 space-y-1">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Insight
          </div>

          <div className="text-sm text-slate-800 leading-relaxed">
            {stats.insight}
          </div>
        </div>
      </div>
    </Card>
  );
}

