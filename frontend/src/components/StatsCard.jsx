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
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Your check-in
          </div>

          <div className="text-2xl font-extrabold">
            {currentStreakDays} day{currentStreakDays === 1 ? "" : "s"}
            <span className="text-sm font-semibold text-slate-500 ml-2">
              (best: {longestStreakDays})
            </span>
          </div>

          <div className="text-sm text-slate-600">
            This month:{" "}
            <span className="font-semibold">{thisMonthEntries}</span> • Total:{" "}
            <span className="font-semibold">{totalEntries}</span>
          </div>
        </div>

        <div className="min-w-65 flex-1 space-y-1">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Insight
          </div>

          <div className="text-sm text-slate-800 leading-relaxed">
            {insight}
          </div>
        </div>
      </div>
    </Card>
  );
}


