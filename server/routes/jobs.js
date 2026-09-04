const express = require("express");
const db = require("../db");
const jobsLib = require("../lib/jobs");
const { requireAuth } = require("../lib/auth");

const router = express.Router();

// Public: ranked against the caller's profile if authenticated, else generic.
router.get("/", requireAuth, (req, res) => {
  const row = db.prepare("SELECT resume FROM profiles WHERE user_id = ?").get(req.user.uid);
  const profileText = (row && row.resume) || "";
  res.json(jobsLib.ranked(profileText));
});

// Force a re-scan of all sources.
router.post("/refresh", requireAuth, async (req, res) => {
  await jobsLib.refresh();
  const row = db.prepare("SELECT resume FROM profiles WHERE user_id = ?").get(req.user.uid);
  res.json(jobsLib.ranked((row && row.resume) || ""));
});

module.exports = router;
