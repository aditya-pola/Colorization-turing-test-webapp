# Study Pipeline

## Overview

A one-page web app that runs a perceptual discrimination study. Participants see images one at a time and judge whether colorization artifacts are present or absent. No login, no score reveal — pure signal detection data collection.

---

## Participant Flow

```
Welcome / Colorblindness Screen
  └─ 3 Ishihara plates (demo → red-green → blue-yellow)
  └─ Expertise dropdown (General public / Photographer / Researcher / CV-ML expert)
  └─ Optional email field
        │
        ▼
Tutorial (3 steps)
  Step 1 — artifact reference: what artifacts look like (static explainer image)
  Step 2 — practice real: participant sees a ground-truth image, makes a judgment, gets feedback
  Step 3 — practice fake: participant sees a colorized image, makes a judgment, gets feedback
        │
        ▼
50 Trial Loop
  ├─ Image displayed in fixed-size container (standardised across all images)
  ├─ Participant responds:
  │     • Swipe left  / ← key / red button (ABSENT)   = no artifacts detected → response: "real"
  │     • Swipe right / → key / green button (PRESENT) = artifacts detected    → response: "fake"
  ├─ Response + timing logged to backend (fire-and-forget)
  └─ Repeat until trial 50
        │
        ▼
Done Screen
  └─ Thank-you message + copy/share link
```

---

## Image Sampling (per session)

- **10 ground-truth (real)** images sampled randomly from 15 available (varies session-to-session)
- **8 colorized (fake)** images per method × 5 methods = 40
- Total: **50 trials**, shuffled
- Balance enforced per method: 1 image drawn from each of 6 (variant × dataset) groups (6 × 1 = 6; 2 extra drawn randomly from remaining pool)

**Methods:** `bigcolor`, `ddcolor`, `disco`, `unicolor`, `mixed`  
**Variants:** `ortho`, `standard`  
**Datasets:** `coco`, `imagenet`, `instance`

**Base rate: 20% real / 80% fake** — account for this in d-prime / signal detection analysis.

---

## Response Encoding

| User action | Button | Color | `response` stored | Meaning |
|---|---|---|---|---|
| Swipe right / → | PRESENT | Green | `fake` | Participant detected artifacts |
| Swipe left / ← | ABSENT | Red | `real` | Participant saw no artifacts |

`label` = ground truth: `fake` (colorized) or `real` (gt photo).  
`correct = 1` when `response == label`.

---

## Images

**Served from:** `image_samples_opt/` (JPEG 88% quality, optimised from originals)  
**Original source:** `image_samples/` (kept for reference)  
**Manifest:** `manifest_opt.json` (paths point to `image_samples_opt/`)

All images pre-converted from PNG/JPEG to optimised JPEG at 88% quality.  
21 MB originals → 7.2 MB optimised (65% reduction). Served at `/images/...`.

**Preloading strategy:** On trial mount, next 5 images load immediately; remaining images load staggered (150ms apart) in the background.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + MUI v5 dark theme |
| Backend | FastAPI + aiosqlite |
| Database | SQLite (`./responses.db`) |
| Tunnel | Cloudflare `trycloudflare.com` (temporary) or named tunnel (permanent) |
| Session state | `localStorage` (resume on reload, UUID per participant) |

---

## Key Files

```
colorization-webapp/
├── backend/
│   ├── main.py            — FastAPI app, static mounts (image_samples_opt/)
│   ├── db.py              — SQLite init, connection, auto-migration
│   └── routes/
│       ├── session.py     — /api/session/start, /respond, /complete + sampling logic
│       └── results.py     — /api/results/csv, /wide, /summary (key-protected)
├── frontend/src/
│   ├── pages/
│   │   ├── Welcome.jsx    — colorblindness plates + expertise + email
│   │   ├── Tutorial.jsx   — 3-step practice
│   │   ├── Trial.jsx      — main 50-trial loop + aggressive preloading
│   │   └── Done.jsx       — thank-you + copy/share link
│   └── components/
│       ├── SwipeCard.jsx  — touch/drag swipe handler + overlays
│       └── ProgressBar.jsx
├── image_samples/         — original images (reference only)
├── image_samples_opt/     — optimised JPEG images (served at /images/...)
├── tutorial/              — tutorial assets + Ishihara plates
├── manifest.json          — original image metadata
├── manifest_opt.json      — optimised image metadata (used by backend)
├── restart.sh             — one-command restart (uvicorn + cloudflared)
├── Dockerfile             — multi-stage build (Node → Python)
├── README.md              — HF Spaces YAML header
└── docs/
    ├── pipeline.md        — this file
    ├── data-storage.md    — schema + CSV format
    ├── analyses.md        — statistical analysis guide
    └── cloudflare-named-tunnel.md — permanent URL setup
```

---

## Admin Endpoints

All require `?key=colorturingtest2025`.

| Endpoint | Format | Description |
|---|---|---|
| `GET /api/results/csv` | Long (N×50 rows) | One row per trial response — best for analysis |
| `GET /api/results/wide` | Wide (N rows) | One row per participant, 50 image/response columns |
| `GET /api/results/summary` | JSON | Per-method detection rates, overall accuracy |

---

## Running Locally

```bash
# Start everything (uvicorn + cloudflared tunnel)
./restart.sh

# Or manually:
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 7788
/tmp/cloudflared tunnel --url http://localhost:7788 --no-autoupdate &
```

See `docs/cloudflare-named-tunnel.md` for a permanent URL setup.
