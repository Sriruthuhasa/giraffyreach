require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const db = require("./db");
const jobsLib = require("./lib/jobs");

const app = express();
app.use(cors()); // open CORS so the GitHub Pages frontend can call this API
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true, jobs: jobsLib.cache().jobs.length, at: jobsLib.cache().at }));

// API routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/pipeline", require("./routes/pipeline"));
app.use("/api/alerts", require("./routes/alerts"));
app.use("/api/jobs", require("./routes/jobs"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/outreach", require("./routes/outreach"));

// Public tracking (recruiters hit these)
app.use("/track", require("./routes/track"));

// Optionally serve the frontend (index.html one level up) from the same origin.
app.use(express.static(path.join(__dirname, "..")));

const PORT = process.env.PORT || 8787;

// Init DB schema, then warm the job cache; refresh jobs every 20 minutes ("within-the-hour").
(async () => {
  try { await db.init(); console.log("[db] schema ready"); }
  catch (e) { console.error("[db] init failed:", e.message); }
  try { await jobsLib.refresh(); console.log("[jobs] warmed:", jobsLib.cache().jobs.length, "roles"); }
  catch (e) { console.error("[jobs] warm failed:", e.message); }
})();
cron.schedule("*/20 * * * *", async () => {
  try { await jobsLib.refresh(); console.log("[jobs] refreshed:", jobsLib.cache().jobs.length, "roles"); }
  catch (e) { console.error("[jobs] refresh failed:", e.message); }
});

app.listen(PORT, () => console.log(`GiraffyReach backend on http://localhost:${PORT}`));
