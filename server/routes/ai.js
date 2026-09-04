// Server-side AI — the ANTHROPIC_API_KEY lives here, never in the browser.
const express = require("express");
const { requireAuth } = require("../lib/auth");

const router = express.Router();
router.use(requireAuth);

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

async function claude(system, user, maxTokens) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set on the server");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens || 800, system, messages: [{ role: "user", content: user }] }),
  });
  if (!r.ok) throw new Error("Claude " + r.status + ": " + (await r.text()).slice(0, 160));
  const d = await r.json();
  return (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}

router.post("/cover-letter", async (req, res) => {
  const { role, company, tone = "confident", emphasize = "", resume = "", name = "the candidate", headline = "" } = req.body || {};
  try {
    const text = await claude(
      `You are an expert cover-letter writer. Write a concise, specific, non-generic cover letter of about 180 words in first person, ${tone} tone. No placeholders or clichés. Sign off as the candidate.`,
      `Candidate: ${name}${headline ? ", " + headline : ""}. Emphasize: ${emphasize}. Résumé summary: ${String(resume).slice(0, 700)}. Target role: ${role} at ${company}.`,
      700
    );
    res.json({ text });
  } catch (e) { res.status(502).json({ error: e.message }); }
});

router.post("/resume-optimize", async (req, res) => {
  const { resume = "", jd = "" } = req.body || {};
  try {
    const text = await claude(
      "You are an expert résumé writer. Rewrite the résumé to naturally incorporate the important keywords from the job description while staying truthful to the candidate's real experience. ATS-friendly, concise, plain text. Never invent employers, titles, or dates.",
      "RESUME:\n" + resume + "\n\nJOB DESCRIPTION:\n" + jd,
      900
    );
    res.json({ text });
  } catch (e) { res.status(502).json({ error: e.message }); }
});

router.post("/interview-feedback", async (req, res) => {
  const { question = "", answer = "" } = req.body || {};
  try {
    const text = await claude(
      "You are a senior engineering interviewer. Give concise, specific, constructive feedback on the candidate's answer: what is strong, what is missing, and one concrete improvement. Under 120 words.",
      "Question: " + question + "\n\nAnswer: " + answer,
      400
    );
    res.json({ text });
  } catch (e) { res.status(502).json({ error: e.message }); }
});

module.exports = router;
