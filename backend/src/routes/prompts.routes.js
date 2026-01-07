const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getTodayPrompt } = require("../controllers/prompts.controller");

router.get("/today", auth, getTodayPrompt);

module.exports = router;
