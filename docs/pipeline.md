# Study Pipeline

## Overview

A one-page web app that runs a perceptual discrimination study. Participants see images one at a time and judge whether colorization artifacts are present or absent. No login, no score reveal — pure signal detection data collection.

---

## Participant Flow

```
Welcome / Colorblindness Screen
  └─ 3 Ishihara plates (demo → red-green → blue-yellow)
  └─ Expertise dropdown (novice / hobbyist / professional / researcher)
        │
        ▼
Tutorial (3 steps)
  Step 1 — artifact reference: what artifacts look like (static explainer image)
  Step 2 — practice real: participant sees a ground-truth image, makes a judgment, gets feedback
  Step 3 — practice fake: participant sees a colorized image, makes a judgment, gets feedback
        │
        ▼
50 Trial Loop
  ├─ Image displayed (fixed-size container, objectFit: contain)
  ├─ Participant responds: ABSENT (←) or PRESENT (→)
  │     • Swipe right / → key / green button = PRESENT (artifacts detected)
  │     • Swipe left  / ← key / red button   = ABSENT  (no artifacts)
  ├─ Response + timing logged to backend (fire-and-forget)
  └─ Repeat until trial 50
        │
        ▼
Done Screen
  └─ Thank-you message + share link
```

---

## Image Sampling (per session)

- **10 ground-truth (real)** images sampled randomly from 15 available
- **8 colorized (fake)** images per method × 5 methods = 40
- Total: **50 trials**, shuffled
- Balance enforced: within each method, 1 image is drawn from each of the 6 (variant × dataset) groups (6 groups × 1 = 6; 2 extra drawn randomly from remaining pool)
- GT varies session-to-session; same 15 base scenes, different 10 selected each time

**Methods:** `bigcolor`, `ddcolor`, `disco`, `unicolor`, `mixed`  
**Variants:** `ortho`, `standard`  
**Datasets:** `coco`, `imagenet`, `instance`

---

## Response Encoding

| User action | Button | Color | `response` value stored | Meaning |
|---|---|---|---|---|
| Swipe right / → | PRESENT | Green | `fake` | Participant detected artifacts |
| Swipe left / ← | ABSENT | Red | `real` | Participant saw no artifacts |

`label` field encodes ground truth: `fake` (colorized) or `real` (ground-truth photo).  
`correct = 1` when `response == label`.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + MUI v5 dark theme |
| Backend | FastAPI + aiosqlite |
| Database | SQLite (local: `./responses.db`, Fly.io: `/app/data/responses.db`) |
| Deployment | Fly.io — single Docker container, persistent volume |
| Session state | `localStorage` (resume on reload, UUID per participant) |

---

## Key Files

```
colorization-webapp/
├── backend/
│   ├── main.py            — FastAPI app, static mounts
│   ├── db.py              — SQLite init, connection
│   └── routes/
│       ├── session.py     — /api/session/start, /respond, /complete + sampling logic
│       └── results.py     — /api/results/csv, /summary (key-protected)
├── frontend/src/
│   ├── pages/
│   │   ├── Welcome.jsx    — colorblindness plates + expertise
│   │   ├── Tutorial.jsx   — 3-step practice
│   │   ├── Trial.jsx      — main 50-trial loop
│   │   └── Done.jsx       — thank-you + share
│   └── components/
│       ├── SwipeCard.jsx  — touch/drag swipe handler
│       └── ProgressBar.jsx
├── image_samples/         — 165 images (served at /images/...)
├── tutorial/              — tutorial assets + Ishihara plates
├── manifest.json          — image metadata index
├── Dockerfile
└── fly.toml
```

---

## Admin Endpoints

Both require `?key=colorturingtest2025`.

| Endpoint | Description |
|---|---|
| `GET /api/results/csv?key=colorturingtest2025` | Download full response CSV |
| `GET /api/results/summary?key=colorturingtest2025` | JSON summary: per-method detection rates, overall accuracy |
