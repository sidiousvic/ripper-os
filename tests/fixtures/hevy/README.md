# Verified Hevy source fixture

`original-export.csv` is the approved anonymized Hevy workout export supplied for Ripper OS development on 2026-09-05. It contains 330 data rows plus a header and uses one row per set.

Observed columns:

- `title`: workout title
- `start_time`, `end_time`: local date/time in `D MMM YYYY, HH:mm` format
- `description`: workout notes
- `exercise_title`, `exercise_notes`: source exercise identity and notes
- `superset_id`: optional grouping identifier
- `set_index`, `set_type`: ordered set metadata
- `weight_kg`, `reps`, `distance_km`, `duration_seconds`, `rpe`: optional measurement fields

The export records weight in kilograms and distance in kilometres. Empty cells represent missing values; they are not zero. SHA-256: `af9f691a5b0db66eecff362541c50d39c6dbcabd242d2193f48d4e638ee00a24`.
