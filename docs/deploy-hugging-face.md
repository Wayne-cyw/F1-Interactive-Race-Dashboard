# Deploying the backend to Hugging Face Spaces (free)

The Flask/FastF1 API runs as a Docker Space; the React frontend is hosted separately
(Vercel in this guide) and proxies `/api/*` to the Space.

```
Browser → Vercel (static React app)
              └─ /api/*  →  https://<user>-<space>.hf.space/api/*  (Flask + gunicorn, 2025 cache baked in)
```

What's in the repo for this:

| File | Purpose |
|---|---|
| `deploy/hf-space/Dockerfile` | Python 3.11 image, installs deps, **pre-warms the 2025 season** at build time, starts gunicorn on port 7860 |
| `deploy/hf-space/README.md` | Space metadata (`sdk: docker`, `app_port: 7860`) — must be the Space repo's README |
| `deploy/hf-space/deploy.sh` | Stages `backend/` + the files above and pushes them to your Space |
| `backend/scripts/prewarm_cache.py` | Downloads every completed race of a season into the FastF1 cache |

Environment knobs: `FASTF1_CACHE_DIR` (cache location) and `SESSION_CACHE_SIZE`
(how many race sessions to keep in RAM; ~300 MB each — the image sets 8).

## 1. Create the Space

1. Sign up / log in at <https://huggingface.co>.
2. **New → Space**. Name it (e.g. `f1-apex-api`), **SDK: Docker → Blank**, hardware **CPU basic · 2 vCPU · 16 GB (free)**, visibility **Public** (the Vercel proxy can't send a token to a private Space).
3. Create a token: **Settings → Access Tokens → New token → Write**. Copy it.

## 2. Deploy

From the repo root:

```bash
HF_SPACE=<your-username>/f1-apex-api ./deploy/hf-space/deploy.sh
```

Git will prompt for credentials: username = your HF username, password = the **write token**.
(To avoid retyping: `git config --global credential.helper osxkeychain`.)

The push triggers a build. Open the Space's **Logs → Build** tab. Expect roughly 10–20 minutes:
the pre-warm step downloads 24 races (~2.4 GB of cache). Lines like `[7/24] round 7 cached in 13s` show progress.
If a round fails after retries the build still succeeds (`--allow-partial`); that race will load on demand at runtime (30–60 s the first time).

## 3. Verify the API

Your Space URL is `https://<username>-<space-name>.hf.space` (lowercase, underscores become dashes).

```bash
curl https://<username>-f1-apex-api.hf.space/api/seasons
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" https://<username>-f1-apex-api.hf.space/api/session/2025/9/R
```

The session call should return `200` in a few seconds, not 30–60 — that confirms the baked-in cache works.

## 4. Deploy the frontend on Vercel

1. Add `vercel.json` to the repo root (replace the hostname with your Space URL):

   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "rewrites": [
       { "source": "/api/:path*", "destination": "https://<username>-f1-apex-api.hf.space/api/:path*" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

   The first rule sends API calls to the Space (the frontend already calls the relative `/api`, so no code change).
   The second is the SPA fallback so `/race` works on refresh. Order matters.
2. Push to GitHub, then on <https://vercel.com> **Add New → Project**, import the repo, framework preset **Vite**. Deploy.
3. Open the Vercel URL, click *Enter the pit wall*, and pick a 2025 race.

## 5. Updating

- **Backend code change:** re-run `deploy.sh`. The Space rebuilds. Because the pre-warm step comes after `COPY backend/`, any backend change re-runs it, so expect the full build time.
- **Different/more seasons:** change `ARG PREWARM_YEAR=2025` in the Dockerfile (or add another `RUN python scripts/prewarm_cache.py --year 2024 --allow-partial`). Each season adds ~1–2 GB to the image.
- **Frontend change:** push to GitHub; Vercel redeploys.

## 6. Things to know

- **Sleeping:** free Spaces pause after a stretch of inactivity (currently around 48 h; check HF's docs). The first visitor after a pause waits for the container to restart (about a minute). The cache is in the image, so it isn't lost.
- **Memory:** ~300 MB per cached session; the 16 GB free tier is comfortable with `SESSION_CACHE_SIZE=8`. Lower it if you see out-of-memory restarts.
- **One worker on purpose:** the session cache lives in process memory, so one gunicorn worker + 8 threads shares it across requests.
- **Races outside 2025** are fetched live from F1 on first request (30–60 s) and are lost when the Space restarts.
- **Free-tier limits change.** Confirm the current hardware and sleep policy on HF's Spaces pricing/docs page before relying on them.

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Build log says `Failed rounds: [...]` | F1's API rate-limited or timed out. Redeploy to retry, or ignore — those races load on demand. |
| `502`/`503` from the Space URL | Still building or restarting; check Logs. Make sure the Dockerfile `CMD` binds `0.0.0.0:7860`. |
| Frontend shows `Couldn't load this race` | Open `/api/seasons` on the Vercel domain — if it 404s, the `vercel.json` rewrite isn't applied. |
| `/race` 404s on refresh | Missing the SPA fallback rewrite. |
| First load of a race is very slow | That race wasn't pre-warmed (not in 2025, or its round failed). |
| Space restarts under load | Out of memory; lower `SESSION_CACHE_SIZE`. |
