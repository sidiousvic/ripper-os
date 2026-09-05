import * as XLSX from "xlsx";
import type { InspectedInput } from "../inspect-input.ts";
import type { ImportIssue, SourceRow } from "../types.ts";
import { detectFormat } from "../detect-format.ts";
import { isBlank, nonNegativeNumber, strongDuration, strongTimestamp } from "../value-parsing.ts";

export interface StrongOptions { weightUnit?: "kg" | "lb"; distanceUnit?: "m" | "km" | "mi" }
export interface StrongRow {
  ref: string;
  row: number;
  date: string;
  localTimestamp: string;
  title: string;
  exerciseName: string;
  rawSetOrder: string;
  setOrder: number | null;
  weight: number | null;
  reps: number | null;
  distance: number | null;
  seconds: number | null;
  rpe: number | null;
  rawDuration: string;
  notes: string;
  workoutNotes: string;
}
export interface StrongRowsResult {
  status: "ready" | "needs-input";
  needs: ("weight-unit" | "distance-unit" | "date-format")[];
  rows: StrongRow[];
  issues: ImportIssue[];
  sourceSheets: Record<string, string[]>;
  sourceRows: SourceRow[];
  options: StrongOptions;
}
export function parseStrongRows(input: InspectedInput, options: StrongOptions = {}): StrongRowsResult {
  if (detectFormat(input).format !== "strong") throw new Error("A recognized unambiguous Strong CSV is required.");
  if (options.weightUnit && !["kg", "lb"].includes(options.weightUnit) || options.distanceUnit && !["m", "km", "mi"].includes(options.distanceUnit)) throw new Error("Unsupported Strong unit option.");
  const sheet = input.SheetNames[0];
  const values = XLSX.utils.sheet_to_json<unknown[]>(input.Sheets[sheet], { header: 1, raw: true, defval: null });
  const headers = values[0].map(value => String(value ?? ""));
  const headerIndex = new Map(headers.map((header, index) => [header.trim().toLowerCase(), index]));
  if (headerIndex.size !== headers.length) throw new Error("Duplicate Strong column names.");
  const result: StrongRowsResult = { status: "ready", needs: [], rows: [], issues: [], sourceSheets: { [sheet]: headers }, sourceRows: [], options: { ...options } };
  const issue = (code: string, ref: string, action: ImportIssue["action"], message: string) => {
    if (result.issues.length < 1000) result.issues.push({ code, severity: "warning", rowRefs: [ref], action, message });
  };
  for (let index = 1; index < values.length; index++) {
    const cells = values[index];
    const ref = `${sheet}!${index + 1}`;
    result.sourceRows.push({ ref, sheet, row: index + 1, cells: cells.map(value => typeof value === "number" || typeof value === "string" || typeof value === "boolean" ? value : null) });
    if (cells.every(isBlank)) continue;
    const get = (name: string) => cells[headerIndex.get(name.toLowerCase()) ?? -1];
    const text = (name: string) => String(get(name) ?? "");
    const timestamp = strongTimestamp(get("Date"));
    if (!timestamp) {
      const ambiguous = /^\d{1,2}[/.-]\d{1,2}[/.-]\d{4}/.test(text("Date"));
      if (ambiguous && !result.needs.includes("date-format")) result.needs.push("date-format");
      issue("invalid-date", ref, "skipped-row", "Expected a valid YYYY-MM-DD HH:mm:ss date; alternate formats require review.");
      continue;
    }
    const exerciseName = text("Exercise Name").trim();
    if (!exerciseName) { issue("missing-exercise", ref, "skipped-row", "A row without an exercise name was skipped."); continue; }
    const number = (name: string) => {
      const parsed = nonNegativeNumber(get(name));
      if (parsed === null && !isBlank(get(name))) issue("invalid-number", ref, "omitted-field", `Invalid ${name} was omitted.`);
      return parsed;
    };
    const reps = number("Reps");
    if (reps === null && !isBlank(get("Reps"))) { issue("invalid-reps", ref, "skipped-row", "Invalid repetitions: row skipped."); continue; }
    let setOrder = nonNegativeNumber(get("Set Order"));
    if (setOrder !== null && (!Number.isInteger(setOrder) || setOrder < 1)) setOrder = null;
    if (setOrder === null) issue("unknown-set-order", ref, "omitted-field", "Set ordering requires boundary review; original marker retained.");
    let rpe = number("RPE");
    if (rpe !== null && rpe > 10) { issue("invalid-rpe", ref, "omitted-field", "RPE outside 0–10 was omitted."); rpe = null; }
    const rawDuration = text("Duration");
    if (!isBlank(rawDuration) && strongDuration(rawDuration) === null) issue("invalid-duration", ref, "omitted-field", "Unsupported workout duration grammar; original value retained.");
    result.rows.push({ ref, row: index + 1, ...timestamp, title: text("Workout Name"), exerciseName, rawSetOrder: text("Set Order"), setOrder, weight: number("Weight"), reps, distance: number("Distance"), seconds: number("Seconds"), rpe, rawDuration, notes: text("Notes"), workoutNotes: text("Workout Notes") });
  }
  if (!options.weightUnit && result.rows.some(row => row.weight !== null)) result.needs.push("weight-unit");
  if (!options.distanceUnit && result.rows.some(row => row.distance !== null && row.distance > 0)) result.needs.push("distance-unit");
  result.status = result.needs.length ? "needs-input" : "ready";
  return result;
}
