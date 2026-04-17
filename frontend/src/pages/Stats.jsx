import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { clearToken } from "../auth/useAuth";

import Page from "../components/Page";
import Card from "../components/Card";
import Nav from "../components/Nav";

const MOOD_META = {
  1: { emoji: "😞", label: "Rough", textClass: "text-rose-400", bgClass: "bg-rose-500/10 border-rose-400/20" },
  2: { emoji: "😕", label: "Low", textClass: "text-orange-400", bgClass: "bg-orange-500/10 border-orange-400/20" },
  3: { emoji: "😐", label: "Okay", textClass: "text-amber-300", bgClass: "bg-amber-500/10 border-amber-300/20" },
  4: { emoji: "🙂", label: "Good", textClass: "text-emerald-400", bgClass: "bg-emerald-500/10 border-emerald-400/20" },
  5: { emoji: "😊", label: "Great", textClass: "text-cyan-300", bgClass: "bg-cyan-500/10 border-cyan-300/20" },
};

function clampMood(value) {
  if (value === null || value === undefined) return null;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    const moodMap = {
      rough: 1,
      bad: 1,
      low: 2,
      down: 2,
      okay: 3,
      ok: 3,
      neutral: 3,
      good: 4,
      great: 5,
      happy: 5,
    };

    if (moodMap[normalized]) {
      return moodMap[normalized];
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    return Math.min(5, Math.max(1, Math.round(numeric)));
  }

  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(5, Math.max(1, Math.round(n)));
}

