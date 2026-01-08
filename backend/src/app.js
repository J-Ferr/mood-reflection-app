const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const entriesRoutes = require("./routes/entries.routes");
const promptsRoutes = require("./routes/prompts.routes");
const statsRoutes = require("./routes/stats.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Disable ETag so API responses don't return 304 during dev
app.set("etag", false);

// Prevent caching for API routes
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});


// Routes
app.use("/auth", authRoutes);
app.use("/entries", entriesRoutes);
app.use("/prompts", promptsRoutes);
app.use("/stats", statsRoutes);

// Error handler (last)
app.use(errorHandler);

module.exports = app;
