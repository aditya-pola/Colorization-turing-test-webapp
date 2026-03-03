---
title: Color Turing Test
emoji: 🎨
colorFrom: indigo
colorTo: green
sdk: docker
pinned: false
---

# Color Turing Test — Colorization Perception Study

A perceptual study examining how well AI colorization fools human observers. Participants see 50 images and judge whether colorization artifacts are present or absent. Takes ~5 minutes. Anonymous, no account required.

---

## Quick Start

**Requirements:** Python 3.11+, Node 20+

```bash
# 1. Install Python deps
pip install -r backend/requirements.txt

# 2. Build the frontend
cd frontend && npm install && npm run build && cd ..

# 3. Run the server
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 7788
```

Open **http://localhost:7788**

---

## Making it publicly accessible

Use a Cloudflare quick tunnel (no account needed):

```bash
# Download cloudflared (one-time)
curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /tmp/cloudflared
chmod +x /tmp/cloudflared

# Start tunnel
/tmp/cloudflared tunnel --url http://localhost:7788 --no-autoupdate &
```

This prints a public HTTPS URL (e.g. `https://something.trycloudflare.com`).  
Update `STUDY_URL` in `frontend/src/pages/Done.jsx`, rebuild (`cd frontend && npm run build`), then restart the server.

Or use `./restart.sh` which does all of the above automatically.

For a **permanent URL** that survives restarts, see `docs/cloudflare-named-tunnel.md`.

---

## Getting results

While the server is running:

| What | URL |
|---|---|
| Long CSV (one row per trial) | `/api/results/csv?key=colorturingtest2025` |
| Wide CSV (one row per participant) | `/api/results/wide?key=colorturingtest2025` |
| Summary JSON | `/api/results/summary?key=colorturingtest2025` |

See `docs/getting-results.md` for Google Sheets import and local DB access.

---

## Repo structure

```
backend/          FastAPI app + SQLite
frontend/         React 18 + Vite + MUI (build output not committed — run npm build)
image_samples/    Original images (reference)
image_samples_opt/ Optimised JPEG images served at /images/...
manifest_opt.json Image metadata used by the backend
tutorial/         Tutorial assets + Ishihara colorblindness plates
restart.sh        One-command restart (uvicorn + cloudflared)
docs/             Pipeline, data storage, analyses, tunnel setup, getting results
```

---

## Study design

- **50 trials** per session: 10 ground-truth (real) + 8 per colorization method × 5 methods
- **Methods:** bigcolor, ddcolor, disco, unicolor, mixed
- **Task:** ABSENT (←) = no artifacts / PRESENT (→) = artifacts detected
- **Base rate:** 20% real / 80% fake — account for this in d-prime analysis
- Anonymous sessions via `localStorage` UUID; optional email collected at start
