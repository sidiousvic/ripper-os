# Ripper OS

Ripper OS is a static React dashboard that turns workout history into progress, consistency, muscle-balance, and next-step views.

The site is intentionally data-light. It publishes the calculated training summary, not raw account or nutrition data. The included dataset is generated from an all-time MacroFactor training export.

## Requirements

- Node.js 22.13 or newer
- An all-time MacroFactor `.xlsx` or workout `.csv` export
- An OpenAI API key is optional and only required for generated recommendations

Install dependencies with:

```bash
npm install
```

## MacroFactor workbook format

Export an **all-time** MacroFactor training workbook. Each refresh treats the MacroFactor workbook as a replacement, not an append, so always provide the complete export.

The workbook must contain these sheets. Sheet names are case-sensitive. The app also accepts MacroFactor's row-oriented workout CSV export, with columns such as `Date`, `Exercise`, `Weight (kg)`, `Reps`, and `Workout Duration`.

| Sheet | Layout |
| --- | --- |
| `Exercises - Total Sets` | First column: date. Remaining columns: exercise names and set totals. |
| `Exercises - Total Reps` | First column: date. Remaining columns: exercise names and rep totals. |
| `Exercises - Best Set Reps` | First column: date. Remaining columns: exercise names and best-set rep totals. |
| `Exercises - Heaviest Weight` | First column: date. Remaining columns: exercise names and heaviest recorded load. |
| `Exercises - Total Volume` | First column: date. Remaining columns: exercise names and total volume. |
| `Exercises - 1-RM` | First column: date. Remaining columns: exercise names and exported estimated 1RM. |
| `Exercises - Total Duration` | First column: date. Remaining columns: exercise names and duration in seconds. |
| `Muscle Groups - Sets` | First column: date. Remaining columns: muscle groups and set-equivalent exposure. |

The first row of every sheet is treated as the header row. Dates may be Excel serial dates or parseable date strings such as `2026-09-02` or `2026/09/02`. Exercise and metric headers may include unit suffixes such as `(kg)`, `(sets)`, `(reps)`, or `(sec)`; those suffixes are removed automatically.

Example shape:

```text
Exercises - Total Sets
Date        Dumbbell Fly (sets)   Back Squat (sets)
2026-08-01  3                     4
2026-08-04  3                     0
```

Nutrition, food, account, email, settings, and unrelated workbook tabs are ignored and never copied into the public dataset.

## Use your own export in the app

The deployed app and local development server include an **Upload MacroFactor export** button. The workbook is parsed by the app's `/api/parse` endpoint and the resulting summary replaces the demo data for the current session. The original workbook is written to a temporary server file only while it is parsed, then deleted.
The normalized result is retained in `sessionStorage` so a refresh in the same browser session keeps the analysis. Use **Clear uploaded data** to remove it.

The graphs do not require an OpenAI account. After uploading, choose **Generate recommendations** to run the optional AI interpretation. Configure the server with `OPENAI_API_KEY`; never put that key in frontend code or browser storage. You can select a model with `OPENAI_MODEL` (the default is `gpt-5-mini`). The recommendation request contains calculated training summaries, not the raw workbook.

MacroFactor CSV exports contain workout and exercise metrics but generally do not include the muscle-group sheet. Muscle-balance views are omitted when that data is unavailable.

The upload and recommendation endpoints currently require a Node-compatible server runtime. A static-only host can serve the bundled demo dashboard, but it cannot process new workbooks or call OpenAI until its provider's serverless adapter is configured.

## Refresh the checked-in dataset

From the project directory, pass the newest all-time MacroFactor export and the output JSON path:

```bash
npm run refresh:data -- \
  "/path/to/latest-MacroFactor-export.xlsx" \
  "app/training-data.json"
```

Then validate the site:

```bash
npm run lint
npm run build
```

The refresh script normalizes exercise aliases, merges daily metrics, calculates summaries and rankings, and writes the static file consumed by the dashboard. It does not modify the source workbook.

For a public deployment, keep the checked-in dataset anonymized demo data. Users should upload their own export through the app instead of committing personal training history.

## Development

```bash
npm run dev
```

Open the local URL printed by Vinext. The dashboard has no login, database, upload endpoint, or server-side data store; publishing is a static Site deployment.

## Privacy and publishing

Review `app/training-data.json` before publishing. Do not commit raw workbooks, nutrition records, account information, email addresses, or other identifying data. The generated public dataset is intended to contain only aggregated training information.

## Project layout

- `app/page.tsx` — dashboard UI and interactions
- `app/globals.css` — visual system and responsive layout
- `app/training-data.json` — generated public dataset
- `scripts/refresh-training-data.mjs` — workbook parser and metrics generator
- `public/brand/` — local visual assets and fonts
