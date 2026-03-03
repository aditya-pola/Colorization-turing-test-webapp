# Data Storage Format

## Database

SQLite file at `./responses.db` (next to `backend/`).  
Auto-created on first run. Auto-migrated if schema changes (e.g. new columns added).

---

## Table: `sessions`

One row per participant session.

| Column | Type | Description |
|---|---|---|
| `session_id` | TEXT PK | UUID generated server-side at session start |
| `email` | TEXT | Optional contact email (blank if not provided) |
| `expertise` | TEXT | Self-reported: `General public`, `Photographer / Artist`, `Researcher / Academic`, `Computer Vision / ML expert` |
| `colorblind` | INTEGER | 1 if Ishihara plates suggest deficiency, else 0 |
| `device` | TEXT | `desktop`, `mobile`, or `tablet` (user-agent detection) |
| `cb_redgreen` | TEXT | Ishihara plate 2 result: `normal`, `deficient`, or `unsure` |
| `cb_blueyellow` | TEXT | Ishihara plate 3 result: `normal`, `deficient`, or `unsure` |
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
| `image_id` | TEXT | Unique image identifier from manifest |
| `image_path` | TEXT | Relative path served at `/images/<path>` |
| `method` | TEXT | Colorization method: `gt`, `bigcolor`, `ddcolor`, `disco`, `unicolor`, `mixed` |
| `variant` | TEXT | `ortho` or `standard` (empty for `gt`) |
| `dataset` | TEXT | `coco`, `imagenet`, or `instance` |
| `base_id` | TEXT | Base scene identifier (shared across methods for same scene) |
| `label` | TEXT | Ground truth: `real` (gt image) or `fake` (colorized) |
| `response` | TEXT | Participant response: `real` (ABSENT) or `fake` (PRESENT) |
| `correct` | INTEGER | 1 if `response == label`, else 0 |
| `response_time_ms` | INTEGER | Milliseconds from image display (`onLoad`) to button press |
| `created_at` | DATETIME | UTC timestamp |

---

## CSV Endpoints

Both require `?key=colorturingtest2025`.

### Long format — one row per trial response
```
GET /api/results/csv?key=colorturingtest2025
```
**N participants × 50 trials = N×50 rows.** Best for statistical analysis, pivot tables, filtering by method.

Column order:
```
id, session_id, email, expertise, colorblind, device,
cb_redgreen, cb_blueyellow,
trial_index, image_id, image_path, method, variant,
dataset, base_id, label, response, correct,
response_time_ms, created_at
```

### Wide format — one row per participant
```
GET /api/results/wide?key=colorturingtest2025
```
**N rows.** Good for eyeballing individual participant data.

Column order:
```
session_id, email, expertise, colorblind, device,
cb_redgreen, cb_blueyellow, completed, started_at,
t01_image, t01_method, t01_label, t01_response, t01_correct, t01_rt_ms,
t02_image, t02_method, t02_label, t02_response, t02_correct, t02_rt_ms,
... (repeated through t50_*)
```

### Summary JSON
```
GET /api/results/summary?key=colorturingtest2025
```
Returns per-method detection rates + overall accuracy + session count.

---

## Importing to Google Sheets

**Manual (one-time):**
1. Open the CSV URL in a browser → file downloads
2. Google Sheets → **File → Import → Upload** → select file

**Live-refresh via Apps Script:**
```javascript
// Extensions → Apps Script
function importResults() {
  const url = 'https://<your-tunnel-url>/api/results/csv?key=colorturingtest2025';
  const data = Utilities.parseCsv(UrlFetchApp.fetch(url).getContentText());
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Raw') || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Raw');
  sheet.clearContents();
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
}
```
Set a time-based trigger (e.g. every hour) to keep it updated.

---

## Base Rate

Every session: **20% real (10 gt) / 80% fake (40 colorized, 8 per method)**.  
Account for this when computing d-prime and criterion.

---

## Notes

- Sessions where `completed = 0` are partial — participant dropped out. Include/exclude based on analysis goals.
- `response_time_ms` starts on image `onLoad`, not trial start — excludes network transfer time.
- The `trials` JSON column in `sessions` preserves the exact randomised sequence seen by each participant.
- Email is optional — many rows will have an empty string.
