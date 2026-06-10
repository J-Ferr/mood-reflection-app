const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/auth.controller");
const crypto = require("crypto");
const pool = require("../db/pool");
const { Pool } = require("pg");

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

    await pool.query(
      `UPDATE users
       SET reset_password_token = $1,
           reset_password_expires = $2
       WHERE id = $3`,
      [resetToken, resetExpires, user.id]
    );

    const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

    console.log("Reset link:", resetLink);

    return res.json({
      message: "If an account exists with that email, a reset link will be sent.",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
