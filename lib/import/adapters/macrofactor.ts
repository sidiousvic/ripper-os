import * as XLSX from "xlsx";
import type { InspectedInput } from "../inspect-input.ts";
import type { CanonicalExerciseDay, DailyMetric, DailyMetrics } from "../../domain/training.ts";
import type { AggregateImport, ImportIssue } from "../types.ts";
import { assertValidImport, isCalendarDate } from "../validation.ts";
import { exerciseOverrideKey, resolveExercise, type ExerciseOverrideMap } from "../../exercises/resolve.ts";

const DAY = 86_400_000;
const clean = (value: unknown) => String(value ?? "").replace(/ \((kg|sets|reps|sec)\)$/i, "").trim();
const aliases = new Map([["Wide Grip Pull Up", "Wide Grip Pull-Up"], ["Bench Dips", "Bench Dip"], ["Jumping Rope", "Jump Rope"]]);
const displayName = (raw: string) => { const name = clean(raw).split(" ∈ ")[0].trim(); return aliases.get(name) ?? name; };
const emptyMetrics = (): DailyMetrics => ({ totalSets: null, totalReps: null, bestSetReps: null, heaviestKg: null, totalVolumeKg: null, e1rmKg: null, durationSec: null });
const metricSheets: [string, DailyMetric][] = [
  ["Exercises - Total Sets", "totalSets"], ["Exercises - Total Reps", "totalReps"],
  ["Exercises - Best Set Reps", "bestSetReps"], ["Exercises - Heaviest Weight", "heaviestKg"],
  ["Exercises - Total Volume", "totalVolumeKg"], ["Exercises - 1-RM", "e1rmKg"],
  ["Exercises - Total Duration", "durationSec"],
];
function sourceDate(value: unknown, date1904: boolean): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = Date.UTC(date1904 ? 1904 : 1899, date1904 ? 0 : 11, date1904 ? 1 : 30) + Math.round(value) * DAY;
    if (!Number.isFinite(new Date(ms).valueOf())) return null;
    const result = new Date(ms).toISOString().slice(0, 10);
    return isCalendarDate(result) ? result : null;
  }
  const text = String(value ?? "").trim();
  // Match a complete source date; never let Date normalize an impossible day.
  const match = /^(\d{4})[-/](\d{2})[-/](\d{2})(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.exec(text);
  const result = match ? `${match[1]}-${match[2]}-${match[3]}` : "";
  return isCalendarDate(result) ? result : null;
}

