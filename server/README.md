# 🦒 GiraffyReach Backend

A complete Node/Express + **PostgreSQL** backend for GiraffyReach: accounts & JWT auth, a durable database for profiles / pipeline / alerts, server-side job aggregation with a scheduled 20-minute refresh, server-held AI (Claude), and recruiter open/click tracking.

Data is stored in Postgres, so it survives restarts and redeploys.

## Run locally

```bash
cd server
cp .env.example .env         # then edit .env
npm install
# need a Postgres — quickest is Docker:
docker run -d --name gr-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=giraffyreach -p 5432:5432 postgres:16
# in .env: DATABASE_URL=postgres://postgres:postgres@localhost:5432/giraffyreach
npm start                    # http://localhost:8787
```

Set `DATABASE_URL`, `JWT_SECRET` (any long random string), and — for AI — `ANTHROPIC_API_KEY`. The schema is created automatically on boot.

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

**Render** — push this repo, then New → Blueprint (it reads `server/render.yaml`, which also provisions a free Postgres and injects `DATABASE_URL`). Set `ANTHROPIC_API_KEY` in the dashboard. For an existing web service, create a Postgres database and add its Internal `DATABASE_URL` as an env var on the service, then redeploy.

**Docker** — `docker build -t giraffyreach-api server && docker run -p 8787:8787 --env-file server/.env giraffyreach-api`

**Fly.io / Railway** — any Node host works; start command `node server.js`, root `server/`.

## Notes
- Storage is PostgreSQL via the pure-JS `pg` driver — no native compilation. The schema auto-creates on boot.
- CORS is open so the static GitHub Pages frontend can call the API. To lock it down, replace `cors()` with an allow-list of your Pages origin.
- Tracking pixels and cold outreach have deliverability/privacy implications — use responsibly and comply with applicable law.
