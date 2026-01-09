// backend/src/db/pool.js
const { Pool } = require("pg");

// Helper: pick env var from multiple possible names
function pickEnv(...keys) {
  for (const k of keys) {
    const v = process.env[k];
    if (v !== undefined && v !== "") return v;
  }
  return undefined;
}

// Prefer DATABASE_URL if present (common in deployment)
const DATABASE_URL = pickEnv("DATABASE_URL");

// Otherwise use PG* or DB_* vars
const host = pickEnv("PGHOST", "DB_HOST", "HOST");
const portRaw = pickEnv("PGPORT", "DB_PORT", "PORT");
const database = pickEnv("PGDATABASE", "DB_NAME", "DB_DATABASE", "DATABASE");
const user = pickEnv("PGUSER", "DB_USER", "DB_USERNAME", "USER");
const password = pickEnv("PGPASSWORD", "DB_PASSWORD", "PASSWORD");

const port = portRaw ? Number(portRaw) : undefined;

let pool;

if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    // If you deploy and need SSL later, enable this:
    // ssl: { rejectUnauthorized: false },
  });
} else {
  pool = new Pool({
    host,
    port,
    database,
    user,
    password,
  });
}

// Log resolved config (never show password)
console.log("DB CONFIG (resolved):", {
  using: DATABASE_URL ? "DATABASE_URL" : "HOST/PORT/DB/USER",
  host: DATABASE_URL ? "(from DATABASE_URL)" : host,
  port: DATABASE_URL ? "(from DATABASE_URL)" : port,
  database: DATABASE_URL ? "(from DATABASE_URL)" : database,
  user: DATABASE_URL ? "(from DATABASE_URL)" : user,
});


module.exports = pool;
