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
  "What part of today felt the most like *you*?",
  "What’s one thought you don’t need to carry into tomorrow?",
  "What does your body need right now?",
  "What’s something that brought you even a moment of calm today?",
  "What’s one way you showed up for yourself today?",
  "If today had a message for you, what would it be?"
];


exports.getTodayPrompt = (req, res) => {
  // MVP: random
  const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  res.json({ prompt });
};