function formatAverage(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}/5`;
}

function getAverageLabel(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "No data yet";
  if (n >= 4.5) return "Very positive";
  if (n >= 3.8) return "Mostly positive";
  if (n >= 3.0) return "Balanced overall";
  if (n >= 2.0) return "A bit low lately";
  return "Having a tough stretch";
}

function getMoodInfoFromValue(value) {
  const mood = clampMood(value);
  if (!mood) {
    return {
      emoji: "—",
      label: "No mood yet",
      textClass: "text-white",
      bgClass: "bg-white/5 border-white/10",
    };
  }
  return MOOD_META[mood];
}

function getMoodInfoFromLabel(label) {
  if (!label) {
    return {
      emoji: "—",
      label: "No mood yet",
      textClass: "text-white",
      bgClass: "bg-white/5 border-white/10",
    };
  }

  const normalized = String(label).trim().toLowerCase();

  const match =
    Object.values(MOOD_META).find(
      (m) => m.label.toLowerCase() === normalized
    ) || null;

  return (
    match || {
      emoji: "—",
      label,
      textClass: "text-white",
      bgClass: "bg-white/5 border-white/10",
    }
  );
}

function deriveMostCommonMood(stats, recentEntries) {
  if (stats?.mostCommonMoodValue !== undefined && stats?.mostCommonMoodValue !== null) {
    return getMoodInfoFromValue(stats.mostCommonMoodValue);
  }

  if (stats?.most_common_mood_value !== undefined && stats?.most_common_mood_value !== null) {
    return getMoodInfoFromValue(stats.most_common_mood_value);
  }

  if (stats?.mostCommonMood) {
    return getMoodInfoFromLabel(stats.mostCommonMood);
  }

  if (stats?.most_common_mood) {
    return getMoodInfoFromLabel(stats.most_common_mood);
  }

  if (!recentEntries.length) {
    return {
      emoji: "—",
      label: "No mood yet",
      textClass: "text-slate-900",
      bgClass: "bg-white/5 border-white/10",
    };
  }

  const counts = {};

  for (const entry of recentEntries) {
    const mood = clampMood(
      entry.moodValue ??
        entry.mood_value ??
        entry.mood ??
        entry.rating ??
        entry.mood_label ??
        entry.moodLabel ??
        entry.label
    );

    if (!mood) continue;
    counts[mood] = (counts[mood] || 0) + 1;
  }

  const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  if (!winner) {
    return {
      emoji: "—",
      label: "No mood yet",
      textClass: "text-slate-900",
      bgClass: "bg-white/5 border-white/10",
    };
  }

  return getMoodInfoFromValue(Number(winner[0]));
}

function buildInsight({
  totalEntries,
  averageMood,
  recentAverageMood,
  mostCommonMoodLabel,
  trendEntries,
}) {
  if (!totalEntries) {
    return "No stats yet — start checking in daily and your mood patterns will begin to show here.";
  }

  const avg = Number(averageMood);
  const recent = Number(recentAverageMood);
  const recentCount = trendEntries.length;

  if (recentCount >= 4 && Number.isFinite(avg) && Number.isFinite(recent)) {
    const diff = recent - avg;

    if (diff >= 0.5) {
      return `Your recent mood is trending upward compared to your overall average. You’ve been feeling better lately, which is a strong sign of momentum.`;
    }

    if (diff <= -0.5) {
      return `Your recent mood dipped below your usual pattern a bit. Nothing dramatic, but it may be a good moment to slow down and check in with yourself.`;
    }
  }

  if (Number.isFinite(avg) && avg >= 4.2) {
    return `Your check-ins have been strongly positive overall. You seem to be in a pretty grounded, steady stretch right now.`;
  }

  if (Number.isFinite(avg) && avg >= 3.2) {
    return `Your recent mood trend looks fairly balanced. You’re staying pretty steady overall, even if some days feel better than others.`;
  }

  if (Number.isFinite(avg) && avg < 3.2) {
    return `Your entries suggest things have felt a little heavier lately. That doesn’t mean you’re stuck there — it just means your reflection is catching something real.`;
  }

  if (mostCommonMoodLabel) {
    return `Your most common mood so far has been ${mostCommonMoodLabel.toLowerCase()}, which gives you a good starting point for spotting patterns over time.`;
  }

  return "Your mood history is starting to form a pattern. Keep checking in consistently so the app can give you sharper insights.";
}

function normalizeTrendEntries(stats) {
  const possibleEntries =
    stats?.recentEntries ||
    stats?.recent_entries ||
    stats?.last7Entries ||
    stats?.last_7_entries ||
    [];

  if (Array.isArray(possibleEntries) && possibleEntries.length) {
    return possibleEntries
      .map((entry, index) => {
        const moodValue = clampMood(
          entry.moodValue ??
            entry.mood_value ??
            entry.mood ??
            entry.rating ??
            entry.mood_label ??
            entry.moodLabel ??
            entry.label
        );

        return {
          id: entry.id ?? `${index}-${moodValue ?? "mood"}`,
          moodValue,
        };
      })
      .filter((entry) => entry.moodValue !== null)
      .slice(0, 7);
  }

  if (Array.isArray(stats?.last7MoodValues) && stats.last7MoodValues.length) {
    return stats.last7MoodValues
      .map((value, index) => ({
        id: `last7-${index}`,
        moodValue: clampMood(value),
      }))
      .filter((entry) => entry.moodValue !== null)
      .slice(0, 7);
  }

  if (Array.isArray(stats?.last_7_mood_values) && stats.last_7_mood_values.length) {
    return stats.last_7_mood_values
      .map((value, index) => ({
        id: `last7-${index}`,
        moodValue: clampMood(value),
      }))
      .filter((entry) => entry.moodValue !== null)
      .slice(0, 7);
  }

  return [];
}

function MoodTrend({ entries }) {
  if (!entries.length) {
    return (
      <p className="mt-4 text-sm text-slate-500">
        No recent trend yet.
      </p>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-end gap-2">
        {entries.map((entry, index) => {
          const info = getMoodInfoFromValue(entry.moodValue);
          const height = entry.moodValue * 14 + 8;

          return (
            <div
              key={entry.id}
              className="flex flex-col items-center gap-2"
              title={`${info.label} (${entry.moodValue}/5)`}
            >
              <div
                className={`w-8 rounded-full border ${info.bgClass}`}
                style={{ height: `${height}px` }}
              />
              <span className="text-lg">{info.emoji}</span>
              <span className="text-[10px] text-slate-500">
                {index + 1}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Most recent 7 check-ins
      </p>
    </div>
  );
}

export default function Stats() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await axiosClient.get("/entries/stats");
        setStats(res.data);
      } catch (err) {
        if (err?.response?.status === 401) {
          clearToken();
          navigate("/login");
          return;
        }

        console.error("Failed to load stats:", err);
        setStats({});
      }
    }

    loadStats();
  }, [navigate]);

  const computed = useMemo(() => {
    const totalEntries = Number(stats?.totalEntries ?? stats?.total_entries ?? 0);

    const averageMood = Number(
      stats?.averageMood ?? stats?.average_mood ?? stats?.avgMood ?? 0
    );

    const recentAverageMood = Number(
      stats?.recentAverageMood ??
        stats?.recent_average_mood ??
        stats?.last7AverageMood ??
        stats?.last7_average_mood ??
        averageMood ??
        0
    );

    const trendEntries = normalizeTrendEntries(stats);
    const mostCommonMood = deriveMostCommonMood(stats, trendEntries);

    const insight = buildInsight({
      totalEntries,
      averageMood,
      recentAverageMood,
      mostCommonMoodLabel: mostCommonMood.label,
      trendEntries,
    });

    return {
      totalEntries,
      averageMood,
      recentAverageMood,
      trendEntries,
      mostCommonMood,
      insight,
    };
  }, [stats]);

  if (!stats) {
    return (
      <Page title="Stats" subtitle="Mood overview">
        <Nav />
        <div className="mt-6">
          <Card>
            <p className="text-slate-500">Loading your stats...</p>
          </Card>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Stats" subtitle="Mood overview">
      <Nav />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm uppercase tracking-wide text-slate-500">
            Total entries
          </p>
          <h2 className="mt-3 text-4xl font-semibold text-slate-900">
            {computed.totalEntries}
          </h2>
          <p className="mt-3 text-base text-slate-500">
            All completed mood check-ins so far.
          </p>
        </Card>

        <Card>
          <p className="text-sm uppercase tracking-wide text-slate-500">
            Average mood
          </p>
          <h2 className="mt-3 text-4xl font-semibold text-slate-900">
            {formatAverage(computed.averageMood)}
          </h2>
          <p className="mt-3 text-base text-slate-500">
            {getAverageLabel(computed.averageMood)}
          </p>
        </Card>

        <Card className={`border ${computed.mostCommonMood.bgClass}`}>
          <p className="text-sm uppercase tracking-wide text-slate-500">
            Most common mood
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-3xl">{computed.mostCommonMood.emoji}</span>
            <h2 className={`text-4xl font-semibold ${computed.mostCommonMood.textClass}`}>
              {computed.mostCommonMood.label}
            </h2>
          </div>
          <p className="mt-3 text-base text-slate-500">
            The mood that appears most often in your entries.
          </p>
        </Card>

        <Card>
          <p className="text-sm uppercase tracking-wide text-slate-500">
            Last 7 check-ins
          </p>
          <h2 className="mt-3 text-4xl font-semibold text-slate-900">
            {formatAverage(computed.recentAverageMood)}
          </h2>
          <p className="mt-3 text-base text-slate-500">
            Your recent average mood based on the latest entries.
          </p>

          <MoodTrend entries={computed.trendEntries} />
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <p className="text-sm uppercase tracking-wide text-slate-500">
            Insight
          </p>
          <p className="mt-5 text-lg leading-8 text-slate-700">
            {computed.insight}
          </p>
        </Card>
      </div>
    </Page>
  );
}
