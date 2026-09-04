# 🦒 GiraffyReach Backend

A complete Node/Express + SQLite backend for GiraffyReach: accounts & JWT auth, a real database for profiles / pipeline / alerts, server-side job aggregation with a scheduled 20-minute refresh, server-held AI (Claude), and recruiter open/click tracking.

No external database required — persistence is a single SQLite file.

## Run locally

```bash
cd server
cp .env.example .env        # then edit .env
npm install
npm start                    # http://localhost:8787
```

Set at least `JWT_SECRET` (any long random string) and, for AI features, `ANTHROPIC_API_KEY`.

Check it's up:
```bash
curl http://localhost:8787/api/health
```

## Connect the frontend

Open the GiraffyReach app → **Profile → Backend** → enter the API base URL (e.g. `http://localhost:8787` locally, or your deployed URL) and **Sign up / Log in**. Once connected, your profile, pipeline, and alerts sync to the server, jobs are ranked server-side, and AI runs with the server's key (no browser key needed).

## API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create account → `{token,user}` |
| POST | `/api/auth/login` | – | Log in → `{token,user}` |
| GET | `/api/auth/me` | ✓ | Current user |
| GET/PUT | `/api/profile` | ✓ | Profile + résumé |
| GET/PUT | `/api/pipeline` | ✓ | Tracker items (PUT replaces the set) |
| GET/PUT | `/api/alerts` | ✓ | Saved searches |
| GET | `/api/jobs` | ✓ | Live roles, ranked to your résumé |
| POST | `/api/jobs/refresh` | ✓ | Force a re-scan |
| POST | `/api/ai/cover-letter` | ✓ | Generate a cover letter |
| POST | `/api/ai/resume-optimize` | ✓ | Rewrite résumé for a JD |
| POST | `/api/ai/interview-feedback` | ✓ | Critique an answer |
| POST | `/api/outreach/track` | ✓ | Mint an open/click tracking token |
| GET | `/api/outreach/events` | ✓ | Read opens/clicks |
| GET | `/track/o/:token.gif` | – | Open pixel (recruiter side) |
| GET | `/track/c/:token?u=URL` | – | Click redirect (recruiter side) |

Auth: send `Authorization: Bearer <token>` on the ✓ routes.

## Deploy (free)

**Render** — push this repo, then New → Blueprint (it reads `server/render.yaml`). Set `ANTHROPIC_API_KEY` in the dashboard. Gives you `https://giraffyreach-api.onrender.com`.

**Docker** — `docker build -t giraffyreach-api server && docker run -p 8787:8787 --env-file server/.env giraffyreach-api`

**Fly.io / Railway** — any Node host works; start command `node server.js`, root `server/`.

## Notes
- Storage uses Node's built-in `node:sqlite` (Node 22.5+/24) — no native compilation, no build tools, `npm install` only pulls pure-JS deps.
- CORS is open so the static GitHub Pages frontend can call the API. To lock it down, replace `cors()` with an allow-list of your Pages origin.
- Tracking pixels and cold outreach have deliverability/privacy implications — use responsibly and comply with applicable law.
