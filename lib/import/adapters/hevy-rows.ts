import * as XLSX from "xlsx";
import type { InspectedInput } from "../inspect-input.ts";
import type { ImportIssue, SourceRow } from "../types.ts";
import { detectFormat } from "../detect-format.ts";
import { isBlank, nonNegativeNumber } from "../value-parsing.ts";
import { kilograms, meters } from "../units.ts";

export interface HevyRow { ref: string; row: number; title: string; startTime: string; endTime: string; date: string; exerciseName: string; exerciseNotes: string; supersetId: string; setIndex: number | null; setType: string; weightKg: number | null; reps: number | null; distanceMeters: number | null; durationSeconds: number | null; rpe: number | null; description: string }
export interface HevyRowsResult { rows: HevyRow[]; issues: ImportIssue[]; sourceSheets: Record<string, string[]>; sourceRows: SourceRow[] }

const datePattern = /^(\d{1,2}) ([A-Za-z]{3}) (\d{4}), (\d{2}):(\d{2})$/;
const months = new Map(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, index) => [month.toLowerCase(), index + 1]));
function parseHevyDate(value: unknown): { date: string; timestamp: string } | null {
  if (typeof value !== "string") return null;
  const match = datePattern.exec(value.trim()); const month = match && months.get(match[2].toLowerCase());
  if (!match || !month || Number(match[1]) < 1 || Number(match[1]) > 31 || Number(match[4]) > 23 || Number(match[5]) > 59) return null;
  const date = `${match[3]}-${String(month).padStart(2, "0")}-${String(Number(match[1])).padStart(2, "0")}`;
  return { date, timestamp: value.trim() };
}

export function parseHevyRows(input: InspectedInput): HevyRowsResult {
  if (detectFormat(input).format !== "hevy") throw new Error("A recognized Hevy CSV is required.");
  const sheet = input.SheetNames[0]; const values = XLSX.utils.sheet_to_json<unknown[]>(input.Sheets[sheet], { header: 1, raw: true, defval: null });
  const headers = (values[0] ?? []).map(value => String(value ?? "")); const index = new Map(headers.map((header, position) => [header.trim().toLowerCase(), position]));
  const result: HevyRowsResult = { rows: [], issues: [], sourceSheets: { [sheet]: headers }, sourceRows: [] };
  const issue = (code: string, ref: string, action: ImportIssue["action"], message: string) => result.issues.push({ code, severity: "warning", rowRefs: [ref], action, message });
  for (let position = 1; position < values.length; position++) {
    const cells = values[position]; const ref = `${sheet}!${position + 1}`;
    result.sourceRows.push({ ref, sheet, row: position + 1, cells: cells.map(value => typeof value === "number" || typeof value === "string" || typeof value === "boolean" ? value : null) });
    if (cells.every(isBlank)) continue;
    const get = (name: string) => cells[index.get(name) ?? -1]; const text = (name: string) => String(get(name) ?? "").trim();
    const start = parseHevyDate(get("start_time")); const end = parseHevyDate(get("end_time"));
    if (!start || !end) { issue("invalid-date", ref, "skipped-row", "Expected Hevy date format D MMM YYYY, HH:mm; row skipped."); continue; }
    const exerciseName = text("exercise_title"); if (!exerciseName) { issue("missing-exercise", ref, "skipped-row", "A row without an exercise title was skipped."); continue; }
    const number = (name: string) => { const value = nonNegativeNumber(get(name)); if (value === null && !isBlank(get(name))) issue("invalid-number", ref, "omitted-field", `Invalid ${name} was omitted.`); return value; };
    const setIndex = number("set_index"); const reps = number("reps"); const weight = number("weight_kg"); const distance = number("distance_km"); const duration = number("duration_seconds"); let rpe = number("rpe");
    if (rpe !== null && rpe > 10) { issue("invalid-rpe", ref, "omitted-field", "RPE outside 0–10 was omitted."); rpe = null; }
    result.rows.push({ ref, row: position + 1, title: text("title"), startTime: start.timestamp, endTime: end.timestamp, date: start.date, exerciseName, exerciseNotes: text("exercise_notes"), supersetId: text("superset_id"), setIndex, setType: text("set_type") || "unknown", weightKg: weight === null ? null : kilograms(weight, "kg"), reps, distanceMeters: distance === null ? null : meters(distance, "km"), durationSeconds: duration, rpe, description: text("description") });
  }
  if (!result.rows.length) throw new Error("No valid Hevy workout rows were found.");
  return result;
}
