import type { StrengthSession } from "../domain/strength.ts";
import type { TrainingSource } from "../domain/training.ts";

/** Versioned structural fingerprints, not file hashes. Exact JSON avoids hash collisions. */
export interface SourceFingerprint {
  version: 1;
  source: TrainingSource;
  date: string;
  kind: "session" | "aggregate";
  locator: string;
  payload: string;
}

export function sessionFingerprint(session: StrengthSession): SourceFingerprint | null {
  const locator = session.boundary === "source-id" && session.sourceSessionId
    ? [session.source, "id", session.sourceSessionId]
    : session.timePrecision !== "date" && session.originalStartedAt && session.title?.trim()
      ? [session.source, "timestamp-title", session.originalStartedAt, session.title]
      : null;
  if (!locator) return null;
  return {
    version: 1, source: session.source, date: session.date, kind: "session",
    locator: JSON.stringify([1, ...locator]),
    payload: JSON.stringify([
      session.date, session.originalStartedAt, session.startedAt, session.endedAt,
      session.timezone, session.timePrecision, session.title, session.durationSeconds, session.notes,
      session.exercises.map(exercise => [exercise.rawExerciseName, exercise.order, exercise.notes,
        exercise.sets.map(set => [set.index, set.kind, set.rawKind, set.completed, set.reps, set.repsBasis,
          set.load && [set.load.kg, set.load.originalValue, set.load.originalUnit, set.load.component, set.load.basis],
          set.durationSeconds, set.distanceMeters, set.rpe, set.rir, set.notes])]),
    ]),
  };
}

export function observationFingerprint(source: TrainingSource, date: string, rawName: string, metric: string, value: number): SourceFingerprint {
  return { version: 1, source, date, kind: "aggregate", locator: JSON.stringify([1, source, date, rawName, metric]), payload: JSON.stringify(value) };
}
