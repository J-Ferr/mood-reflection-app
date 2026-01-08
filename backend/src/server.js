require("dotenv").config();
const app = require("./app");
const pool = require("./db/pool"); // adjust if your path is different

const PORT = process.env.PORT || 5000;

// Optional: quick DB sanity check (does NOT stop server)
(async () => {
  try {
    const { rows } = await pool.query(
      "SELECT current_database() AS db, inet_server_port() AS port, current_user AS user"
    );
    console.log("POOL CONNECTED TO:", rows[0]);
  } catch (err) {
    console.error("DB check failed:", err.message);
  }
})();

app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
});
