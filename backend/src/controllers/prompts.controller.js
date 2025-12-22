const PROMPTS = [
  "What felt heavy today, and what helped?",
  "What are you proud of today — even if it’s small?",
  "What drained you today, and what gave you energy?",
  "What do you need more of right now?",
  "What’s one thing you want to release tonight?"
];

exports.getTodayPrompt = (req, res) => {
  // MVP: random
  const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  res.json({ prompt });
};
