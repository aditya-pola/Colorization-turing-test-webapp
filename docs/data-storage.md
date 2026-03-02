# Data Storage Format

## Database

SQLite file at:
- **Local dev:** `./responses.db` (next to `backend/`)
- **Fly.io:** `/app/data/responses.db` (on persistent volume)

Two tables: `sessions` and `responses`.

---

## Table: `sessions`

One row per participant session.

| Column | Type | Description |
|---|---|---|
| `session_id` | TEXT PK | UUID generated server-side at session start |
| `expertise` | TEXT | Self-reported: `novice`, `hobbyist`, `professional`, `researcher` |
| `colorblind` | INTEGER | 1 if participant self-reported colorblindness, else 0 |
| `device` | TEXT | User-agent string (desktop/mobile detection) |
| `cb_redgreen` | TEXT | Ishihara plate result: `normal`, `deficient`, or `unsure` |
| `cb_blueyellow` | TEXT | Ishihara plate result: `normal`, `deficient`, or `unsure` |
| `trials` | TEXT | JSON array of the 50 sampled trial objects (full manifest entries) |
| `completed` | INTEGER | 1 if participant reached Done screen, else 0 |
| `created_at` | DATETIME | UTC timestamp of session creation |

---

## Table: `responses`

One row per trial judgment.

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `session_id` | TEXT FK | References `sessions.session_id` |
| `trial_index` | INTEGER | 0-indexed position in this participant's trial sequence |
| `image_id` | TEXT | Unique image identifier from `manifest.json` |
| `image_path` | TEXT | Relative path served at `/images/<path>` |
| `method` | TEXT | Colorization method: `gt`, `bigcolor`, `ddcolor`, `disco`, `unicolor`, `mixed` |
| `variant` | TEXT | `ortho` or `standard` (empty for `gt`) |
| `dataset` | TEXT | `coco`, `imagenet`, or `instance` |
| `base_id` | TEXT | Base scene identifier (shared across methods for same scene) |
| `label` | TEXT | Ground truth: `real` (gt image) or `fake` (colorized) |
| `response` | TEXT | Participant response: `real` (ABSENT pressed) or `fake` (PRESENT pressed) |
| `correct` | INTEGER | 1 if `response == label`, else 0 |
| `response_time_ms` | INTEGER | Milliseconds from image display to button press |
| `created_at` | DATETIME | UTC timestamp |

---

## CSV Export

Download the full dataset:

```
GET https://<your-fly-app>.fly.dev/api/results/csv?key=colorturingtest2025
```

The CSV has one row per response with all columns from the join of `responses` + `sessions`.

### Column order in CSV

```
id, session_id, expertise, colorblind, device,
cb_redgreen, cb_blueyellow,
trial_index, image_id, image_path, method, variant,
dataset, base_id, label, response, correct,
response_time_ms, created_at
```

---

## Importing to Google Sheets

1. Download the CSV from the endpoint above (or open the URL directly in browser — it will download)
2. In Google Sheets: **File → Import → Upload** → select the CSV → "Replace spreadsheet"
3. For live/refreshable data, use **Apps Script**:

```javascript
// In Google Sheets → Extensions → Apps Script
function importResults() {
  const url = 'https://<your-fly-app>.fly.dev/api/results/csv?key=colorturingtest2025';
  const response = UrlFetchApp.fetch(url);
  const csv = response.getContentText();
  const data = Utilities.parseCsv(csv);
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Raw') 
    || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Raw');
  sheet.clearContents();
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
}
```

Run `importResults()` manually or set a time-based trigger (e.g., every hour) to keep the sheet updated.

---

## Base Rate

Every session has a fixed real/fake split:
- **20% real** (10 gt images)
- **80% fake** (40 colorized images, 8 per method)

Factor this into any sensitivity analysis (d-prime, criterion).

---

## Notes

- Sessions where `completed = 0` are partial — participant dropped out mid-task. Include/exclude based on analysis goals.
- `response_time_ms` starts when image finishes loading (`onLoad` event), not when the trial begins.
- `trials` JSON in the sessions table preserves the exact sequence seen by each participant — useful for re-checking specific images post-hoc.
