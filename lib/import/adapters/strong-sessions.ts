import type { StrengthSession } from "../../domain/strength.ts";
import type { ImportIssue } from "../types.ts";
import type { StrongRow, StrongRowsResult } from "./strong-rows.ts";

export interface StagedStrongExercise { id: string; order: number; rawExerciseName: string; rows: StrongRow[] }
export interface StagedStrongSession extends Pick<StrengthSession, "id" | "importId" | "source" | "date" | "originalStartedAt" | "timePrecision" | "boundary" | "title" | "sourceRefs"> {
  exercises: StagedStrongExercise[];
}
export interface GroupedStrong {
  importId: string;
  sessions: StagedStrongSession[];
  issues: ImportIssue[];
  ambiguousRowRefs: string[];
}
/** Stage grouping only: raw loads, durations and sets remain untouched. */
export function groupStrongSessions(staged: StrongRowsResult, importId: string): GroupedStrong {
  const result: GroupedStrong = { importId, sessions: [], issues: [...staged.issues], ambiguousRowRefs: [] };
  const seenKeys = new Set<string>();
  let previousKey: string | undefined;
  let session: StagedStrongSession | undefined;
  const warn = (ref: string, message: string) => {
    result.ambiguousRowRefs.push(ref);
    if (result.issues.length < 1000) result.issues.push({ code: "ambiguous-boundary", severity: "warning", rowRefs: [ref], action: "skipped-row", message });
  };
  for (const row of staged.rows) {
    const key = JSON.stringify([row.localTimestamp, row.title]);
    if (!row.title.trim() || !row.localTimestamp) { warn(row.ref, "Workout timestamp and title are required for grouping."); previousKey = undefined; session = undefined; continue; }
    if (key !== previousKey) {
      if (seenKeys.has(key)) { warn(row.ref, "A previously closed workout key reappeared; confirmation is required."); session = undefined; previousKey = key; continue; }
      seenKeys.add(key);
      session = { id: `${importId}:session:${row.row}`, importId, source: "strong", date: row.date, originalStartedAt: row.localTimestamp, timePrecision: "local-datetime", boundary: "timestamp-and-title", title: row.title, sourceRefs: [], exercises: [] };
      result.sessions.push(session);
      previousKey = key;
    }
    if (!session) { warn(row.ref, "Unresolved workout boundary; row retained for review."); continue; }
    let exercise = session.exercises.at(-1);
    const lastRow = exercise?.rows.at(-1);
    const reset = exercise?.rawExerciseName === row.exerciseName && lastRow?.setOrder !== null && row.setOrder !== null && lastRow?.setOrder !== undefined && row.setOrder < lastRow.setOrder;
    if (!exercise || exercise.rawExerciseName !== row.exerciseName || reset) {
      if (reset) {
        // Preserve a block, but do not claim this is certainly one workout rather than two.
        result.ambiguousRowRefs.push(row.ref);
        if (result.issues.length < 1000) result.issues.push({ code: "ambiguous-set-reset", severity: "warning", rowRefs: [row.ref], action: "needs-input", message: "Set order reset within the same timestamp/title; confirm the workout boundary." });
      }
      exercise = { id: `${session.id}:exercise:${row.row}`, order: session.exercises.length, rawExerciseName: row.exerciseName, rows: [] };
      session.exercises.push(exercise);
    }
    if (row.setOrder === null) {
      result.ambiguousRowRefs.push(row.ref);
      if (result.issues.length < 1000) result.issues.push({ code: "ambiguous-set-order", severity: "warning", rowRefs: [row.ref], action: "needs-input", message: "Unknown set marker; sequence retained for boundary review." });
    }
    // Equal consecutive rows remain distinct sets; never deduplicate here.
    exercise.rows.push(row);
    session.sourceRefs.push(row.ref);
  }
  return result;
}
