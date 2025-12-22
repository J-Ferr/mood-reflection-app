const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getTodayEntry, createEntry, listEntries, getEntryByDate } = require("../controllers/entries.controller");

router.use(auth);

router.get("/today", getTodayEntry);
router.post("/", createEntry);
router.get("/", listEntries);
router.get("/:date", getEntryByDate); // date format YYYY-MM-DD

module.exports = router;
