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
  for (const measurement of data.bodyweightMeasurements ?? []) {
    if (!measurement.id || !measurement.importId || measurement.importId !== data.importId || measurement.source !== data.source || !isCalendarDate(measurement.date) || !Number.isFinite(measurement.kg) || measurement.kg < 0 || !Number.isFinite(measurement.originalValue) || measurement.originalValue < 0 || measurement.originalUnit !== "kg" || !["scale", "trend"].includes(measurement.kind) || !measurement.sourceRefs.length) issues.push("Invalid bodyweight measurement");
  }
  if (data.exerciseDays.some(day => day.importId !== data.importId || day.source !== data.source)) issues.push("Mismatched import identity");
  if (issues.length) throw new Error(`Invalid normalized training records: ${issues[0]}`);
}

/** Runtime gate before any detailed source may feed shared analytics. */
export function assertValidDetailedImport(data: import("../domain/strength.ts").DetailedImport) {
  const ids = new Set<string>();
  const refs = new Set(data.sourceRows.map(row => row.ref));
  const fail = () => { throw new Error("Invalid normalized detailed training records."); };
  const id = (value: string) => { if (!value || ids.has(value)) fail(); ids.add(value); };
  const number = (value: number | null) => { if (value !== null && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) fail(); };
  const sourceRefs = (values: string[]) => { if (!values.length || values.some(value => !refs.has(value))) fail(); };
  if (data.schemaVersion !== 1 || data.representation !== "detailed" || !data.importId || !["macrofactor", "strong", "hevy"].includes(data.source) || !data.sessions.length) fail();
  for (const session of data.sessions) {
    id(session.id);
    if (session.importId !== data.importId || session.source !== data.source || !isCalendarDate(session.date) || !["date", "local-datetime", "instant"].includes(session.timePrecision) || !["source-id", "timestamp-and-title", "confirmed"].includes(session.boundary)) fail();
    number(session.durationSeconds);
    sourceRefs(session.sourceRefs);
    if (!session.exercises.length) fail();
    for (const [order, exercise] of session.exercises.entries()) {
      id(exercise.id);
      if (exercise.order !== order || !exercise.exerciseId || !exercise.rawExerciseName || !exercise.displayName || !exercise.comparisonKey || !exercise.sets.length) fail();
      for (const [index, set] of exercise.sets.entries()) {
        id(set.id);
        if (set.index !== index || !["normal", "warmup", "drop", "failure", "other", "unknown"].includes(set.kind) || !["total", "per-side", "unknown"].includes(set.repsBasis) || set.completed !== null && typeof set.completed !== "boolean") fail();
        for (const value of [set.reps, set.durationSeconds, set.distanceMeters, set.rpe, set.rir]) number(value);
        if (set.rpe !== null && set.rpe > 10) fail();
        sourceRefs(set.sourceRefs);
        if (set.load !== null) {
          number(set.load.kg); number(set.load.originalValue);
          if (!Number.isFinite(set.load.kg) || !Number.isFinite(set.load.originalValue) || !["kg", "lb"].includes(set.load.originalUnit) || !["external", "assistance", "combined", "unknown"].includes(set.load.component) || !["total", "per-implement", "per-side", "machine-setting", "unknown"].includes(set.load.basis)) fail();
          const expected = set.load.originalValue * (set.load.originalUnit === "lb" ? 0.45359237 : 1);
          if (Math.abs(expected - set.load.kg) > Math.max(1, expected) * 1e-12) fail();
        }
      }
    }
  }
}
