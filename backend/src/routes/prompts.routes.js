const express = require("express");
const router = express.Router();
const { getTodayPrompt } = require("../controllers/prompts.controller");

router.get("/today", getTodayPrompt);

module.exports = router;
