const express = require("express");
const crypto = require("crypto");
const { pool } = require("../db");
const { requireAuth } = require("../lib/auth");

const router = express.Router();
router.use(requireAuth);

router.post("/track", async (req, res) => {
  const token = crypto.randomBytes(9).toString("hex");
  const label = String((req.body && req.body.label) || "");
  await pool.query(
    "INSERT INTO outreach_events (user_id, token, label, kind, meta) VALUES ($1, $2, $3, 'created', '')",
    [req.user.uid, token, label]
  );
  const base = process.env.PUBLIC_URL || (req.protocol + "://" + req.get("host"));
  res.json({
    token,
    pixel: `${base}/track/o/${token}.gif`,
    clickBase: `${base}/track/c/${token}?u=`,
  });
});

router.get("/events", async (req, res) => {
  const r = await pool.query(
    "SELECT token, label, kind, meta, ts FROM outreach_events WHERE user_id = $1 ORDER BY ts DESC LIMIT 500",
    [req.user.uid]
  );
  res.json({ events: r.rows });
});

module.exports = router;
