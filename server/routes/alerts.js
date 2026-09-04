const express = require("express");
const { pool } = require("../db");
const { requireAuth } = require("../lib/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const r = await pool.query("SELECT data FROM alerts WHERE user_id = $1", [req.user.uid]);
  res.json({ alerts: r.rows.map((x) => JSON.parse(x.data)) });
});

router.put("/", async (req, res) => {
  const items = Array.isArray(req.body.alerts) ? req.body.alerts : [];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM alerts WHERE user_id = $1", [req.user.uid]);
    for (const a of items) {
      await client.query("INSERT INTO alerts (id, user_id, data) VALUES ($1, $2, $3)",
        [String(a.id || Date.now() + "" + Math.random()), req.user.uid, JSON.stringify(a)]);
    }
    await client.query("COMMIT");
    res.json({ ok: true, count: items.length });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

module.exports = router;
