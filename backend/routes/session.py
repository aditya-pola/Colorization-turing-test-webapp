from __future__ import annotations

import json
import random
import uuid
from collections import defaultdict
from pathlib import Path
from typing import List, Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..db import get_db

router = APIRouter(prefix="/api/session", tags=["session"])

# Load manifest once at module level
MANIFEST_PATH = Path(__file__).resolve().parent.parent.parent / "manifest.json"
with open(MANIFEST_PATH) as f:
    MANIFEST = json.load(f)


class StartRequest(BaseModel):
    expertise: str
    colorblind: int  # 0 or 1
    device: str
    cb_redgreen: str = ""   # "normal" | "deficient" | "unsure"
    cb_blueyellow: str = "" # "normal" | "deficient" | "unsure"


class RespondRequest(BaseModel):
    session_id: str
    trial_index: int
    image_id: str
    label: str
    response: str
    response_time_ms: int


class CompleteRequest(BaseModel):
    session_id: str


def sample_trials() -> list[dict]:
    """
    Sample 50 images: 10 gt images (randomly sampled from 15) + 40 colorized (8 per method),
    balanced across variants (ortho/standard) and datasets.

    GT is capped at 10 to avoid consistent overexposure of the same real images across sessions.
    8 per method (instead of 7) keeps the total at 50 and maintains a ~20/80 real/fake split —
    document the base rate in analysis.
    """
    all_gt = [e for e in MANIFEST if e["method"] == "gt"]
    gt_images = random.sample(all_gt, min(10, len(all_gt)))

    colorized_methods = ["bigcolor", "ddcolor", "disco", "unicolor", "mixed"]
    sampled_colorized = []

    for method in colorized_methods:
        method_images = [e for e in MANIFEST if e["method"] == method]

        # Group by (variant, dataset) for balanced sampling
        groups = defaultdict(list)
        for img in method_images:
            groups[(img["variant"], img["dataset"])].append(img)

        # We need 8 per method. There are 6 groups (2 variants x 3 datasets).
        # Each group has ~5 images. Pick 1 from each group (6), then 2 more random.
        selected = []
        remaining = []

        group_keys = sorted(groups.keys())
        for key in group_keys:
            pool = groups[key][:]
            random.shuffle(pool)
            if pool:
                selected.append(pool[0])
                remaining.extend(pool[1:])

        # Fill up to 8
        random.shuffle(remaining)
        needed = 8 - len(selected)
        selected.extend(remaining[:needed])

        sampled_colorized.extend(selected)

    trials = gt_images + sampled_colorized
    random.shuffle(trials)
    return trials


@router.post("/start")
async def start_session(req: StartRequest):
    session_id = str(uuid.uuid4())
    trials = sample_trials()

    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO sessions (session_id, expertise, colorblind, device, cb_redgreen, cb_blueyellow, trials) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (session_id, req.expertise, req.colorblind, req.device, req.cb_redgreen, req.cb_blueyellow, json.dumps(trials)),
        )
        await db.commit()
    finally:
        await db.close()

    return {"session_id": session_id, "trials": trials}


@router.post("/respond")
async def respond(req: RespondRequest):
    db = await get_db()
    try:
        # Look up the image details from the session trials
        row = await db.execute(
            "SELECT trials FROM sessions WHERE session_id = ?", (req.session_id,)
        )
        session = await row.fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        trials = json.loads(session["trials"])
        if req.trial_index < 0 or req.trial_index >= len(trials):
            raise HTTPException(status_code=400, detail="Invalid trial index")

        trial = trials[req.trial_index]
        correct = 1 if req.response == req.label else 0

        await db.execute(
            """INSERT INTO responses
               (session_id, trial_index, image_id, image_path, method, variant, dataset, base_id, label, response, correct, response_time_ms)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                req.session_id,
                req.trial_index,
                trial["id"],
                trial["path"],
                trial["method"],
                trial.get("variant", ""),
                trial.get("dataset", ""),
                trial.get("base_id", ""),
                req.label,
                req.response,
                correct,
                req.response_time_ms,
            ),
        )
        await db.commit()
    finally:
        await db.close()

    return {"correct": bool(correct)}


@router.post("/complete")
async def complete_session(req: CompleteRequest):
    db = await get_db()
    try:
        await db.execute(
            "UPDATE sessions SET completed = 1 WHERE session_id = ?",
            (req.session_id,),
        )
        await db.commit()
    finally:
        await db.close()

    return {"status": "completed"}
