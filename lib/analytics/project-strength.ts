import type { DetailedImport } from "../domain/strength.ts";
import type { AggregateImport } from "../import/types.ts";
import { assertValidDetailedImport } from "../import/validation.ts";

type SetLoad = DetailedImport["sessions"][number]["exercises"][number]["sets"][number]["load"];
const comparableLoad = (load: SetLoad): load is NonNullable<SetLoad> =>
  load !== null && (load.component === "external" || load.component === "combined") && load.basis === "total";

/** Project detailed strength facts into the daily aggregate contract used by the dashboard. */
export function projectStrengthImport(data: DetailedImport): AggregateImport {
  assertValidDetailedImport(data);
  const grouped = new Map<string, AggregateImport["exerciseDays"][number]>();
  for (const session of data.sessions) for (const exercise of session.exercises) {
    const key = JSON.stringify([session.date, exercise.exerciseId, exercise.comparisonKey]);
    let day = grouped.get(key);
    if (!day) {
      day = {
        id: `${data.importId}:day:${grouped.size}`,
        importId: data.importId,
        source: data.source,
        rawExerciseName: exercise.rawExerciseName,
        exerciseId: exercise.exerciseId,
        displayName: exercise.displayName,
        date: session.date,
        metrics: { totalSets: 0, totalReps: null, bestSetReps: null, heaviestKg: null, totalVolumeKg: null, e1rmKg: null, durationSec: null },
        origin: "derived-from-sets",
        sourceRefs: [],
        comparisonKey: exercise.comparisonKey,
      };
      grouped.set(key, day);
    }
    const sets = exercise.sets;
    day.metrics.totalSets = (day.metrics.totalSets ?? 0) + sets.length;
    for (const set of sets) {
      day.sourceRefs.push(...set.sourceRefs);
      if (set.reps !== null) {
        day.metrics.totalReps = (day.metrics.totalReps ?? 0) + set.reps;
        day.metrics.bestSetReps = Math.max(day.metrics.bestSetReps ?? 0, set.reps);
      }
      if (comparableLoad(set.load)) {
        day.metrics.heaviestKg = Math.max(day.metrics.heaviestKg ?? 0, set.load.kg);
        if (set.reps !== null) day.metrics.totalVolumeKg = (day.metrics.totalVolumeKg ?? 0) + set.load.kg * set.reps;
      }
      if (set.durationSeconds !== null) day.metrics.durationSec = (day.metrics.durationSec ?? 0) + set.durationSeconds;
    }
  }
  return {
    schemaVersion: 1,
    importId: data.importId,
    source: data.source,
    filename: data.filename,
    adapterVersion: `${data.adapterVersion}:daily-v1`,
    contentHash: data.contentHash,
    knownWorkoutCount: data.sessions.length,
    exerciseDays: [...grouped.values()].sort((a, b) => a.date.localeCompare(b.date) || a.displayName.localeCompare(b.displayName)),
    muscleDays: [],
    issues: data.issues,
    sourceSheets: data.sourceSheets,
    sourceRows: data.sourceRows,
  };
}
