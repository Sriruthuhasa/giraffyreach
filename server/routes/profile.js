const express = require("express");
const { pool } = require("../db");
const { requireAuth } = require("../lib/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const r = await pool.query("SELECT data, resume FROM profiles WHERE user_id = $1", [req.user.uid]);
  const row = r.rows[0];
  res.json({ me: JSON.parse((row && row.data) || "{}"), resume: (row && row.resume) || "" });
});

router.put("/", async (req, res) => {
  const me = JSON.stringify(req.body.me || {});
  const resume = String(req.body.resume || "");
  await pool.query(
    `INSERT INTO profiles (user_id, data, resume) VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, resume = EXCLUDED.resume`,
    [req.user.uid, me, resume]
  );
  res.json({ ok: true });
});

module.exports = router;
