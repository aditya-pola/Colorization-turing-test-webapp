from __future__ import annotations

import csv
import io
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from ..db import get_db

router = APIRouter(prefix="/api/results", tags=["results"])

API_KEY = "colorturingtest2025"


def check_key(key: Optional[str]):
    if key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")


@router.get("/csv")
async def download_csv(key: str = Query(None)):
    check_key(key)

    db = await get_db()
    try:
        cursor = await db.execute("""
            SELECT
                r.id,
                r.session_id,
                s.email,
                s.expertise,
                s.colorblind,
                s.device,
                s.cb_redgreen,
                s.cb_blueyellow,
                s.feedback,
                r.trial_index,
                r.image_id,
                r.image_path,
                r.method,
                r.variant,
                r.dataset,
                r.base_id,
                r.label,
                r.response,
                r.correct,
                r.response_time_ms,
                r.created_at
            FROM responses r
            JOIN sessions s ON r.session_id = s.session_id
            ORDER BY r.created_at
        """)
        rows = await cursor.fetchall()
    finally:
        await db.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "session_id", "email", "expertise", "colorblind", "device",
        "cb_redgreen", "cb_blueyellow", "feedback",
        "trial_index", "image_id", "image_path", "method", "variant",
        "dataset", "base_id", "label", "response", "correct",
        "response_time_ms", "created_at"
    ])
    for row in rows:
        writer.writerow(list(row))

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=colorization_results.csv"},
    )


@router.get("/wide")
async def download_wide_csv(key: str = Query(None)):
    """One row per participant. Columns: session metadata + t01_image … t50_response for each trial."""
    check_key(key)

    db = await get_db()
    try:
        # Fetch all sessions
        sess_cur = await db.execute("""
            SELECT session_id, email, expertise, colorblind, device,
                   cb_redgreen, cb_blueyellow, completed, created_at
            FROM sessions ORDER BY created_at
        """)
        sessions = [dict(r) for r in await sess_cur.fetchall()]

        # Fetch all responses grouped by session
        resp_cur = await db.execute("""
            SELECT session_id, trial_index, image_id, method, variant,
                   dataset, label, response, correct, response_time_ms
            FROM responses ORDER BY session_id, trial_index
        """)
        from collections import defaultdict
        responses_by_session = defaultdict(dict)
        for r in await resp_cur.fetchall():
            responses_by_session[r["session_id"]][r["trial_index"]] = dict(r)
    finally:
        await db.close()

    # Find max trials across all sessions (should be 50)
    max_trials = max(
        (max(rs.keys()) + 1 for rs in responses_by_session.values() if rs),
        default=50
    )
    max_trials = max(max_trials, 50)

    # Build header
    meta_cols = ["session_id", "email", "expertise", "colorblind", "device",
                 "cb_redgreen", "cb_blueyellow", "completed", "started_at"]
    trial_cols = []
    for i in range(max_trials):
        n = f"{i+1:02d}"
        trial_cols += [
            f"t{n}_image", f"t{n}_method", f"t{n}_label",
            f"t{n}_response", f"t{n}_correct", f"t{n}_rt_ms"
        ]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(meta_cols + trial_cols)

    for s in sessions:
        row = [
            s["session_id"], s["email"], s["expertise"], s["colorblind"],
            s["device"], s["cb_redgreen"], s["cb_blueyellow"],
            s["completed"], s["created_at"],
        ]
        rs = responses_by_session.get(s["session_id"], {})
        for i in range(max_trials):
            r = rs.get(i, {})
            row += [
                r.get("image_id", ""),
                r.get("method", ""),
                r.get("label", ""),
                r.get("response", ""),
                r.get("correct", ""),
                r.get("response_time_ms", ""),
            ]
        writer.writerow(row)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=colorization_wide.csv"},
    )


@router.get("/summary")
async def summary(key: str = Query(None)):
    check_key(key)

    db = await get_db()
    try:
        # Per-method detection rates
        cursor = await db.execute("""
            SELECT
                method,
                COUNT(*) as total_shown,
                SUM(CASE WHEN label = 'fake' AND response = 'fake' THEN 1 ELSE 0 END) as correctly_identified_fake,
                ROUND(
                    CAST(SUM(CASE WHEN label = 'fake' AND response = 'fake' THEN 1 ELSE 0 END) AS FLOAT)
                    / NULLIF(SUM(CASE WHEN label = 'fake' THEN 1 ELSE 0 END), 0)
                    * 100, 2
                ) as detection_rate
            FROM responses
            GROUP BY method
            ORDER BY method
        """)
        method_stats = [dict(row) for row in await cursor.fetchall()]

        # Overall stats
        cursor = await db.execute("SELECT COUNT(*) as total FROM responses")
        total_responses = (await cursor.fetchone())["total"]

        cursor = await db.execute(
            "SELECT COUNT(*) as total FROM sessions WHERE completed = 1"
        )
        sessions_completed = (await cursor.fetchone())["total"]

        # Overall accuracy
        cursor = await db.execute(
            "SELECT ROUND(AVG(correct) * 100, 2) as accuracy FROM responses"
        )
        overall_accuracy = (await cursor.fetchone())["accuracy"]
    finally:
        await db.close()

    return {
        "total_responses": total_responses,
        "sessions_completed": sessions_completed,
        "overall_accuracy": overall_accuracy,
        "per_method": method_stats,
    }
