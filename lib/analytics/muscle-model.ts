import type { DetailedImport } from "../domain/strength.ts";
import type { SourceMuscleDay } from "../domain/training.ts";
import { canonicalById } from "../exercises/catalog.ts";

export const MUSCLE_MODEL_VERSION = "v1" as const;
export interface DerivedMuscleExposure { modelVersion: typeof MUSCLE_MODEL_VERSION; muscleDays: SourceMuscleDay[]; mappedSets: number; unresolvedSets: number; }

export function deriveMuscleExposure(data: DetailedImport): DerivedMuscleExposure {
  const grouped = new Map<string, SourceMuscleDay>(); let mappedSets = 0; let unresolvedSets = 0;
  for (const session of data.sessions) for (const exercise of session.exercises) {
    const definition = canonicalById.get(exercise.exerciseId);
    if (!definition?.primaryMuscles?.length) { unresolvedSets += exercise.sets.length; continue; }
    for (const set of exercise.sets) {
      if (set.rawKind?.toLowerCase() === "warmup") continue;
      mappedSets += 1;
      for (const [muscle, weight] of [...definition.primaryMuscles.map(name => [name, 1] as const), ...(definition.secondaryMuscles ?? []).map(name => [name, 0.5] as const)]) {
        const key = `${data.importId}:${session.date}:${muscle}`; const row = grouped.get(key);
        if (row) row.setEquivalents += weight;
        else grouped.set(key, { importId: data.importId, source: data.source, date: session.date, rawMuscleName: muscle, setEquivalents: weight });
      }
    }
  }
  return { modelVersion: MUSCLE_MODEL_VERSION, muscleDays: [...grouped.values()], mappedSets, unresolvedSets };
}
