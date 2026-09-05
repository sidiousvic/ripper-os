import type { CanonicalExerciseDay } from "../domain/training.ts";
import type { AggregateImport } from "./types.ts";

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
export function validateCanonicalExerciseDays(days: CanonicalExerciseDay[]) {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const day of days) {
    if (!isCalendarDate(day.date)) issues.push("Invalid calendar date");
    if (!day.id || !day.importId || !["macrofactor", "strong", "hevy"].includes(day.source) || !day.rawExerciseName || !day.exerciseId || !day.displayName || !day.comparisonKey || !day.sourceRefs?.length || day.sourceRefs.some(ref => !ref)) issues.push("Missing identity or provenance");
    if (ids.has(day.id)) issues.push("Duplicate exercise-day ID");
    ids.add(day.id);
    if (!["source-aggregate", "derived-from-sets"].includes(day.origin)) issues.push("Invalid record origin");
    for (const metric of ["totalSets", "totalReps", "bestSetReps", "heaviestKg", "totalVolumeKg", "e1rmKg", "durationSec"] as const) {
      const value = day.metrics?.[metric];
      if (value !== null && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) issues.push(`Invalid ${metric}`);
    }
  }
  return issues;
}
export function assertValidImport(data: AggregateImport) {
  const issues = validateCanonicalExerciseDays(data.exerciseDays);
  for (const row of data.muscleDays) {
    if (!isCalendarDate(row.date) || !row.rawMuscleName || row.importId !== data.importId || row.source !== data.source || !Number.isFinite(row.setEquivalents) || row.setEquivalents < 0) issues.push("Invalid muscle day");
  }
  if (data.exerciseDays.some(day => day.importId !== data.importId || day.source !== data.source)) issues.push("Mismatched import identity");
  if (issues.length) throw new Error(`Invalid normalized training records: ${issues[0]}`);
}