/** Source mapping only: no dashboard calculations or display zero-filling. */
export function normalizeMacroFactor(workbook: InspectedInput, filename: string, options: { exerciseOverrides?: ExerciseOverrideMap } = {}): AggregateImport {
  // Import-local identity, not a deduplication fingerprint (reconciliation is a later task).
  const importId = `macrofactor:${globalThis.crypto.randomUUID()}`;
  const result: AggregateImport = { schemaVersion: 1, importId, source: "macrofactor", filename, adapterVersion: "aggregate-v2", exerciseDays: [], muscleDays: [], issues: [], sourceSheets: {}, sourceRows: [] };
  const days = new Map<string, CanonicalExerciseDay>();
  const issue = (code: string, ref: string, action: ImportIssue["action"], message: string) => {
    if (result.issues.length < 1000) result.issues.push({ code, severity: "warning", rowRefs: [ref], action, message });
  };
  const number = (value: unknown, ref: string): number | null => {
    if (value === null || value === undefined || value === "") return null;
    const numeric = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
    if (!Number.isFinite(numeric) || numeric < 0) { issue("invalid-number", ref, "omitted-field", "A non-negative finite number was expected."); return null; }
    return numeric;
  };
  const rows = (sheet: string) => {
    if (!workbook.Sheets[sheet]) return [];
    const values = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheet], { header: 1, raw: true, defval: null });
    result.sourceSheets[sheet] = (values[0] ?? []).map(value => String(value ?? ""));
    return values.slice(1).map((cells, index) => {
      const ref = `${sheet}!${index + 2}`;
      result.sourceRows.push({ ref, sheet, row: index + 2, cells: cells.map(value => typeof value === "string" || typeof value === "boolean" || typeof value === "number" ? value : null) });
      return { cells, ref };
    });
  };
  const date = (value: unknown, ref: string) => {
    const parsed = sourceDate(value, !!workbook.Workbook?.WBProps?.date1904);
    if (!parsed) issue("invalid-date", ref, "skipped-row", "An invalid calendar date was omitted.");
    return parsed;
  };
  const day = (date: string, rawExerciseName: string) => {
    const key = JSON.stringify([date, rawExerciseName]);
    let entry = days.get(key);
    if (!entry) {
      const resolverName = rawExerciseName.includes(" ∈ ") ? displayName(rawExerciseName) : rawExerciseName;
      const resolved = resolveExercise("macrofactor", resolverName, options.exerciseOverrides?.[exerciseOverrideKey("macrofactor", resolverName)]);
      entry = { id: `${importId}:${key}`, importId, source: "macrofactor", rawExerciseName, exerciseId: resolved.exerciseId, displayName: displayName(rawExerciseName), date, metrics: emptyMetrics(), origin: "source-aggregate", sourceRefs: [], comparisonKey: resolved.comparisonKey };
      days.set(key, entry);
    }
    return entry;
  };
  if (workbook.inputKind === "csv") {
    const sheet = workbook.SheetNames[0];
    const data = rows(sheet);
    const headers = result.sourceSheets[sheet];
    const index = (name: string) => headers.findIndex(header => clean(header).toLowerCase() === name.toLowerCase());
    const dateCol = index("Date"), exerciseCol = index("Exercise"), repsCol = index("Reps");
    if (dateCol < 0 || exerciseCol < 0 || repsCol < 0) throw new Error("Missing required CSV column.");
    const kg = headers.findIndex(header => /^weight\s*\(kg\)$/i.test(header.trim()));
    const lb = headers.findIndex(header => /^weight\s*\((?:lb|lbs|pounds)\)$/i.test(header.trim()));
    if (headers.some(header => /^weight\s*\(/i.test(header.trim()) && !/^weight\s*\((?:kg|lb|lbs|pounds)\)$/i.test(header.trim()))) throw new Error("Unsupported weight unit");
    const weightCol = kg >= 0 ? kg : lb;
    for (const { cells, ref } of data) {
      const parsedDate = date(cells[dateCol], ref);
      const raw = String(cells[exerciseCol] ?? "").trim();
      if (!parsedDate) continue;
      if (!raw) { issue("missing-exercise", ref, "skipped-row", "A row without an exercise was omitted."); continue; }
      const reps = number(cells[repsCol], ref);
      const duration = number(cells[index("Duration")], ref);
      const workoutDuration = number(cells[index("Workout Duration")], ref);
      const repsSupplied = cells[repsCol] !== null && cells[repsCol] !== undefined && cells[repsCol] !== "";
      if (reps === null && (repsSupplied || duration === null)) { issue("invalid-reps", ref, "skipped-row", "A row without valid repetitions or exercise duration was omitted."); continue; }
      const suppliedWeight = number(cells[weightCol], ref);
      const weight = suppliedWeight === null ? null : suppliedWeight * (kg < 0 && lb >= 0 ? 0.45359237 : 1);
      const entry = day(parsedDate, raw);
      entry.sourceRefs.push(ref);
      const m = entry.metrics;
      m.totalSets = (m.totalSets ?? 0) + 1;
      if (reps !== null) { m.totalReps = (m.totalReps ?? 0) + reps; m.bestSetReps = Math.max(m.bestSetReps ?? 0, reps); }
      if (weight !== null) { m.heaviestKg = Math.max(m.heaviestKg ?? 0, weight); if (reps !== null) m.totalVolumeKg = (m.totalVolumeKg ?? 0) + weight * reps; }
      m.durationSec = duration ?? workoutDuration ?? m.durationSec;
    }
  } else {
    for (const [sheet, metric] of metricSheets) {
      for (const { cells, ref } of rows(sheet)) {
        const parsedDate = date(cells[0], ref);
        if (!parsedDate) continue;
        for (let column = 1; column < result.sourceSheets[sheet].length; column++) {
          const cellRef = `${ref}:${XLSX.utils.encode_col(column)}`;
          const value = number(cells[column], cellRef);
          if (value === null) continue;
          const raw = clean(result.sourceSheets[sheet][column]);
          if (!raw) { issue("missing-exercise", cellRef, "omitted-field", "An unnamed exercise column was omitted."); continue; }
          const entry = day(parsedDate, raw);
          entry.metrics[metric] = value;
          entry.sourceRefs.push(cellRef);
        }
      }
    }
    const sheet = "Muscle Groups - Sets";
    for (const { cells, ref } of rows(sheet)) {
      const parsedDate = date(cells[0], ref);
      if (!parsedDate) continue;
      for (let column = 1; column < result.sourceSheets[sheet].length; column++) {
        const value = number(cells[column], `${ref}:${XLSX.utils.encode_col(column)}`);
        const rawMuscleName = clean(result.sourceSheets[sheet][column]);
        if (value !== null && rawMuscleName) result.muscleDays.push({ importId, source: "macrofactor", date: parsedDate, rawMuscleName, setEquivalents: value });
      }
    }
  }
  result.exerciseDays = [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
  assertValidImport(result);
  return result;
}
