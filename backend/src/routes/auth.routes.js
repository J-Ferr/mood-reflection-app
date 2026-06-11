const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/auth.controller");
const crypto = require("crypto");
const pool = require("../db/pool");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;

    const userResult = await pool.query(
      "SELECT id, email FROM users WHERE email = $1",
      [email]
    );

    // Always return same message for security
    if (userResult.rows.length === 0) {
      return res.json({
        message: "If an account exists with that email, a reset link will be sent.",
      });
    }

    const user = userResult.rows[0];

    const resetToken = crypto.randomBytes(32).toString("hex");

    const resetExpires = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

    const updateResult = await pool.query(
      `UPDATE users
      SET reset_password_token = $1,
        reset_password_expires = $2
      WHERE id = $3
      RETURNING id, email, reset_password_token, reset_password_expires`,
      [resetToken, resetExpires, user.id]
    );

    console.log("UPDATE ROWS:", updateResult.rowCount);
    console.log("UPDATED USER:", updateResult.rows[0]);

    const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

    console.log("Reset link:", resetLink);

    return res.json({
      message: "If an account exists with that email, a reset link will be sent.",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const userResult = await pool.query(
      `
      SELECT *
      FROM users
      WHERE reset_password_token = $1
      AND reset_password_expires > NOW()
      `,
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `
      UPDATE users
      SET password_hash = $1,
          reset_password_token = NULL,
          reset_password_expires = NULL
      WHERE reset_password_token = $2
      `,
      [hashedPassword, token]
    );

    res.json({
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({
      message: "Server error resetting password",
    });
  }
});

module.exports = router;
