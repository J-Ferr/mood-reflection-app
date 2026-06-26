import Card from "./Card";

export default function StatsCard({ stats }) {
  if (!stats) return null;

  const {
    totalEntries,
    thisMonthEntries,
    currentStreakDays,
    longestStreakDays,
    averageMood,
  } = stats;

  // Simple insight logic (can evolve later)
  let insight = "Keep showing up — consistency builds clarity.";
  if (currentStreakDays >= 7) {
    insight = "Strong momentum. You’re building a real habit.";
  } else if (averageMood >= 4) {
    insight = "Your mood trend is positive overall.";
  } else if (averageMood && averageMood <= 2) {
    insight = "Be gentle with yourself. Reflection is doing its job.";
  }

  return (
    <Card className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white/40 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            🔥 Current streak
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {currentStreakDays} day{currentStreakDays === 1 ? "" : "s"}
          </div>
        </div>

        <div className="rounded-2xl bg-white/40 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            🏆 Best streak
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {longestStreakDays} day{longestStreakDays === 1 ? "" : "s"}
          </div>
        </div>

        <div className="rounded-2xl bg-white/40 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            📅 This month
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {thisMonthEntries}
          </div>
        </div>

        <div className="rounded-2xl bg-white/40 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            ✍️ Total entries
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {totalEntries}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white/40 p-4">
        <div className="text-xs uppercase tracking-wide text-slate-500">
          💡 Insight
        </div>

        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          {insight}
        </p>
      </div>
    </Card>
  );
}


