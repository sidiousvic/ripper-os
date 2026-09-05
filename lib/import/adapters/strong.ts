import type { DetailedImport, RecordedLoad, StrengthSession } from "../../domain/strength.ts";
import type { InspectedInput } from "../inspect-input.ts";
import type { ImportIssue } from "../types.ts";
import { kilograms, meters } from "../units.ts";
import { assertValidDetailedImport } from "../validation.ts";
import { strongDuration } from "../value-parsing.ts";
import { parseStrongRows, type StrongOptions, type StrongRowsResult } from "./strong-rows.ts";
import { groupStrongSessions } from "./strong-sessions.ts";

export interface StrongNormalizationOptions extends StrongOptions {
  /** Explicit user/source evidence only; never inferred from the exercise name. */
  loadSemantics?: Record<string, Pick<RecordedLoad, "component" | "basis">>;
}
export type StrongImportOutcome =
  | { status: "ready"; data: DetailedImport }
  | { status: "needs-input"; needs: string[]; staged: StrongRowsResult; issues: ImportIssue[] };

export function normalizeStrong(input: InspectedInput, filename: string, options: StrongNormalizationOptions = {}): StrongImportOutcome {
  const staged = parseStrongRows(input, options);
  const needs: string[] = [...staged.needs];
  // This fixture has global, unitless measurements. Additional unit columns need
  // a verified dialect, rather than letting a global option override conflicting rows.
  for (const [sheet, headers] of Object.entries(staged.sourceSheets)) {
    const unitColumns = headers.flatMap((header, index) => /^(weight|distance)[ _]unit$/i.test(header.trim()) ? [index] : []);
    if (unitColumns.length && staged.sourceRows.some(row => row.sheet === sheet && unitColumns.some(index => row.cells[index] !== null && row.cells[index] !== ""))) needs.push("row-unit-conventions");
  }
  if (needs.length) return { status: "needs-input", needs: [...new Set(needs)], staged, issues: staged.issues };
  if (!staged.rows.length) throw new Error("No valid Strong training rows remain. Review the reported date and exercise fields.");
  const importId = `strong:${globalThis.crypto.randomUUID()}`;
  const grouped = groupStrongSessions(staged, importId);
  if (grouped.ambiguousRowRefs.length) return { status: "needs-input", needs: ["session-boundaries"], staged, issues: grouped.issues };
  const issues = [...grouped.issues];
  const warn = (ref: string, message: string) => { if (issues.length < 1000) issues.push({ code: "conflicting-workout-metadata", severity: "warning", rowRefs: [ref], action: "omitted-field", message }); };
  const sessions: StrengthSession[] = grouped.sessions.map(session => {
    const rows = session.exercises.flatMap(exercise => exercise.rows);
    const durations = [...new Set(rows.map(row => strongDuration(row.rawDuration)).filter(value => value !== null))];
    if (durations.length > 1) warn(rows[0].ref, "Conflicting workout durations; canonical duration omitted.");
    const notes = [...new Set(rows.map(row => row.workoutNotes).filter(Boolean))].join("\n");
    return {
      ...session, durationSeconds: durations.length === 1 ? durations[0] : null, notes: notes || undefined,
      exercises: session.exercises.map(exercise => {
        const semantics = options.loadSemantics?.[exercise.rawExerciseName] ?? { component: "unknown" as const, basis: "unknown" as const };
        const exerciseId = `strong:${exercise.rawExerciseName}`;
        return {
          id: exercise.id, order: exercise.order, rawExerciseName: exercise.rawExerciseName, displayName: exercise.rawExerciseName, exerciseId,
          comparisonKey: JSON.stringify([exerciseId, semantics.component, semantics.basis]),
          sets: exercise.rows.map((row, index) => ({
            id: `${importId}:set:${row.row}`, index, kind: "unknown" as const, rawKind: row.rawSetOrder,
            completed: null, reps: row.reps, repsBasis: "unknown" as const,
            load: row.weight === null ? null : { kg: kilograms(row.weight, options.weightUnit!), originalValue: row.weight, originalUnit: options.weightUnit!, ...semantics },
            durationSeconds: row.seconds,
            distanceMeters: row.distance === null ? null : row.distance === 0 ? 0 : meters(row.distance, options.distanceUnit!),
            rpe: row.rpe, rir: null, notes: row.notes || undefined, sourceRefs: [row.ref],
          })),
        };
      }),
    };
  });
  const data: DetailedImport = { schemaVersion: 1, representation: "detailed", importId, source: "strong", filename, adapterVersion: "csv-v1", sessions, issues, sourceSheets: staged.sourceSheets, sourceRows: staged.sourceRows };
  assertValidDetailedImport(data);
  return { status: "ready", data };
}
