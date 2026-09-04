const express = require("express");
const { pool } = require("../db");
const jobsLib = require("../lib/jobs");
const { requireAuth } = require("../lib/auth");

const router = express.Router();

async function resumeFor(uid) {
  const r = await pool.query("SELECT resume FROM profiles WHERE user_id = $1", [uid]);
  return (r.rows[0] && r.rows[0].resume) || "";
}

router.get("/", requireAuth, async (req, res) => {
  res.json(jobsLib.ranked(await resumeFor(req.user.uid)));
});

router.post("/refresh", requireAuth, async (req, res) => {
  await jobsLib.refresh();
  res.json(jobsLib.ranked(await resumeFor(req.user.uid)));
});

module.exports = router;
