const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    console.log("Forgot password request for:", email);

    return res.json({
      message: "If an account exists with that email, a reset link will be sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
});

module.exports = router;
