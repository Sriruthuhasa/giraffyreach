// Server-side job aggregation from official public ATS APIs + Remotive.
// Mirrors the frontend adapters; cached and refreshed on a schedule.

const BOARDS = [
  { p: "greenhouse", token: "stripe", co: "Stripe", color: "#635BFF" },
  { p: "greenhouse", token: "databricks", co: "Databricks", color: "#FF3621" },
  { p: "greenhouse", token: "figma", co: "Figma", color: "#F24E1E" },
  { p: "greenhouse", token: "airtable", co: "Airtable", color: "#2D7FF9" },
  { p: "greenhouse", token: "gitlab", co: "GitLab", color: "#FC6D26" },
  { p: "greenhouse", token: "anthropic", co: "Anthropic", color: "#CC785C" },
  { p: "greenhouse", token: "coinbase", co: "Coinbase", color: "#0052FF" },
  { p: "greenhouse", token: "retool", co: "Retool", color: "#3A3AFF" },
  { p: "ashby", token: "Ramp", co: "Ramp", color: "#E8A317" },
  { p: "ashby", token: "openai", co: "OpenAI", color: "#111111" },
  { p: "ashby", token: "linear", co: "Linear", color: "#5E6AD2" },
  { p: "ashby", token: "vercel", co: "Vercel", color: "#111111" },
  { p: "remotive", token: "remotive", co: "Remotive", color: "#1FA67A" },
];
const MAX_PER_BOARD = 40;

function hashColor(s) {
  let h = 0;
  for (let i = 0; i < (s || "").length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return "hsl(" + (h % 360) + " 52% 46%)";
}
function norm(b, j) {
  const upd = j.updated ? new Date(j.updated).getTime() : Date.now();
  const remote = j.remote || /remote/i.test(j.loc || "");
  const blob = ((j.role || "") + " " + (j.type || "") + " " + (j.dept || "")).toLowerCase();
  const c2c = /c2c|corp.?to.?corp|corp2corp/.test(blob);
  const contract = c2c || /contract|contractor|temporary|\btemp\b|\b1099\b|fixed.?term|freelance/.test(blob);
  return {
    id: b.p + "_" + b.token + "_" + j.id, co: b.co, color: b.color, role: j.role || "Role",
    loc: j.loc || (remote ? "Remote" : "—"), dept: j.dept || "", url: j.url || "#", ats: b.p,
    type: j.type || (remote ? "Remote" : ""), updated: upd, remote, contract, c2c, match: 0,
  };
}

async function fetchBoard(b) {
  try {
    if (b.p === "greenhouse") {
      const r = await fetch(`https://boards-api.greenhouse.io/v1/boards/${b.token}/jobs?content=false`);
      if (!r.ok) throw 0;
      const d = await r.json();
      return (d.jobs || []).slice(0, MAX_PER_BOARD).map((j) => norm(b, {
        id: j.id, role: j.title, url: j.absolute_url, loc: j.location && j.location.name,
        dept: j.departments && j.departments[0] && j.departments[0].name, updated: j.updated_at,
      }));
    }
    if (b.p === "ashby") {
      const r = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${b.token}`);
      if (!r.ok) throw 0;
      const d = await r.json();
      return (d.jobs || []).slice(0, MAX_PER_BOARD).map((j) => norm(b, {
        id: j.id, role: j.title, url: j.jobUrl || j.applyUrl, loc: j.location,
        dept: j.department || j.team, updated: j.publishedAt, remote: j.isRemote, type: j.employmentType,
      }));
    }
    if (b.p === "remotive") {
      const r = await fetch("https://remotive.com/api/remote-jobs?limit=140");
      if (!r.ok) throw 0;
      const d = await r.json();
      return (d.jobs || []).slice(0, 140).map((j) => {
        const co = j.company_name || "Remote";
        return norm({ p: "remotive", token: "remotive", co, color: hashColor(co) }, {
          id: j.id, role: j.title, url: j.url, loc: j.candidate_required_location || "Remote",
          dept: j.category, updated: j.publication_date, type: (j.job_type || "").replace(/_/g, " "), remote: true,
        });
      });
    }
  } catch (e) {
    return null; // board renamed / unavailable → skip
  }
  return [];
}

let CACHE = { jobs: [], at: 0, companies: 0 };

async function refresh() {
  const all = [];
  const results = await Promise.all(BOARDS.map(fetchBoard));
  results.forEach((r) => { if (r && r.length) all.push(...r); });
  all.sort((a, b) => b.updated - a.updated);
  CACHE = { jobs: all, at: Date.now(), companies: new Set(all.map((j) => j.co)).size };
  return CACHE;
}

function score(job, kw) {
  const hay = (job.role + " " + job.dept + " " + job.loc).toLowerCase();
  let hits = 0;
  kw.forEach((k) => { if (hay.includes(k)) hits++; });
  let h = 0;
  for (let i = 0; i < job.id.length; i++) h = (h * 31 + job.id.charCodeAt(i)) >>> 0;
  const recent = Date.now() - job.updated < 864e5 ? 4 : Date.now() - job.updated < 12096e5 ? 2 : 0;
  return Math.max(58, Math.min(99, 69 + hits * 8 + (h % 7) + recent));
}
function keywords(profileText) {
  const stop = new Set("the a an and or to of in on for with years year experience".split(" "));
  return [...new Set((profileText || "").toLowerCase().replace(/[^a-z0-9+ ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !stop.has(w)))];
}

function ranked(profileText) {
  const kw = keywords(profileText);
  const jobs = CACHE.jobs.map((j) => ({ ...j, match: score(j, kw) }));
  jobs.sort((a, b) => b.match - a.match || b.updated - a.updated);
  return { jobs, at: CACHE.at, companies: CACHE.companies, total: jobs.length };
}

module.exports = { refresh, ranked, cache: () => CACHE };
