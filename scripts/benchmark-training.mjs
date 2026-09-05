import { performance } from "node:perf_hooks";
import { buildDashboard } from "../lib/analytics/build-dashboard.ts";

const exerciseDays = []; const start = new Date("2016-01-01T00:00:00Z");
for (let index = 0; index < 100_000; index++) {
  const date = new Date(start.valueOf() + (index % 3650) * 86_400_000).toISOString().slice(0, 10);
  const exercise = `Synthetic Exercise ${index % 40}`;
  exerciseDays.push({ id: `bench:${index}`, importId: "bench", source: "strong", rawExerciseName: exercise, exerciseId: `exercise_${index % 40}`, displayName: exercise, date, metrics: { totalSets: 1, totalReps: 8, bestSetReps: 8, heaviestKg: 80, totalVolumeKg: 640, e1rmKg: null, durationSec: null }, origin: "derived-from-sets", sourceRefs: [`row:${index}`], comparisonKey: `exercise_${index % 40}:external:total` });
}
const input = { schemaVersion: 1, importId: "bench", source: "strong", filename: "benchmark", adapterVersion: "bench", exerciseDays, muscleDays: [], issues: [], sourceSheets: {}, sourceRows: [] };
const started = performance.now(); const result = buildDashboard(input); const elapsed = performance.now() - started;
console.log(JSON.stringify({ records: exerciseDays.length, exercises: result.exercises.length, elapsedMs: Math.round(elapsed * 100) / 100 }));
