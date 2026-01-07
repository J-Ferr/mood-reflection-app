const pool = require("../db/pool");

// Helpers
function toISODate(d) {
  // d can be Date or string; always return YYYY-MM-DD
  const date = d instanceof Date ? d : new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysISO(iso, delta) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return toISODate(dt);
}

function daysBetweenISO(a, b) {
  // difference in days between iso dates (a - b)
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const A = new Date(ay, am - 1, ad);
  const B = new Date(by, bm - 1, bd);
  const ms = A - B;
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function computeStreaks(sortedDescDates) {
  // sortedDescDates: ["2026-01-06", "2026-01-05", ...]
  if (!sortedDescDates.length) {
    return { currentStreak: 0, longestStreak: 0, lastCheckIn: null };
  }

  const lastCheckIn = sortedDescDates[0];
  const today = toISODate(new Date());

  // Current streak counts consecutive days ending today
  let currentStreak = 0;
  if (lastCheckIn === today) {
    currentStreak = 1;
    for (let i = 1; i < sortedDescDates.length; i++) {
      const expected = addDaysISO(sortedDescDates[i - 1], -1);
      if (sortedDescDates[i] === expected) currentStreak++;
      else break;
    }
  }

  // Longest streak anywhere
  let longestStreak = 1;
  let run = 1;

  for (let i = 1; i < sortedDescDates.length; i++) {
    const expected = addDaysISO(sortedDescDates[i - 1], -1);
    if (sortedDescDates[i] === expected) {
      run++;
      if (run > longestStreak) longestStreak = run;
    } else {
      run = 1;
    }
  }

  return { currentStreak, longestStreak, lastCheckIn };
}

function makeInsight({ todayLogged, gapDays, currentStreak, moodsLast7, recentMoods }) {
  // moodsLast7: { calm: 3, anxious: 1 ... }
  // recentMoods: ["calm","calm","happy", ...] (most recent first)

  if (!todayLogged && gapDays === 0) {
    return "No check-in yet today — a 30-second reflection still counts.";
  }

  if (todayLogged && gapDays >= 3) {
    return `Welcome back — it’s been ${gapDays} days since your last check-in.`;
  }

  if (todayLogged && currentStreak >= 3) {
    return `You’re on a ${currentStreak}-day check-in streak. That consistency is doing something.`;
  }

  // Mood repetition insight
  const entries7 = Object.values(moodsLast7).reduce((a, b) => a + b, 0);
  if (entries7 >= 3) {
    const top = Object.entries(moodsLast7).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 3) {
      return `You’ve logged “${top[0]}” ${top[1]} times in the last 7 days — a clear pattern is forming.`;
    }
  }

  // Variety insight
  const variety = Object.keys(moodsLast7).length;
  if (variety >= 4) {
    return `You’ve used ${variety} different moods this week — lots of emotional movement.`;
  }

  // Recent mood trend (3 of last 5)
  const last5 = recentMoods.slice(0, 5);
  if (last5.length >= 3) {
    const freq = last5.reduce((acc, m) => {
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {});
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 3) {
      return `“${top[0]}” showed up ${top[1]} of your last ${last5.length} check-ins.`;
    }
  }

  // fallback
  return "Small check-ins add up. Keep it simple, keep it honest.";
}

exports.getOverview = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });


    // Pull enough history to compute streaks + simple insights
    const { rows } = await pool.query(
      `
      SELECT entry_date, mood
      FROM entries
      WHERE user_id = $1
      ORDER BY entry_date DESC
      LIMIT 400
      `,
      [userId]
    );

    const dates = rows.map(r => toISODate(r.entry_date));
    const moods = rows.map(r => r.mood).filter(Boolean);

    const today = toISODate(new Date());
    const todayLogged = dates[0] === today;

    const lastCheckIn = dates[0] || null;
    const gapDays = lastCheckIn ? daysBetweenISO(today, lastCheckIn) : 0;

    const { currentStreak, longestStreak } = computeStreaks(dates);

    // Mood counts last 7 days
    const moodsLast7 = {};
    for (const r of rows) {
      const d = toISODate(r.entry_date);
      const diff = daysBetweenISO(today, d);
      if (diff >= 0 && diff <= 6) {
        const m = r.mood || "unspecified";
        moodsLast7[m] = (moodsLast7[m] || 0) + 1;
      }
    }

    const insight = makeInsight({
      todayLogged,
      gapDays,
      currentStreak,
      moodsLast7,
      recentMoods: moods
    });

    // A couple extra useful stats
    const totalEntries = rows.length;

    // Month count
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const entriesThisMonth = dates.filter(d => d.startsWith(currentMonth)).length;

    return res.json({
      today,
      todayLogged,
      currentStreak,
      longestStreak,
      totalEntries,
      entriesThisMonth,
      lastCheckIn,
      gapDays,
      moodsLast7,
      insight
    });
  } catch (err) {
    console.error("stats overview error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
