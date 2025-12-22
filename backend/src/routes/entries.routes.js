const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getTodayEntry, createEntry, listEntries, getEntryByDate, updateTodayEntry, getEntryStats } = require("../controllers/entries.controller");

router.use(auth);

router.get("/today", getTodayEntry);
router.post("/", createEntry);
router.patch("/today", updateTodayEntry);
router.get("/stats", getEntryStats);
router.get("/", listEntries);
router.get("/:date", getEntryByDate); // date format YYYY-MM-DD

module.exports = router;
