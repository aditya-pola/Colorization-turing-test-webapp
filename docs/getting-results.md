# Getting Results

All endpoints require the API key: `colorturingtest2025`

Replace `<URL>` with your current tunnel URL (e.g. `https://breakfast-garbage-leaf-wisdom.trycloudflare.com`).

---

## Endpoints

### Long format — one row per trial
```
<URL>/api/results/csv?key=colorturingtest2025
```
- N participants × 50 trials = N×50 rows
- Best for statistical analysis, groupby, pivot tables
- Columns: `id, session_id, email, expertise, colorblind, device, cb_redgreen, cb_blueyellow, trial_index, image_id, image_path, method, variant, dataset, base_id, label, response, correct, response_time_ms, created_at`

### Wide format — one row per participant
```
<URL>/api/results/wide?key=colorturingtest2025
```
- One row per session
- Columns: `session_id, email, expertise, colorblind, device, cb_redgreen, cb_blueyellow, completed, started_at` then `t01_image, t01_method, t01_label, t01_response, t01_correct, t01_rt_ms` … through `t50_*`
- Good for quickly checking individual participant data

### Summary JSON
```
<URL>/api/results/summary?key=colorturingtest2025
```
Returns overall accuracy, completed session count, and per-method detection rates.

---

## Downloading

**Browser:** open the URL → file downloads automatically as `.csv`

**curl:**
```bash
curl "<URL>/api/results/csv?key=colorturingtest2025" -o results.csv
curl "<URL>/api/results/wide?key=colorturingtest2025" -o results_wide.csv
```

**Python:**
```python
import pandas as pd
df = pd.read_csv('<URL>/api/results/csv?key=colorturingtest2025')
```

---

## Google Sheets — manual import

1. Download the CSV (open URL in browser)
2. Google Sheets → **File → Import → Upload** → select the file
3. Choose "Replace spreadsheet" or "Insert new sheet"

## Google Sheets — live refresh via Apps Script

1. In your Google Sheet: **Extensions → Apps Script**
2. Paste the following:

```javascript
const API_URL = '<URL>/api/results/csv?key=colorturingtest2025';

function importResults() {
  const data = Utilities.parseCsv(UrlFetchApp.fetch(API_URL).getContentText());
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Raw') 
    || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Raw');
  sheet.clearContents();
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  SpreadsheetApp.getActiveSpreadsheet().toast('Updated: ' + new Date());
}
```

3. Run `importResults()` once manually to grant permissions
4. Set a time-based trigger: **Triggers → Add Trigger → importResults → Time-driven → Every hour**

The sheet will refresh automatically while data collection is ongoing.

---

## Local access (if tunnel is down)

The SQLite database is at:
```
~/.openclaw/workspace/colorization-webapp/responses.db
```

Query directly:
```bash
sqlite3 responses.db "SELECT * FROM responses LIMIT 5;"
```

Or export to CSV:
```bash
sqlite3 -header -csv responses.db \
  "SELECT r.*, s.email, s.expertise FROM responses r JOIN sessions s USING(session_id);" \
  > results.csv
```

---

## Notes

- Both CSV endpoints query the live database on every request — always current
- Partial sessions (`completed = 0`) are included; filter them out with `WHERE completed = 1` or in pandas with `df[df['session_id'].isin(complete_ids)]`
- If the tunnel URL changes after a restart, update `<URL>` in your Apps Script and in `frontend/src/pages/Done.jsx`, then rebuild: `cd frontend && npm run build`
