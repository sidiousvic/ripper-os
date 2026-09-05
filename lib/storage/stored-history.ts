import type { DetailedImport } from "../domain/strength.ts";
import type { AggregateImport } from "../import/types.ts";
import type { ExerciseOverrideMap } from "../exercises/resolve.ts";

export type StoredImport = AggregateImport | DetailedImport;

export interface StoredHistory {
  schemaVersion: 1;
  imports: StoredImport[];
  exerciseOverrides: ExerciseOverrideMap;
}

export function isStoredHistory(value: unknown): value is StoredHistory {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoredHistory>;
  return candidate.schemaVersion === 1
    && Array.isArray(candidate.imports)
    && Boolean(candidate.exerciseOverrides && typeof candidate.exerciseOverrides === "object" && !Array.isArray(candidate.exerciseOverrides));
}

export function createStoredHistory(imports: StoredImport[] = [], exerciseOverrides: ExerciseOverrideMap = {}): StoredHistory {
  return { schemaVersion: 1, imports: [...imports], exerciseOverrides: { ...exerciseOverrides } };
}
