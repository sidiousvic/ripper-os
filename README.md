# Ripper OS

Ripper OS turns a MacroFactor Workouts export into a readable picture of how you train: progress, consistency, gaps, muscle exposure, exercise history, and optional AI-written observations. It is an early beta and does not provide medical advice.

## Requirements

- Node.js 22.13 or newer
- A MacroFactor `.xlsx` workbook export or workout `.csv` export
- An OpenAI API key is optional; charts work without one

```bash
npm install
npm run dev
```

Open the local URL printed by Vinext.

## Importing MacroFactor data

Export your all-time training history from MacroFactor and upload the `.xlsx` or `.csv` file in the dashboard. Each new upload replaces the previous analysis; it is not appended.

In MacroFactor, use **More → Data Management → Data Export**. Granular Export with workout or exercise data gives the most detail. Quick Export also works when MacroFactor Workouts data is included.

### XLSX workbook

Ripper OS reads the standard MacroFactor workout sheets when they are present. The first column is a date and the remaining columns are exercise or muscle names with numeric values. The supported sheets are:

| Sheet | Values |
| --- | --- |
| `Exercises - Total Sets` | Working sets |
| `Exercises - Total Reps` | Total repetitions |
| `Exercises - Best Set Reps` | Best-set repetitions |
| `Exercises - Heaviest Weight` | Heaviest recorded load |
| `Exercises - Total Volume` | Session volume |
| `Exercises - 1-RM` | Exported estimated 1RM |
| `Exercises - Total Duration` | Duration in seconds |
| `Muscle Groups - Sets` | Muscle-group set-equivalents |

The workbook may include other MacroFactor tabs; unrelated nutrition, account, and settings data is ignored. Missing muscle-group data means the muscle balance and exposure heatmap are omitted. Exercise metric sheets are merged by date and exercise, so a workbook does not need every optional metric sheet.

### Workout CSV

The core row-oriented schema is:

| Column | Required | Meaning |
| --- | --- | --- |
| `Date` | Yes | Workout date |
| `Exercise` | Yes | Exercise name |
| `Weight (kg)` | Recommended | Load used for load and volume |
| `Reps` | Recommended | Repetitions for the row/set |
| `Workout Duration` or `Duration` | Optional | Duration when available |

Extra columns such as `Workout ID`, `Workout`, `Set Type`, `Notes`, and `Distance` are allowed. Keep MacroFactor's original headers. FIT and additional file types are planned for a future release.

The upload limit is 25 MB. XLSX archives are also checked for excessive expansion and oversized sheets before parsing.

## What the dashboard does

- **Progress:** Search and sort your exercise library. The default metric is load for weighted work, reps for bodyweight work, and duration for cardio when available.
- **Exercise charts:** View one continuous history line. The line fades toward yellow over the latest four weeks. Use **Compare with** to overlay another available metric on its own scale, such as load and session reps.
- **Consistency:** See monthly sessions, attendance, gaps, and training-load intensity.
- **Muscles:** Compare early and recent weekly set-equivalents when muscle-group data exists.
- **Muscle exposure:** See weekly muscle exposure as a heatmap when the export contains that data. Short exports use an adaptive heading; exports with no muscle rows hide the empty section.
- **Insights:** Optionally send the calculated summary to OpenAI for plain-language observations and programming prompts.

## Privacy and OpenAI keys

The original workbook is processed transiently and is not retained by Ripper OS. A normalized rendered snapshot, filename, upload time, and generated insights may be kept in this browser's `localStorage` (up to roughly 4 MB) so a refresh can restore the last export. Use **Clear uploaded data** to remove it.

OpenAI is bring-your-own-key. Ripper OS does not use a shared public API key. The key is held in memory for the current browser session, is not saved in browser storage, and is sent to the server only for the connection check or the recommendation request. OpenAI API billing is separate from a ChatGPT subscription. Revoke a key immediately if it is exposed.

## Rate limits

Ripper OS applies lightweight per-network safety limits: uploads are limited to 8 per minute, connection checks to 6 per minute, and recommendation requests to 6 per minute. Recommendations also have a per-network/per-key limit of 5 requests per 10 minutes. These limits are in-memory safeguards and reset when the server instance is recycled.

OpenAI applies separate project, quota, billing, and provider-throttling limits. A first request can fail when a key has no available quota or when several people share a network. Ripper OS does not add a country block, although OpenAI availability and network conditions can vary by region.

## Security notes

The API routes require same-origin browser requests, enforce request-size limits, reject oversized or suspicious XLSX archives, cap workbook dimensions, sanitize model output, and return generic upstream errors. The deployed app also sends CSP, `nosniff`, referrer, permissions, and cross-origin isolation headers.

The in-memory limiter is suitable for a beta, not a complete DDoS solution. For a larger public launch, add a durable Vercel WAF/Redis limit, monitoring, and alerting. Never put a user's API key in `OPENAI_API_KEY` on a public deployment.

## Refresh the checked-in demo data

The checked-in dataset is only the demo/starting state. Do not commit personal training history.

```bash
npm run refresh:data -- \
  "/path/to/latest-MacroFactor-export.xlsx" \
  "app/training-data.json"
```

The script normalizes aliases, merges daily metrics, and writes the generated JSON. It does not modify the source workbook.

## Checks

```bash
npm test       # generated data shape
npm run lint   # ESLint
npm run build  # production build
```

## Deployment

Because uploads and OpenAI calls use `/api/parse`, `/api/openai-connection`, and `/api/recommendations`, deployment needs a Node-compatible server or serverless adapter. Vercel is a suitable option for the current app. A static-only host can show the bundled demo but cannot process new uploads or call OpenAI.

## Contributing and bugs

Open a pull request with a focused change and a short description; I will review contributions. Use the **Report a bug** link in the About page to open a GitHub issue. Please do not attach personal exports, API keys, or other private data.

## Project layout

- `app/page.tsx` — dashboard UI, charts, upload state, local snapshot restore, and interactions
- `app/about/page.tsx` — user guide, schema, privacy, limitations, and rate-limit explanation
- `app/api/parse/route.ts` — CSV/XLSX parsing and normalized summary generation
- `app/api/openai-connection/route.ts` — transient OpenAI model access check
- `app/api/recommendations/route.ts` — guarded AI recommendation route
- `app/globals.css` — visual system and responsive layout
- `app/training-data.json` — generated demo dataset
- `lib/security.ts` — same-origin and in-memory request safeguards
- `scripts/refresh-training-data.mjs` — workbook normalization script
- `scripts/test-data-shape.mjs` — data-shape check
- `public/brand/` — local visual assets

### Identifying builds and checking fonts

The shared dashboard and About footer shows `v<package version>` in production, with a `Local` or `Preview` label in those environments. Hover over the version to see the Git commit and source fingerprint.
The fingerprint is computed from application source, public assets, scripts, dependencies, and build configuration when the server starts or a build runs. Matching fingerprints identify matching source inputs across local and deployed builds; uncommitted source edits change the fingerprint after restarting the dev server.

Vercel uses `npx next build` (see `vercel.json`), while `npm run build` uses Vinext. Run the Vercel build when validating production changes. All active fonts are served from `public/fonts/`, including Montaga and its OFL license, so production no longer depends on a Google Fonts stylesheet request.
