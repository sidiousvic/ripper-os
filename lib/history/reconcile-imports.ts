import type { DetailedImport } from "../domain/strength.ts";
import type { DailyMetric } from "../domain/training.ts";
import type { AggregateImport } from "../import/types.ts";
import { assertValidImport, assertValidDetailedImport } from "../import/validation.ts";
import { projectStrengthImport } from "../analytics/project-strength.ts";
import { observationFingerprint, sessionFingerprint, type SourceFingerprint } from "./fingerprints.ts";

/** Session evidence survives projection; dashboard records remain aggregates. */
export type HistoryImport = AggregateImport & { sessionFingerprints?: SourceFingerprint[] };
export type ImportConflict = { kind: "overlap" | "changed" | "ambiguous"; dates: string[]; message: string };
export type ReconcileResult =
  | { ok: true; imports: HistoryImport[]; status: "added" | "unchanged"; added: number; unchanged: number }
  | { ok: false; conflict: ImportConflict };

export function toHistoryImport(input: AggregateImport | DetailedImport): HistoryImport {
  return "representation" in input && input.representation === "detailed" ? projectStrengthImport(input) : input as HistoryImport;
}

export type ConflictChoice = "keep-existing" | "use-incoming" | "keep-both";

export function resolveDateConflict(existing: HistoryImport[], incoming: HistoryImport, dates: string[], choice: ConflictChoice): HistoryImport[] {
  if (choice === "keep-existing") return [...existing];
  if (choice === "keep-both") return [...existing, incoming];
  const affected = new Set(dates);
  const retained = existing.map(input => ({
    ...input,
    exerciseDays: input.exerciseDays.filter(day => !affected.has(day.date)),
    muscleDays: input.muscleDays.filter(day => !affected.has(day.date)),
  })).filter(input => input.exerciseDays.length || input.muscleDays.length);
  return [...retained, incoming];
}

const datesOf = (input: AggregateImport) => new Set([...input.exerciseDays.map(day => day.date), ...input.muscleDays.map(day => day.date)]);
function observations(input: AggregateImport) {
  return [
    ...input.exerciseDays.filter(day => day.origin === "source-aggregate").flatMap(day =>
      Object.entries(day.metrics).flatMap(([metric, value]) => value === null ? [] : [observationFingerprint(input.source, day.date, day.rawExerciseName, metric, value)])),
    ...input.muscleDays.map(day => observationFingerprint(input.source, day.date, day.rawMuscleName, "muscle-set-equivalents", day.setEquivalents)),
  ];
}

/** One local history is one source profile. No cross-source or date-only deduplication. */
export function reconcileImports(existing: HistoryImport[], addition: AggregateImport | DetailedImport): ReconcileResult {
  const detailed = "representation" in addition && addition.representation === "detailed" ? addition : null;
  if (detailed) assertValidDetailedImport(detailed);
  const next: HistoryImport = toHistoryImport(addition);
  assertValidImport(next);
  const incomingDates = datesOf(next);
  const conflict = (kind: ImportConflict["kind"], dates: string[], message: string): ReconcileResult =>
    ({ ok: false, conflict: { kind, dates: [...new Set(dates)].sort(), message } });
  const foreignOverlap = existing.filter(input => input.source !== next.source).flatMap(input => [...datesOf(input)].filter(date => incomingDates.has(date)));
  if (foreignOverlap.length) return conflict("overlap", foreignOverlap, "These histories share training dates across sources; adding these overlaps is not supported yet.");

  const previous = new Map<string, SourceFingerprint>();
  const sessionDates = new Set<string>();
  const aggregateDates = new Set<string>();
  const ambiguousDates = new Set<string>();
  for (const input of existing.filter(input => input.source === next.source)) {
    assertValidImport(input);
    for (const entry of [...observations(input), ...(input.sessionFingerprints ?? [])]) {
      if (entry.version !== 1) return conflict("ambiguous", [entry.date], "Reimport is required for an unsupported fingerprint version.");
      const old = previous.get(entry.locator);
      if (old && old.payload !== entry.payload) return conflict("changed", [entry.date], "Existing history has conflicting observations; resolve them before adding data.");
      previous.set(entry.locator, entry);
      (entry.kind === "session" ? sessionDates : aggregateDates).add(entry.date);
    }
    const evidencedDates = new Set(input.sessionFingerprints?.map(entry => entry.date));
    for (const day of input.exerciseDays) if (day.origin === "derived-from-sets" && !evidencedDates.has(day.date)) ambiguousDates.add(day.date);
  }

  let added = 0, unchanged = 0;
  let failure: ReconcileResult | undefined;
  const seen = new Set<string>();
  const accept = (entry: SourceFingerprint) => {
    if (seen.has(entry.locator)) {
      failure = conflict("ambiguous", [entry.date], "The incoming export repeats an observation or workout locator; confirmation is required.");
      return false;
    }
    seen.add(entry.locator);
    const old = previous.get(entry.locator);
    if (!old) { added++; return true; }
    if (old.payload !== entry.payload) failure = conflict("changed", [entry.date], "An existing workout or daily observation has changed. Your history is unchanged; resolve this overlap before importing.");
    else unchanged++;
    return false;
  };

  let accepted: HistoryImport;
  if (detailed) {
    const evidence: SourceFingerprint[] = [];
    const sessions = detailed.sessions.filter(session => {
      if (aggregateDates.has(session.date) || ambiguousDates.has(session.date)) {
        failure = conflict("ambiguous", [session.date], "Daily aggregates cannot be matched to detailed workouts safely.");
        return false;
      }
      const fingerprint = sessionFingerprint(session);
      if (!fingerprint) {
        failure = conflict("ambiguous", [session.date], "A detailed workout needs a source ID or full timestamp and title for safe incremental imports.");
        return false;
      }
      if (!accept(fingerprint)) return false;
      evidence.push(fingerprint);
      return true;
    });
    // Never validate/project an empty DetailedImport; no-op candidates retain only metadata.
    accepted = sessions.length ? { ...projectStrengthImport({ ...detailed, sessions }), sessionFingerprints: evidence }
      : { ...next, exerciseDays: [], muscleDays: [], knownWorkoutCount: 0, sessionFingerprints: [] };
  } else {
    const overlap = [...incomingDates].filter(date => sessionDates.has(date) || ambiguousDates.has(date));
    if (overlap.length) return conflict("ambiguous", overlap, "Daily aggregates cannot be matched to detailed workouts safely.");
    if (next.exerciseDays.some(day => day.origin === "derived-from-sets")) {
      return conflict("ambiguous", [...incomingDates], "Import the source export instead of its daily projection to preserve workout identity.");
    }
    accepted = { ...next, exerciseDays: next.exerciseDays.flatMap(day => {
      const metrics = { ...day.metrics };
      for (const metric of Object.keys(metrics) as DailyMetric[]) {
        const value = metrics[metric];
        if (value !== null && !accept(observationFingerprint(next.source, day.date, day.rawExerciseName, metric, value))) metrics[metric] = null;
      }
      return Object.values(metrics).some(value => value !== null) ? [{ ...day, metrics }] : [];
    }), muscleDays: next.muscleDays.filter(day => accept(observationFingerprint(next.source, day.date, day.rawMuscleName, "muscle-set-equivalents", day.setEquivalents))) };
  }
  if (failure) return failure;
  // Metadata-only envelopes retain accepted file hashes without inventing observations.
  return { ok: true, imports: [...existing, accepted], status: added ? "added" : "unchanged", added, unchanged };
}
