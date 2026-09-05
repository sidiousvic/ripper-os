import type { DetailedImport, StrengthSession } from "../../domain/strength.ts";
import type { InspectedInput } from "../inspect-input.ts";
import { assertValidDetailedImport } from "../validation.ts";
import { exerciseOverrideKey, resolveExercise, type ExerciseOverrideMap } from "../../exercises/resolve.ts";
import { parseHevyRows, type HevyRow } from "./hevy-rows.ts";

export function normalizeHevy(input: InspectedInput, filename: string, exerciseOverrides: ExerciseOverrideMap = {}): DetailedImport {
  const staged = parseHevyRows(input); const importId = `hevy:${globalThis.crypto.randomUUID()}`;
  const sessions: StrengthSession[] = []; let session: StrengthSession | undefined; let previousKey = "";
  for (const row of staged.rows) {
    const key = `${row.startTime}\u0000${row.title}`;
    if (key !== previousKey) {
      session = { id: `${importId}:session:${row.row}`, importId, source: "hevy", date: row.date, originalStartedAt: row.startTime, startedAt: row.startTime, endedAt: row.endTime, timezone: undefined, timePrecision: "local-datetime", boundary: "timestamp-and-title", title: row.title, durationSeconds: null, notes: row.description || undefined, exercises: [], sourceRefs: [] };
      sessions.push(session); previousKey = key;
    }
    if (!session) continue;
    let exercise = session.exercises.at(-1);
    if (!exercise || exercise.rawExerciseName !== row.exerciseName) {
      const resolved = resolveExercise("hevy", row.exerciseName, exerciseOverrides[exerciseOverrideKey("hevy", row.exerciseName)]);
      exercise = { id: `${session.id}:exercise:${row.row}`, rawExerciseName: row.exerciseName, displayName: resolved.displayName, exerciseId: resolved.exerciseId, comparisonKey: resolved.comparisonKey, order: session.exercises.length, notes: row.exerciseNotes || undefined, sets: [] };
      session.exercises.push(exercise);
    }
    exercise.sets.push({ id: `${importId}:set:${row.row}`, index: row.setIndex ?? exercise.sets.length, kind: "unknown", rawKind: row.setType || undefined, completed: null, reps: row.reps, repsBasis: "unknown", load: row.weightKg === null ? null : { kg: row.weightKg, component: "external", basis: "unknown", originalValue: row.weightKg, originalUnit: "kg" }, durationSeconds: row.durationSeconds, distanceMeters: row.distanceMeters, rpe: row.rpe, rir: null, notes: row.exerciseNotes || undefined, sourceRefs: [row.ref] });
    session.sourceRefs.push(row.ref);
  }
  const data: DetailedImport = { schemaVersion: 1, representation: "detailed", importId, source: "hevy", filename, adapterVersion: "csv-v1", sessions, issues: staged.issues, sourceSheets: staged.sourceSheets, sourceRows: staged.sourceRows };
  assertValidDetailedImport(data); return data;
}
