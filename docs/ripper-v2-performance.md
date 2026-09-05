# Ripper OS performance baseline

Run `node --experimental-strip-types scripts/benchmark-training.mjs` from the repository root. The benchmark builds a synthetic 10-year history with 100,000 aggregate exercise-day records across 40 movements using the same dashboard pipeline as imports. It reports elapsed local Node runtime and exercise count; repeat on a named device/runtime before changing analytics.

The benchmark is intentionally a measurement checkpoint. It does not establish a universal performance guarantee or justify caching/database infrastructure by itself.
