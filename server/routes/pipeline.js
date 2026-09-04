const express = require("express");
const { pool } = require("../db");
const { requireAuth } = require("../lib/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const r = await pool.query("SELECT data FROM pipeline WHERE user_id = $1 ORDER BY updated DESC", [req.user.uid]);
  res.json({ pipeline: r.rows.map((x) => JSON.parse(x.data)) });
});

// Replace the whole pipeline (simplest reliable sync from the client), in a transaction.
router.put("/", async (req, res) => {
  const items = Array.isArray(req.body.pipeline) ? req.body.pipeline : [];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM pipeline WHERE user_id = $1", [req.user.uid]);
    for (const it of items) {
      await client.query("INSERT INTO pipeline (id, user_id, data) VALUES ($1, $2, $3)",
        [String(it.id || Date.now() + "" + Math.random()), req.user.uid, JSON.stringify(it)]);
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
