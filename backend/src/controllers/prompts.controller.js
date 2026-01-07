// backend/src/controllers/prompts.controller.js
const pool = require("../db/pool"); // <-- change this path if your other controllers use a different one

const PROMPTS = [
  "What felt heavy today, and what helped?",
  "What are you proud of today — even if it's small?",
  "What drained you today, and what gave you energy?",
  "What do you need more of right now?",
  "What do you need less of right now?",
  "What’s one thing you want to release tonight?",
  "What emotion have you been avoiding?",
  "What’s one small win you can acknowledge today?",
  "What’s one thing you can forgive yourself for tonight?",
  "What’s one boundary you want to honor today?",
  "What’s been taking up the most space in your mind lately?",
  "What’s something you’re grateful for that you usually overlook?",
  "What part of today felt the most like you?",
  "What’s one thought you don’t need to carry into tomorrow?",
  "What does your body need right now?",
  "What’s something that brought you even a moment of calm today?",
  "What’s one way you showed up for yourself today?",
  "If today had a message for you, what would it be?",
];

// Stable "day key" (same all day, changes tomorrow)
// Using UTC date is simplest + consistent; fine for this app.
function getDayKeyUTC() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function hashStringToInt(str) {
  // Simple deterministic hash
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

exports.getTodayPrompt = async (req, res, next) => {
  try {
    // This assumes your /prompts/today route is protected by auth middleware
    // and sets req.user.id
    const userId = req.user?.id || req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });


    // If somehow not authed, fall back to a deterministic global rotation
    const dayKey = getDayKeyUTC();
    if (!userId) {
      const idx = hashStringToInt(dayKey) % PROMPTS.length;
      return res.json({ prompt: PROMPTS[idx] });
    }

    // Look at the user's most recent prompts (last 5 check-ins)
    const recentLimit = 5;

    const { rows } = await pool.query(
      `
      SELECT prompt
      FROM entries
      WHERE user_id = $1
        AND prompt IS NOT NULL
        AND prompt <> ''
      ORDER BY entry_date DESC
      LIMIT $2
      `,
      [userId, recentLimit]
    );

    const recentPrompts = new Set(rows.map((r) => r.prompt));

    // Filter out recently-used prompts
    const available = PROMPTS.filter((p) => !recentPrompts.has(p));

    // If everything is "recent" (small prompt list), allow repeats
    const poolList = available.length > 0 ? available : PROMPTS;

    // Deterministic choice for the day *per user*
    // (stable across refresh; different users can get different prompts)
    const seed = `${dayKey}:${userId}`;
    const idx = hashStringToInt(seed) % poolList.length;

    return res.json({ prompt: poolList[idx] });
  } catch (err) {
    return next(err);
  }
};

