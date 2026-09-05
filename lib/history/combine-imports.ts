import type { DetailedImport } from "../domain/strength.ts";
import { projectStrengthImport } from "../analytics/project-strength.ts";
import type { AggregateImport } from "../import/types.ts";

export type HistoryImport = AggregateImport;
export type ImportConflict = { kind: "overlap"; dates: string[]; message: string };
export type CombineResult = { ok: true; imports: HistoryImport[] } | { ok: false; conflict: ImportConflict };

const asAggregate = (input: AggregateImport | DetailedImport): AggregateImport =>
  "representation" in input && input.representation === "detailed" ? projectStrengthImport(input) : input as AggregateImport;

export function hasImportedContentHash(existing: HistoryImport[], contentHash?: string) {
  return Boolean(contentHash && existing.some((input) => input.contentHash === contentHash));
}

/** Combine only disjoint imports. Inputs are never mutated when an overlap is found. */
export function combineImports(existing: HistoryImport[], addition: AggregateImport | DetailedImport): CombineResult {
  const current = existing.map(asAggregate);
  const next = asAggregate(addition);
  const existingDates = new Set(current.flatMap(input => input.exerciseDays.map(day => day.date)));
  const overlappingDates = [...new Set(next.exerciseDays.map(day => day.date).filter(date => existingDates.has(date)))].sort();
  if (overlappingDates.length) return { ok: false, conflict: { kind: "overlap", dates: overlappingDates, message: "These histories share training dates; adding overlaps is not supported yet." } };
  return { ok: true, imports: [...current, next] };
}
