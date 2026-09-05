import type { DashboardData } from "../../analytics/dashboard-types.ts";
import type { CanonicalExerciseDay, SourceMuscleDay } from "../../domain/training.ts";

export type MacroFactorImport = {
  schemaVersion: 1;
  importId: string;
  source: "macrofactor";
  filename: string;
  adapterVersion: "legacy-dashboard-v1";
  exerciseDays: CanonicalExerciseDay[];
  muscleDays: SourceMuscleDay[];
  dashboard: DashboardData;
};

export function createMacroFactorImport(dashboard: DashboardData, filename: string): MacroFactorImport {
  const importId = `macrofactor:${filename}`;
  const exerciseDays = dashboard.exercises.flatMap((exercise) => exercise.progress.map((progress) => ({
    id: `${importId}:${progress.date}:${exercise.name}`,
    importId,
    source: "macrofactor" as const,
    rawExerciseName: exercise.name,
    exerciseId: `macrofactor:${exercise.name}`,
    displayName: exercise.name,
    date: progress.date,
    metrics: {
      totalSets: progress.totalSets,
      totalReps: progress.totalReps,
      bestSetReps: progress.bestSetReps,
      heaviestKg: progress.heaviestKg,
      totalVolumeKg: progress.totalVolumeKg,
      e1rmKg: progress.e1rmKg,
      durationSec: progress.durationSec,
    },
    origin: "source-aggregate" as const,
    sourceRefs: [`${filename}:${progress.date}:${exercise.name}`],
    comparisonKey: `macrofactor:${exercise.name}`,
  })));
  // The legacy DashboardData shape contains only already-aggregated muscle
  // summaries, so no dated muscle facts are fabricated at this boundary.
  return { schemaVersion: 1, importId, source: "macrofactor", filename, adapterVersion: "legacy-dashboard-v1", exerciseDays, muscleDays: [], dashboard };
}
