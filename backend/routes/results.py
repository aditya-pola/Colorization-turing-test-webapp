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
                s.expertise,
                s.colorblind,
                s.device,
                s.cb_redgreen,
                s.cb_blueyellow,
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
        "id", "session_id", "expertise", "colorblind", "device",
        "cb_redgreen", "cb_blueyellow",
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
