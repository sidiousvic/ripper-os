# Verified Strong source fixture

`original-export.csv` is the user's original Strong CSV, supplied locally and explicitly confirmed anonymized and approved for repository use on 2026-09-05. Copied byte-for-byte from `fixtures/raw-strong.csv`.

SHA-256: `ad65544a973c926aa7aa259a1782b8dd31e5e7e2629e7feaa15c7b9721a2c3bb`.

Observed: 1,903 set rows, 86 distinct timestamp/title pairs, 2020-12-30 through 2021-09-06. Platform, app version, export locale and timezone were not supplied; do not infer them.

## Observed schema

`Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE`

- Date: `YYYY-MM-DD HH:mm:ss`, a wall-clock timestamp without timezone. Preserve this value, not a fabricated UTC instant.
- Workout Name plus full Date identify observed workout groups; no explicit workout ID exists. Require contiguous evidence and report conflicting boundaries.
- Duration: observed `Nh Nm` / `Nm` workout durations. This is not set duration.
- Exercise Name: raw source name; preserve equipment qualifiers.
- Set Order: observed positive integer positions (1–12). No warmup/drop/failure marker is evidenced in this fixture.
- Weight: unitless numeric column. **Unit cannot be established from the file. Require an explicit kg/lb import option.** Per-hand, total, assistance and machine-setting conventions are also unknown; retain unknown load semantics.
- Reps: numeric, may be zero; blanks remain absent.
- Distance: unitless numeric column (one positive observation). **Require a distance-unit option when nonzero distance is present.** No km/mile assumption is supported.
- Seconds: explicit seconds by header, used for exercise/set duration; includes positive values and zero.
- Notes / Workout Notes: optional quoted CSV text. Preserve locally, never project into the dashboard or AI.
- RPE: optional numeric column; do not invent values or infer RIR.

For this fixture, parser options are necessary to normalize weight/distance. User approval establishes provenance, not missing unit conventions. Tests may select explicit units as test inputs; those selections are not evidence of the original settings.

Additional edge-case inputs in tests are explicitly synthetic. There is no evidence yet for alternate Strong date formats, localized numeric separators, unit-bearing headers, negative assistance encoding or nonnumeric set markers; those variants must remain unverified.
