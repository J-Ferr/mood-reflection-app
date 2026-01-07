const router = require("express").Router();
const { getOverview } = require("../controllers/stats.controller");
const auth = require("../middleware/auth");

router.get("/overview", auth, getOverview);

module.exports = router;
