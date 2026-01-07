const PROMPTS = [
  "What felt heavy today, and what helped?",
  "What are you proud of today — even if it's small?",
  "What drained you today, and what gave you energy?",
  "What do you need more of right now?",
  "What's one thing you want to release tonight?",
  "What emotion have you been avoiding?",
  "What's one small win you can acknowledge today?",
  "What's one thing you can forgive yourself tonight?",
  "what's one boundary you want to honor today?"
];

exports.getTodayPrompt = (req, res) => {
  // MVP: random
  const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  res.json({ prompt });
};
