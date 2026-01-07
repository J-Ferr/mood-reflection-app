export default function StatsCard({ stats }) {
  if (!stats) return null;

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, opacity: 0.9 }}>Your check-in</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
            {stats.currentStreak} day{stats.currentStreak === 1 ? "" : "s"}
            <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 8, opacity: 0.7 }}>
              (best: {stats.longestStreak})
            </span>
          </div>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
            This month: <strong>{stats.entriesThisMonth}</strong> • Total: <strong>{stats.totalEntries}</strong>
          </div>
        </div>

        <div style={{ flex: "1 1 320px", minWidth: 280 }}>
          <div style={{ fontWeight: 700, fontSize: 14, opacity: 0.9 }}>Insight</div>
          <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.4 }}>
            {stats.insight}
          </div>
        </div>
      </div>
    </div>
  );
}
