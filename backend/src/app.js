const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const entriesRoutes = require("./routes/entries.routes");
const promptsRoutes = require("./routes/prompts.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Routes
app.use("/auth", authRoutes);
app.use("/entries", entriesRoutes);
app.use("/prompts", promptsRoutes);

// Error handler (last)
app.use(errorHandler);

module.exports = app;
