// PostgreSQL (durable). Set DATABASE_URL (Render provides it from the linked database).
const { Pool } = require("pg");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Provision a Postgres database and set DATABASE_URL.");
}

// Render internal connections (host without a domain) don't use SSL; external (*.render.com) do.
const pool = new Pool({
  connectionString: url,
  ssl: url && /\.render\.com/.test(url) ? { rejectUnauthorized: false } : false,
  max: 5,
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      email      TEXT UNIQUE NOT NULL,
      pw_hash    TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS profiles (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data    TEXT NOT NULL DEFAULT '{}',
      resume  TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS pipeline (
      id      TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      data    TEXT NOT NULL,
      updated TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_pipeline_user ON pipeline(user_id);
    CREATE TABLE IF NOT EXISTS alerts (
      id      TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      data    TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
    CREATE TABLE IF NOT EXISTS outreach_events (
      id      SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token   TEXT NOT NULL,
      label   TEXT,
      kind    TEXT NOT NULL,
      meta    TEXT,
      ts      TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_events_token ON outreach_events(token);
  `);
}

module.exports = { pool, init };
