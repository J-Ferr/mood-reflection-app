const pool = require("../db/pool");

// helper: get "today" in server time (fine for MVP)
function todayDateString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

exports.getTodayEntry = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = todayDateString();

    const result = await pool.query(
      `SELECT id, entry_date, mood, prompt, note, created_at
       FROM daily_entries
       WHERE user_id = $1 AND entry_date = $2`,
      [userId, today]
    );

    res.json({ entry: result.rows[0] || null });
  } catch (err) {
    next(err);
  }
};

exports.createEntry = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { mood, prompt, note } = req.body;

    if (!Number.isInteger(mood) || mood < 1 || mood > 5) {
      return res.status(400).json({ error: "Mood must be an integer from 1 to 5" });
    }

    if (typeof prompt !== "string" || prompt.trim().length < 3) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const entryDate = todayDateString();

    const result = await pool.query(
      `INSERT INTO daily_entries (user_id, entry_date, mood, prompt, note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, entry_date, mood, prompt, note, created_at`,
      [userId, entryDate, mood, prompt.trim(), typeof note === "string" ? note.trim() : null]
    );

    res.status(201).json({ entry: result.rows[0] });
  } catch (err) {
    // UNIQUE violation => user already created entry today
    if (err.code === "23505") {
      return res.status(409).json({ error: "You already submitted today’s check-in" });
    }
    next(err);
  }
};

exports.listEntries = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const result = await pool.query(
      `SELECT id, entry_date, mood, prompt, note, created_at
       FROM daily_entries
       WHERE user_id = $1
       ORDER BY entry_date DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({ entries: result.rows, limit, offset });
  } catch (err) {
    next(err);
  }
};


exports.getEntryByDate = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;

    // minimal date validation
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Date must be YYYY-MM-DD" });
    }

    const result = await pool.query(
      `SELECT id, entry_date, mood, prompt, note, created_at
       FROM daily_entries
       WHERE user_id = $1 AND entry_date = $2`,
      [userId, date]
    );

    res.json({ entry: result.rows[0] || null });
  } catch (err) {
    next(err);
  }
};

exports.updateTodayEntry = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { mood, note } = req.body;

    if (mood === undefined && note === undefined) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    if (mood !== undefined) {
      if (!Number.isInteger(mood) || mood < 1 || mood > 5) {
        return res.status(400).json({ error: "Mood must be an integer from 1 to 5" });
      }
    }

    const today = todayDateString();

    const result = await pool.query(
      `
      UPDATE daily_entries
      SET
        mood = COALESCE($1, mood),
        note = COALESCE($2, note),
        updated_at = NOW()
      WHERE user_id = $3 AND entry_date = $4
      RETURNING id, entry_date, mood, prompt, note, updated_at
      `,
      [
        mood ?? null,
        typeof note === "string" ? note.trim() : null,
        userId,
        today
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "No entry found for today" });
    }

    res.json({ entry: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.getEntryStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1) Summary: total + avg + this month
    const summaryResult = await pool.query(
      `
      SELECT
        COUNT(*)::int AS "totalEntries",
        ROUND(AVG(mood)::numeric, 2) AS "averageMood",
        COUNT(*) FILTER (
          WHERE date_trunc('month', entry_date) = date_trunc('month', CURRENT_DATE)
        )::int AS "thisMonthEntries"
      FROM daily_entries
      WHERE user_id = $1
      `,
      [userId]
    );

    const summary = summaryResult.rows[0];

    // 2) Best day (highest mood)
    const bestDayResult = await pool.query(
      `
      SELECT entry_date, mood
      FROM daily_entries
      WHERE user_id = $1
      ORDER BY mood DESC, entry_date DESC
      LIMIT 1
      `,
      [userId]
    );

    // 3) Worst day (lowest mood)
    const worstDayResult = await pool.query(
      `
      SELECT entry_date, mood
      FROM daily_entries
      WHERE user_id = $1
      ORDER BY mood ASC, entry_date DESC
      LIMIT 1
      `,
      [userId]
    );

    // 4) Streaks (current + longest)
    // We assume one entry per day per user (your app enforces this)
    const datesResult = await pool.query(
      `
      SELECT entry_date::date AS entry_date
      FROM daily_entries
      WHERE user_id = $1
      ORDER BY entry_date ASC
      `,
      [userId]
    );

    const dateStrings = datesResult.rows.map((r) => {
      // r.entry_date is a Date-like value; normalize to YYYY-MM-DD
      const d = new Date(r.entry_date);
      return d.toISOString().slice(0, 10);
    });

    const dateSet = new Set(dateStrings);

    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);

    const addDays = (date, delta) => {
      const d = new Date(date);
      d.setDate(d.getDate() + delta);
      return d;
    };

    // Current streak: start from today if entry exists, else from yesterday
    let currentStreakDays = 0;
    let cursor = dateSet.has(todayKey) ? today : addDays(today, -1);

    while (dateSet.has(cursor.toISOString().slice(0, 10))) {
      currentStreakDays += 1;
      cursor = addDays(cursor, -1);
    }

    // Longest streak: scan ordered unique dates
    // (dateStrings is already ordered ascending from query)
    let longestStreakDays = 0;
    let run = 0;

    for (let i = 0; i < dateStrings.length; i++) {
      if (i === 0) {
        run = 1;
      } else {
        const prev = new Date(dateStrings[i - 1]);
        const cur = new Date(dateStrings[i]);
        const diffDays = Math.round((cur - prev) / (1000 * 60 * 60 * 24));
        run = diffDays === 1 ? run + 1 : 1;
      }
      if (run > longestStreakDays) longestStreakDays = run;
    }

    res.json({
      totalEntries: summary.totalEntries,
      thisMonthEntries: summary.thisMonthEntries,
      averageMood: summary.averageMood ? Number(summary.averageMood) : null,
      bestDay: bestDayResult.rows[0] || null,
      worstDay: worstDayResult.rows[0] || null,
      currentStreakDays,
      longestStreakDays,
    });
  } catch (err) {
    next(err);
  }
};


