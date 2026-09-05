import type { TrainingSource } from "../domain/training.ts";
import { canonicalById, exerciseCatalog } from "./catalog.ts";
import { sourceMappingByKey, sourceMappingKey } from "./source-mappings.ts";

export type ResolutionMethod = "user-override" | "source-mapping" | "canonical-name" | "alias" | "custom";
export interface ExerciseOverride { exerciseId?: string; keepCustom?: boolean; comparisonKey?: string }
export type ExerciseOverrideMap = Record<string, ExerciseOverride>;
export interface ExerciseResolution {
  exerciseId: string;
  displayName: string;
  comparisonKey: string;
  method: ResolutionMethod;
  mappingVersion: "v1";
  comparable: boolean;
}

/** Normalize spelling without dropping equipment, angle, stance or machine qualifiers. */
export function normalizeExerciseName(rawName: string) {
  return rawName.normalize("NFKC").trim().toLocaleLowerCase().replace(/[.,/]+/g, " ").replace(/[()[\]{}]/g, " ").replace(/\s+/g, " ").trim();
}
const slug = (value: string) => normalizeExerciseName(value).replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "unnamed";
const stableCustomId = (source: TrainingSource, rawName: string) => `custom_${source}_${slug(rawName)}`;
export const exerciseOverrideKey = (source: TrainingSource, rawName: string) => `${source}:${normalizeExerciseName(rawName)}`;

export function resolveExercise(source: TrainingSource, rawName: string, override?: ExerciseOverride): ExerciseResolution {
  const normalized = normalizeExerciseName(rawName);
  if (override?.keepCustom) {
    const exerciseId = override.exerciseId ?? stableCustomId(source, rawName);
    return { exerciseId, displayName: rawName.trim(), comparisonKey: override.comparisonKey ?? `${source}:${exerciseId}`, method: "user-override", mappingVersion: "v1", comparable: false };
  }
  if (override?.exerciseId && canonicalById.has(override.exerciseId)) {
    const exercise = canonicalById.get(override.exerciseId)!;
    return { exerciseId: exercise.id, displayName: exercise.displayName, comparisonKey: override.comparisonKey ?? `${source}:${exercise.id}`, method: "user-override", mappingVersion: "v1", comparable: Boolean(override.comparisonKey) };
  }
  const mapped = sourceMappingByKey.get(sourceMappingKey(source, rawName));
  if (mapped) return { exerciseId: mapped.exerciseId, displayName: canonicalById.get(mapped.exerciseId)?.displayName ?? rawName.trim(), comparisonKey: mapped.comparable ? mapped.exerciseId : `${source}:${mapped.exerciseId}`, method: "source-mapping", mappingVersion: "v1", comparable: mapped.comparable };
  const exact = exerciseCatalog.find(exercise => normalizeExerciseName(exercise.displayName) === normalized);
  if (exact) return { exerciseId: exact.id, displayName: exact.displayName, comparisonKey: `${source}:${exact.id}`, method: "canonical-name", mappingVersion: "v1", comparable: false };
  const aliases = exerciseCatalog.filter(exercise => exercise.aliases.some(alias => normalizeExerciseName(alias) === normalized));
  if (aliases.length === 1) return { exerciseId: aliases[0].id, displayName: aliases[0].displayName, comparisonKey: `${source}:${aliases[0].id}`, method: "alias", mappingVersion: "v1", comparable: false };
  const exerciseId = stableCustomId(source, rawName);
  return { exerciseId, displayName: rawName.trim(), comparisonKey: `${source}:${exerciseId}`, method: "custom", mappingVersion: "v1", comparable: false };
}
