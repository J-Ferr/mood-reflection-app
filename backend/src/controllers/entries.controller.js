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

    const result = await pool.query(
      `SELECT id, entry_date, mood, prompt, note, created_at
       FROM daily_entries
       WHERE user_id = $1
       ORDER BY entry_date DESC`,
      [userId]
    );

    res.json({ entries: result.rows });
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

    // 1️⃣ Average mood + total entries
    const summaryResult = await pool.query(
      `
      SELECT
        COUNT(*)::int AS "totalEntries",
        ROUND(AVG(mood)::numeric, 2) AS "averageMood"
      FROM daily_entries
      WHERE user_id = $1
      `,
      [userId]
    );

    const summary = summaryResult.rows[0];

    // 2️⃣ Best day (highest mood)
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

    // 3️⃣ Worst day (lowest mood)
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

    res.json({
      totalEntries: summary.totalEntries,
      averageMood: summary.averageMood
        ? Number(summary.averageMood)
        : null,
      bestDay: bestDayResult.rows[0] || null,
      worstDay: worstDayResult.rows[0] || null
    });
  } catch (err) {
    next(err);
  }
};

